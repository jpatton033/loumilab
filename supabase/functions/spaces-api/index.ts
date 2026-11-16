import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { unzipSync, zipSync, strToU8, strFromU8 } from "npm:fflate@0.8.2";
import { admin, requireUser } from "../_shared/auth.ts";
import { signServe } from "../_shared/spacesToken.ts";
import { agreementBlocks, AGREEMENT_REQUIRED } from "../_shared/spacesAgreement.ts";
import { syncEdge, recheckEdge, edgeUrl } from "../_shared/spacesEdge.ts";
import { validateManifest, validateFiles, checkEntryHtml, contentType, LIMITS, SPEC_VERSION, classifyArchive, checkZipEntry, preservable, statusForKind, UNZIP_LIMITS, type Classification } from "../_shared/spacesSpec.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const BUCKET = "spaces-artifacts";
const store = () => admin.storage.from(BUCKET);

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deploy"), app_id: z.string().uuid(), upload_path: z.string().max(300), mode: z.enum(["publish", "preserve"]).optional(), notes: z.string().max(500).optional() }),
  z.object({ action: z.literal("rollback"), app_id: z.string().uuid(), version_id: z.string().uuid() }),
  z.object({ action: z.literal("export"), app_id: z.string().uuid() }),
  z.object({ action: z.literal("passport"), app_id: z.string().uuid() }),
  z.object({ action: z.literal("open"), slug: z.string().max(60) }),
  z.object({ action: z.literal("edge_sync"), app_id: z.string().uuid() }),
  z.object({ action: z.literal("edge_check"), app_id: z.string().uuid() }),
]);

async function canManage(app: string, uid: string) {
  const { data } = await admin.rpc("spaces_can_manage_app", { _app: app, _uid: uid });
  return data === true;
}
async function canView(app: string, uid: string) {
  const { data } = await admin.rpc("spaces_can_view_app", { _app: app, _uid: uid });
  return data === true;
}
const event = (app: { id: string; workspace_id: string }, kind: string, detail: unknown, actor: string | null) =>
  admin.from("spaces_passport_events").insert({ app_id: app.id, workspace_id: app.workspace_id, kind, detail, actor_id: actor });

