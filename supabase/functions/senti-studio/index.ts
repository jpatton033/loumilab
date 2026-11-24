// Senti Research Studio API (researchers only). Applies Senti Core v0.1 rules to persistent research sessions.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { entityKey, isContradicted, parseObservation, relationWeight } from "../_shared/sentiEngine.ts";
import { CATEGORIES, CORE_VERSION, RULES_VERSION, SYNTHETIC, assignSplits, evaluate, type Category, type EvalRecord, type RelKind } from "../_shared/sentiCore.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const id = z.string().uuid();
const Body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("health") }),
  z.object({ op: z.literal("create_session"), title: z.string().min(1).max(120) }),
  z.object({ op: z.literal("ingest"), session_id: id, text: z.string().min(3).max(400).optional(),
    actor: z.string().min(1).max(60).optional(), action: z.string().min(1).max(60).optional(), target: z.string().max(60).optional(), outcome: z.string().max(120).optional(),
    negated: z.boolean().optional(), occurred_at: z.string().datetime({ offset: true }).optional(), event_type: z.string().max(40).optional(), attributes: z.record(z.string().max(200)).optional() }),
  z.object({ op: z.literal("relate"), session_id: id, source: z.string().min(1).max(60), predicate: z.string().min(1).max(40), target: z.string().min(1).max(60), kind: z.enum(["fact", "inferred", "hypothesis"]) }),
  z.object({ op: z.literal("revise"), relation_id: id, action: z.enum(["support", "contradict", "supersede", "reject", "set_kind"]), predicate: z.string().min(1).max(40).optional(), kind: z.enum(["fact", "inferred", "hypothesis"]).optional(), note: z.string().max(300).optional() }),
  z.object({ op: z.literal("retrieve"), session_id: id, entity: z.string().max(60).optional(), from: z.string().optional(), to: z.string().optional() }),
  z.object({ op: z.literal("explain"), relation_id: id }),
  z.object({ op: z.literal("run_experiment"), experiment_id: id }),
  z.object({ op: z.literal("seed_synthetic") }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await requireUser(req);
  if (!user) return json({ error: "Sign in required" }, 401);
  const { data: ok } = await admin.rpc("senti_is_researcher", { _uid: user.id });
  if (!ok) return json({ error: "Senti researcher access required" }, 403);
  let raw: unknown; try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const p = Body.safeParse(raw);
  if (!p.success) return json({ error: "Invalid request", details: p.error.flatten().fieldErrors }, 400);
  const b = p.data;

  const studioSession = async (sid: string) => {
    const { data } = await admin.from("senti_sessions").select("id, owner_id").eq("id", sid).eq("scope", "studio").maybeSingle();
    if (!data) return false;
    if (data.owner_id === user.id) return true;
    const { data: staff } = await admin.rpc("is_staff", { _user_id: user.id });
    return !!staff;
  };
  const touchEntity = async (sid: string, label: string, kind = "thing") => {
    const key = entityKey(label) || label.toLowerCase().trim();
    const { data: ex } = await admin.from("senti_entities").select("id, mentions").eq("session_id", sid).eq("key", key).maybeSingle();
    if (ex) await admin.from("senti_entities").update({ mentions: ex.mentions + 1 }).eq("id", ex.id);
    else await admin.from("senti_entities").insert({ session_id: sid, key, label, kind });
    return key;
  };
  const snapshot = (r: Record<string, unknown>, reason: string) => admin.from("senti_relation_versions").insert({ relation_id: r.id, version: r.version, snapshot: r, reason, created_by: user.id });
  const link = async (sid: string, source: string, predicate: string, target: string, polarity: 1 | -1, evidence: string | null, kind: RelKind, valid_at?: string | null) => {
    const { data: ex } = await admin.from("senti_relations").select("*").eq("session_id", sid).eq("source_key", source).eq("target_key", target).eq("predicate", predicate).maybeSingle();
    const support = (ex?.support ?? 0) + (polarity === 1 ? 1 : 0), contradict = (ex?.contradict ?? 0) + (polarity === -1 ? 1 : 0);
    const row = { support, contradict, weight: relationWeight(support, contradict), evidence: evidence ? [...(ex?.evidence ?? []), evidence] : ex?.evidence ?? [], version: (ex?.version ?? 0) + 1, kind: ex?.kind === "fact" ? "fact" : kind, valid_at: valid_at ?? ex?.valid_at ?? null, status: ex?.status === "superseded" || ex?.status === "rejected" ? "active" : ex?.status ?? "active", updated_at: new Date().toISOString() };
    const { data: r, error } = ex ? await admin.from("senti_relations").update(row).eq("id", ex.id).select("*").single()
      : await admin.from("senti_relations").insert({ session_id: sid, source_key: source, target_key: target, predicate, ...row }).select("*").single();
    if (error) throw error;
    await snapshot(r, ex ? (polarity === 1 ? "supported" : "contradicted") : "created");
    return r;
  };

  try {
    if (b.op === "health") {
      const t = performance.now(); const { error } = await admin.from("senti_engine_versions").select("id").limit(1);
      return json({ ok: !error, engine: CORE_VERSION, reader: RULES_VERSION, db_ms: Math.round(performance.now() - t), python_service: Deno.env.get("SENTI_PYTHON_URL") ? "configured" : "not_configured" });
    }
    if (b.op === "seed_synthetic") {
      let made = 0;
      for (const d of SYNTHETIC) {
        const { data: ex } = await admin.from("senti_datasets").select("id").eq("name", d.name).maybeSingle(); if (ex) continue;
        const { data: ds } = await admin.from("senti_datasets").insert({ name: d.name, description: d.description, origin: "Synthetic, written by Loumilab for Senti Core baselines.", permissions: "Internal research use; no personal data.", synthetic: true, created_by: user.id }).select("id").single();
        const sp = assignSplits(d.records);
        await admin.from("senti_dataset_versions").insert({ dataset_id: ds!.id, version: "1.0", records: sp.records, record_count: sp.records.length, splits: sp.splits, schema: { text: "string", expect: "[source, predicate, target][]", time: "string|null", steps: "string[]", query: "string", expectRelated: "string[]", contradicted: "[source, predicate, target]", split: "train|val|test" }, created_by: user.id });
        made++;
      }
      return json({ created: made });
    }
    if (b.op === "create_session") {
      const { data, error } = await admin.from("senti_sessions").insert({ scope: "studio", owner_id: user.id, title: b.title, expires_at: "2999-01-01T00:00:00Z" }).select("id").single();
      if (error) throw error; return json({ id: data.id });
    }
    if (b.op === "ingest") {
      if (!(await studioSession(b.session_id))) return json({ error: "Research session not found" }, 404);
      const sid = b.session_id;
      const { count } = await admin.from("senti_events").select("id", { count: "exact", head: true }).eq("session_id", sid);
      const seq = (count ?? 0) + 1;
      if (b.actor && b.action) {
        const polarity: 1 | -1 = b.negated ? -1 : 1;
        const text = [b.actor, b.negated ? "did not" : "", b.action, b.target ?? "", b.outcome ? `→ ${b.outcome}` : ""].filter(Boolean).join(" ");
        const { data: ev, error } = await admin.from("senti_events").insert({ session_id: sid, seq, text, polarity, source: "studio", event_type: b.event_type ?? "structured", attributes: b.attributes ?? {}, occurred_at: b.occurred_at ?? null, actor_key: entityKey(b.actor), action: b.action, target_key: b.target ? entityKey(b.target) : null, outcome: b.outcome ?? null }).select("id").single();
        if (error) throw error;
        const a = await touchEntity(sid, b.actor, "name"); const pred = entityKey(b.action) || b.action.toLowerCase();
        const out = [];
        if (b.target) out.push(await link(sid, a, pred, await touchEntity(sid, b.target), polarity, ev.id, "fact", b.occurred_at));
        if (b.outcome) out.push(await link(sid, a, "led to", await touchEntity(sid, b.outcome), polarity, ev.id, "fact", b.occurred_at));
        return json({ event_id: ev.id, relations: out });
      }
      if (!b.text) return json({ error: "Give a structured observation (who + action) or text." }, 400);
      const parsed = parseObservation(b.text);
      const { data: ev, error } = await admin.from("senti_events").insert({ session_id: sid, seq, text: b.text, time_hint: parsed.timeHint, polarity: parsed.polarity, source: "studio", event_type: b.event_type ?? "text", occurred_at: b.occurred_at ?? null, attributes: b.attributes ?? {} }).select("id").single();
      if (error) throw error;
      for (const e of parsed.entities) await touchEntity(sid, e.label, e.kind);
      const out = []; for (const r of parsed.relations) out.push(await link(sid, r.source, r.predicate, r.target, r.polarity, ev.id, "inferred", b.occurred_at));
      return json({ event_id: ev.id, reader: RULES_VERSION, parsed, relations: out });
    }
    if (b.op === "relate") {
      if (!(await studioSession(b.session_id))) return json({ error: "Research session not found" }, 404);
      const s = await touchEntity(b.session_id, b.source), t = await touchEntity(b.session_id, b.target);
      return json({ relation: await link(b.session_id, s, entityKey(b.predicate) || b.predicate.toLowerCase(), t, 1, null, b.kind) });
    }
    if (b.op === "revise" || b.op === "explain") {
      const { data: rel } = await admin.from("senti_relations").select("*").eq("id", b.relation_id).maybeSingle();
      if (!rel || !(await studioSession(rel.session_id))) return json({ error: "Relationship not found" }, 404);
      if (b.op === "explain") {
        const [ev, vs, by] = await Promise.all([
          rel.evidence?.length ? admin.from("senti_events").select("id, seq, text, event_type, occurred_at, created_at, polarity, attributes").in("id", rel.evidence) : Promise.resolve({ data: [] }),
          admin.from("senti_relation_versions").select("version, reason, snapshot, created_at").eq("relation_id", rel.id).order("version"),
          rel.superseded_by ? admin.from("senti_relations").select("id, predicate, kind").eq("id", rel.superseded_by).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        return json({ relation: { ...rel, contradicted: isContradicted(rel.support, rel.contradict) }, evidence: ev.data ?? [], versions: vs.data ?? [], superseded_by: by.data });
      }
      const note = b.note ? `: ${b.note}` : "";
      if (b.action === "support" || b.action === "contradict") return json({ relation: await link(rel.session_id, rel.source_key, rel.predicate, rel.target_key, b.action === "support" ? 1 : -1, null, rel.kind) });
      if (b.action === "set_kind") {
        if (!b.kind) return json({ error: "Choose a kind" }, 400);
        const { data: r } = await admin.from("senti_relations").update({ kind: b.kind, version: rel.version + 1 }).eq("id", rel.id).select("*").single();
        await snapshot(r!, `relabelled as ${b.kind}${note}`); return json({ relation: r });
      }
      if (b.action === "reject") {
        const { data: r } = await admin.from("senti_relations").update({ status: "rejected", version: rel.version + 1 }).eq("id", rel.id).select("*").single();
        await snapshot(r!, `rejected${note}`); return json({ relation: r });
      }
      if (!b.predicate) return json({ error: "Give the corrected relationship" }, 400);
      const nr = await link(rel.session_id, rel.source_key, entityKey(b.predicate) || b.predicate.toLowerCase(), rel.target_key, 1, null, "fact");
      await admin.from("senti_relations").update({ evidence: [...new Set([...(nr.evidence ?? []), ...(rel.evidence ?? [])])], revised_from: rel.id }).eq("id", nr.id);
      const { data: r } = await admin.from("senti_relations").update({ status: "superseded", superseded_by: nr.id, version: rel.version + 1 }).eq("id", rel.id).select("*").single();
      await snapshot(r!, `superseded by "${nr.predicate}"${note}`);
      await admin.from("senti_corrections").insert({ session_id: rel.session_id, relation_id: rel.id, action: "supersede", before: { predicate: rel.predicate }, after: { predicate: nr.predicate, id: nr.id } });
      return json({ relation: nr, superseded: r });
    }
    if (b.op === "retrieve") {
      if (!(await studioSession(b.session_id))) return json({ error: "Research session not found" }, 404);
      let q = admin.from("senti_relations").select("*").eq("session_id", b.session_id).eq("status", "active");
      if (b.entity) { const k = entityKey(b.entity) || b.entity.toLowerCase(); q = q.or(`source_key.eq.${k.replace(/[,()]/g, "")},target_key.eq.${k.replace(/[,()]/g, "")}`); }
      let rels = (await q.order("weight", { ascending: false })).data ?? [];
      if (b.from || b.to) {
        const { data: evs } = await admin.from("senti_events").select("id, occurred_at, created_at").eq("session_id", b.session_id);
        const ok = new Set((evs ?? []).filter((e) => { const t = new Date(e.occurred_at ?? e.created_at).getTime(); return (!b.from || t >= new Date(b.from).getTime()) && (!b.to || t <= new Date(b.to).getTime()); }).map((e) => e.id));
        rels = rels.filter((r) => (r.evidence ?? []).some((e: string) => ok.has(e)));
      }
      return json({ relations: rels.map((r) => ({ ...r, contradicted: isContradicted(r.support, r.contradict) })) });
    }
    if (b.op === "run_experiment") {
      const { data: ex } = await admin.from("senti_experiments").select("*").eq("id", b.experiment_id).maybeSingle();
      if (!ex) return json({ error: "Experiment not found" }, 404);
      if (ex.status === "archived") return json({ error: "Archived experiments can't run" }, 400);
      const engine = ex.engine_version ?? CORE_VERSION;
      const { data: ev } = await admin.from("senti_engine_versions").select("status, kind").eq("id", engine).maybeSingle();
      const { data: run } = await admin.from("senti_runs").insert({ experiment_id: ex.id, status: "running", engine_version: engine, dataset_version_id: ex.dataset_version_id, config: ex.config, created_by: user.id }).select("id").single();
      await admin.from("senti_experiments").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", ex.id);
      const fail = async (msg: string) => {
        await admin.from("senti_runs").update({ status: "failed", error: msg, finished_at: new Date().toISOString() }).eq("id", run!.id);
        await admin.from("senti_experiments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", ex.id);
        return json({ run_id: run!.id, status: "failed", error: msg });
      };
      if (!ev || ev.status !== "operational" || ev.kind === "model") return fail(`Engine ${engine} is not operational, so it can't run. No result was recorded.`);
      if (!ex.dataset_version_id) return fail("Choose a dataset version before running.");
      const { data: dv } = await admin.from("senti_dataset_versions").select("records").eq("id", ex.dataset_version_id).maybeSingle();
      const records = (dv?.records ?? []) as EvalRecord[];
      const cats = (Array.isArray(ex.config?.categories) ? ex.config.categories : [ex.category]).filter((c: string) => (CATEGORIES as readonly string[]).includes(c)) as Category[];
      if (!cats.length) return fail(`Category "${ex.category}" has no evaluation yet.`);
      const rows = cats.flatMap((c) => evaluate(c, records));
      await admin.from("senti_eval_results").insert(rows.map((r) => ({ ...r, run_id: run!.id, engine_version: engine, dataset_version_id: ex.dataset_version_id })));
      const metrics = Object.fromEntries(rows.filter((r) => r.status === "measured").map((r) => [`${r.category}.${r.baseline}.${r.metric}`, r.value]));
      await admin.from("senti_runs").update({ status: "completed", metrics, finished_at: new Date().toISOString() }).eq("id", run!.id);
      await admin.from("senti_experiments").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", ex.id);
      return json({ run_id: run!.id, status: "completed", results: rows });
    }
    return json({ error: "Unknown operation" }, 400);
  } catch (e) {
    console.error(e);
    await admin.from("senti_audit").insert({ op: `studio:${b.op}`, ok: false, detail: (e instanceof Error ? e.message : String(e)).slice(0, 300) });
    return json({ error: "The research engine hit an error." }, 500);
  }
});