async function buildPassport(appId: string) {
  const { data: app } = await admin.from("spaces_apps").select("*").eq("id", appId).single();
  const { data: versions } = await admin.from("spaces_versions").select("id,number,status,file_count,total_bytes,manifest,notes,created_at").eq("app_id", appId).order("number");
  const { data: events } = await admin.from("spaces_passport_events").select("kind,detail,created_at").eq("app_id", appId).order("created_at");
  return {
    passportVersion: "1.0", specVersion: SPEC_VERSION, generatedAt: new Date().toISOString(),
    app: { id: app.id, slug: app.slug, name: app.name, description: app.description, builtWith: app.built_with, tags: app.tags, createdAt: app.created_at, currentVersionId: app.current_version_id },
    versions: versions ?? [],
    history: events ?? [],
    ownership: await (async () => {
      const { data: d } = await admin.from("spaces_official_designations").select("product_name,verified_at,revoked_at").eq("app_id", appId).maybeSingle();
      const official = !!d && !d.revoked_at;
      return {
        verified: true,
        official,
        owner: official ? "Loumilab" : "Independent (workspace owner)",
        hostingProvider: "Loumilab Spaces",
        note: "Hosting on Loumilab Spaces does not make an app an official Loumilab product.",
        ...(official ? { product: d!.product_name, verificationAuthority: "Loumilab", verifiedAt: d!.verified_at } : {}),
      };
    })(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let body: z.infer<typeof Body>;
  try { const p = Body.safeParse(await req.json()); if (!p.success) return json({ error: "Invalid request" }, 400); body = p.data; }
  catch { return json({ error: "Invalid JSON" }, 400); }
  const user = await requireUser(req);

  if (body.action === "open") {
    const { data: app } = await admin.from("spaces_apps").select("id,name,visibility,status,current_version_id,workspace_id").eq("slug", body.slug).maybeSingle();
    const allowed = app && app.current_version_id && app.status === "active" &&
      (app.visibility === "link" || (user && await canView(app.id, user.id)));
    if (!allowed) return json({ error: "This app is unavailable or private." }, 404);
    const token = await signServe({ a: app.id, v: app.current_version_id!, e: Math.floor(Date.now() / 1000) + 3600 });
    const { data: ver } = await admin.from("spaces_versions").select("manifest").eq("id", app.current_version_id!).single();
    const entry = (ver?.manifest as { entry?: string } | null)?.entry ?? "index.html";
    return json({ name: app.name, base: `${Deno.env.get("SUPABASE_URL")}/functions/v1/spaces-serve/${token}/`, entry });
  }

  if (!user) return json({ error: "Sign in required" }, 401);
  const { data: app } = await admin.from("spaces_apps").select("*").eq("id", body.app_id).maybeSingle();
  if (!app) return json({ error: "App not found" }, 404);

  if (body.action === "passport") {
    if (!await canView(app.id, user.id)) return json({ error: "Not allowed" }, 403);
    return json(await buildPassport(app.id));
  }
  if (!await canManage(app.id, user.id)) return json({ error: "You don't have permission to manage this app." }, 403);

  // Governed hosting actions require the current Spaces agreement once one is published and effective.
  const governed = body.action === "deploy" || body.action === "rollback" || (body.action === "edge_sync" && app.visibility === "link" && app.status === "active");
  if (governed && await agreementBlocks(user.id)) return json({ error: AGREEMENT_REQUIRED, code: "agreement_required" }, 403);

  if (body.action === "deploy") {
    if (!body.upload_path.startsWith(`uploads/${app.id}/`) || body.upload_path.includes("..")) return json({ error: "Invalid upload" }, 400);
    const { data: blob, error } = await store().download(body.upload_path);
    if (error || !blob) return json({ error: "Upload not found" }, 404);
    if (blob.size > LIMITS.maxZipBytes) return json({ error: "ZIP is over 50 MB." }, 400);
    // Safe unpack: every entry header is checked before inflation (paths, depth, size, ratio, count, duplicates).
    const unzipErrors: string[] = []; const seen = new Set<string>(); let unpacked = 0, count = 0;
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(new Uint8Array(await blob.arrayBuffer()), { filter: (f) => {
        if (f.name.endsWith("/")) return false;
        const e = checkZipEntry(f.name, f.size, f.originalSize);
        if (e) { unzipErrors.push(e); return false; }
        if (seen.has(f.name)) { unzipErrors.push(`Duplicate file name: ${f.name}`); return false; }
        seen.add(f.name); count++; unpacked += f.originalSize;
        if (count > UNZIP_LIMITS.maxEntries || unpacked > LIMITS.maxUnpackedBytes) { unzipErrors.push("Archive is too large once unpacked (150 MB / 10,000 files)."); return false; }
        return !/(^|\/)node_modules\//.test(f.name);
      } });
    } catch { return json({ error: "That file isn't a readable ZIP." }, 400); }
    const { data: last } = await admin.from("spaces_versions").select("number").eq("app_id", app.id).order("number", { ascending: false }).limit(1).maybeSingle();
    const number = (last?.number ?? 0) + 1;
    const fail = async (errors: string[], warnings: string[], extra: Record<string, unknown> = {}) => {
      await admin.from("spaces_versions").insert({ app_id: app.id, number, status: "failed", validation: { errors, warnings }, created_by: user.id, notes: body.notes, ...extra });
      await event(app, "deploy_failed", { number, errors: errors.slice(0, 5) }, user.id);
      await store().remove([body.upload_path]);
      return json({ ok: false, errors, warnings, ...extra }, 422);
    };
    if (unzipErrors.length) return await fail([...new Set(unzipErrors)].slice(0, 50), []);

    const isExport = "passport.json" in files && Object.keys(files).some((p) => p.startsWith("app/"));
    const text = (p: string) => (files[p] && files[p].length < 512 * 1024 ? strFromU8(files[p]) : null);
    const cls: Classification = isExport
      ? { kind: "static", reasons: ["Spaces export package."], compiledRoot: "app/", services: [], framework: null }
      : classifyArchive(Object.keys(files), text);
    const publish = body.mode !== "preserve" && cls.kind === "static";
    const errors: string[] = [], warnings: string[] = [];

    // Preservation copy (source, secrets removed) whenever the upload isn't only compiled output.
    const preserveSet = Object.fromEntries(Object.entries(files).filter(([p]) => preservable(p)));
    const hasSource = !isExport && Object.keys(files).some((p) => /(^|\/)package\.json$/.test(p) || !p.startsWith(cls.compiledRoot ?? "\0"));

    let manifest: Record<string, unknown> | null = null;
    let fv: ReturnType<typeof validateFiles> | null = null;
    let source: Record<string, Uint8Array> = {};
    if (publish) {
      const manifestKey = isExport ? "spaces.json" : Object.keys(files).find((p) => /(^|\/)spaces\.json$/.test(p) && p.split("/").length <= 2);
      let manifestRaw: unknown = null;
      if (manifestKey && files[manifestKey]) { try { manifestRaw = JSON.parse(strFromU8(files[manifestKey])); } catch { errors.push("spaces.json isn't valid JSON."); } }
      if (manifestRaw) { const r = validateManifest(manifestRaw); errors.push(...r.errors); warnings.push(...r.warnings); manifest = r.manifest as unknown as Record<string, unknown> ?? null; }
      else if (!errors.length) warnings.push("No spaces.json found. Spaces used defaults; add one to describe your app.");
      const entry = (manifest?.entry as string) ?? "index.html";
      const root = cls.compiledRoot ?? "";
      source = Object.fromEntries(Object.entries(files).filter(([p]) => p.startsWith(root)).map(([p, d]) => [p.slice(root.length), d]));
      fv = validateFiles(Object.entries(source).map(([path, d]) => ({ path, size: d.length })), entry);
      errors.push(...fv.errors); warnings.push(...fv.warnings.filter((w) => !w.startsWith("This looks like source")));
      const entryBytes = fv.root !== null ? source[fv.root + entry] : undefined;
      if (entryBytes) warnings.push(...checkEntryHtml(strFromU8(entryBytes)));
      if (errors.length) return await fail(errors, warnings, { kind: cls.kind, classification: cls });
    }
    const status = publish ? "ready" : body.mode === "preserve" && cls.kind === "static" ? "preserved" : statusForKind(cls.kind);
    const total = fv ? fv.kept.reduce((s, f) => s + f.size, 0) : Object.values(preserveSet).reduce((s, d) => s + d.length, 0);
    const { data: ver, error: vErr } = await admin.from("spaces_versions").insert({
      app_id: app.id, number, status, kind: cls.kind, has_compiled: false, classification: cls,
      file_count: fv ? fv.kept.length : Object.keys(preserveSet).length, total_bytes: total, manifest,
      validation: { errors, warnings, imported: isExport, reasons: cls.reasons }, created_by: user.id, notes: body.notes,
    }).select("id").single();
    if (vErr || !ver) return json({ error: "Could not record version" }, 500);

    let source_path: string | null = null;
    if (hasSource || !publish) {
      source_path = `source/${app.id}/${ver.id}/source.zip`;
      const { error: sErr } = await store().upload(source_path, zipSync(preserveSet, { level: 6 }), { contentType: "application/zip", upsert: true });
      if (sErr) source_path = null;
    }
    if (publish && fv) {
      const queue = [...fv.kept];
      const worker = async () => {
        for (let f = queue.shift(); f; f = queue.shift()) {
          const { error: uErr } = await store().upload(`sites/${app.id}/${ver.id}/${f.path}`, source[fv!.root + f.path], { contentType: contentType(f.path), upsert: true });
          if (uErr) throw new Error(uErr.message);
        }
      };
      try { await Promise.all(Array.from({ length: 8 }, worker)); }
      catch (e) {
        await admin.from("spaces_versions").update({ status: "failed", source_path, validation: { errors: ["Storing files failed: " + (e as Error).message], warnings } }).eq("id", ver.id);
        await store().remove([body.upload_path]);
        return json({ error: "Storing files failed. Try again." }, 500);
      }
    }
    await admin.from("spaces_versions").update({ has_compiled: publish, source_path }).eq("id", ver.id);
    await store().remove([body.upload_path]);
    if (publish) {
      await admin.from("spaces_apps").update({ current_version_id: ver.id }).eq("id", app.id);
      await event(app, isExport ? "imported" : "deployed", { number, files: fv!.kept.length, bytes: total, version: manifest?.version ?? null }, user.id);
      const edge = await syncEdge(app, ver.id, (manifest?.entry as string) ?? "index.html");
      await event(app, "edge_" + edge.edge_status, { number, url: edgeUrl(app.slug) }, user.id);
      return json({ ok: true, published: true, status, kind: cls.kind, reasons: cls.reasons, version_id: ver.id, number, warnings, edge });
    } else await event(app, "preserved", { number, kind: cls.kind, files: Object.keys(preserveSet).length }, user.id);
    return json({ ok: true, published: publish, status, kind: cls.kind, reasons: cls.reasons, version_id: ver.id, number, warnings });
  }

  if (body.action === "rollback") {
    const { data: ver } = await admin.from("spaces_versions").select("id,number,status").eq("id", body.version_id).eq("app_id", app.id).maybeSingle();
    if (!ver || ver.status !== "ready") return json({ error: "That version can't be restored." }, 400);
    await admin.from("spaces_apps").update({ current_version_id: ver.id }).eq("id", app.id);
    await event(app, "rolled_back", { number: ver.number }, user.id);
    const { data: v2 } = await admin.from("spaces_versions").select("manifest").eq("id", ver.id).single();
    const edge = await syncEdge(app, ver.id, (v2?.manifest as { entry?: string } | null)?.entry ?? "index.html");
    return json({ ok: true, edge });
  }

  if (body.action === "edge_sync") {
    const { data: v } = app.current_version_id ? await admin.from("spaces_versions").select("manifest").eq("id", app.current_version_id).single() : { data: null };
    return json(await syncEdge(app, app.current_version_id, (v?.manifest as { entry?: string } | null)?.entry ?? "index.html"));
  }
  if (body.action === "edge_check") return json(await recheckEdge(app));

  // export
  if (!app.current_version_id) return json({ error: "Deploy a version before exporting." }, 400);
  const { data: ver } = await admin.from("spaces_versions").select("*").eq("id", app.current_version_id).single();
  const prefix = `sites/${app.id}/${ver.id}`;
  const out: Record<string, Uint8Array> = {};
  const walk = async (dir: string): Promise<void> => {
    const { data } = await store().list(dir, { limit: 1000 });
    for (const item of data ?? []) {
      const full = `${dir}/${item.name}`;
      if (item.id === null) await walk(full);
      else { const { data: f } = await store().download(full); if (f) out["app/" + full.slice(prefix.length + 1)] = new Uint8Array(await f.arrayBuffer()); }
    }
  };
  await walk(prefix);
  const passport = await buildPassport(app.id);
  const manifest = ver.manifest ?? { specVersion: SPEC_VERSION, name: app.name, version: `0.0.${ver.number}`, type: "static", entry: "index.html", builtWith: app.built_with };
  if (ver.source_path) { const { data: src } = await store().download(ver.source_path); if (src) out["source.zip"] = new Uint8Array(await src.arrayBuffer()); }
  out["spaces.json"] = strToU8(JSON.stringify(manifest, null, 2));
  out["passport.json"] = strToU8(JSON.stringify(passport, null, 2));
  out["README.md"] = strToU8(`# ${app.name}\n\nPortable export from Loumilab Spaces (${new Date().toISOString().slice(0, 10)}).\n\n- \`app/\` — the built application. Host it on any static web host (open app/index.html).\n- \`spaces.json\` — Spaces App Specification manifest.\n- \`passport.json\` — identity, versions and history.\n\nTo bring it back into Spaces, create an app and upload this ZIP on the Deploy tab.\n`);
  const zip = zipSync(out, { level: 6 });
  const path = `exports/${app.id}/${Date.now()}.zip`;
  const { error: upErr } = await store().upload(path, zip, { contentType: "application/zip" });
  if (upErr) return json({ error: "Export failed" }, 500);
  const { data: signed } = await store().createSignedUrl(path, 600, { download: `${app.slug}-v${ver.number}.zip` });
  await event(app, "exported", { number: ver.number, bytes: zip.length }, user.id);
  return json({ url: signed?.signedUrl });
});
