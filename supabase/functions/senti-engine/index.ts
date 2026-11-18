import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin } from "../_shared/auth.ts";
import { ENGINE_VERSION, cleanText, entityKey, isContradicted, parseObservation, relationWeight } from "../_shared/sentiEngine.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sha = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const audit = (op: string, ok: boolean, detail?: string) => admin.from("senti_audit").insert({ op, ok, detail: detail?.slice(0, 300) ?? null }).then(() => {});

const Body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("create_session"), consent: z.boolean().optional() }),
  z.object({ op: z.literal("observe"), token: z.string().min(20).max(100), text: z.string().max(400) }),
  z.object({ op: z.literal("graph"), token: z.string().min(20).max(100) }),
  z.object({ op: z.literal("correct"), token: z.string().min(20).max(100), relation_id: z.string().uuid(), action: z.enum(["reject", "relabel", "confirm"]), predicate: z.string().min(2).max(40).optional() }),
  z.object({ op: z.literal("infer"), token: z.string().min(20).max(100), about: z.string().min(2).max(60) }),
  z.object({ op: z.literal("delete_session"), token: z.string().min(20).max(100) }),
  z.object({ op: z.literal("status") }),
]);

async function sessionFor(token: string) {
  const { data } = await admin.from("senti_sessions").select("id, expires_at").eq("token_hash", await sha(token)).maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  await admin.from("senti_sessions").update({ last_active_at: new Date().toISOString() }).eq("id", data.id);
  return data.id as string;
}

async function graph(sid: string) {
  const [e, n, r, c] = await Promise.all([
    admin.from("senti_events").select("id, seq, text, time_hint, polarity, created_at").eq("session_id", sid).order("seq"),
    admin.from("senti_entities").select("key, label, kind, mentions").eq("session_id", sid),
    admin.from("senti_relations").select("id, source_key, target_key, predicate, weight, support, contradict, evidence, status, revised_from, updated_at").eq("session_id", sid).neq("status", "rejected"),
    admin.from("senti_corrections").select("action, before, after, created_at").eq("session_id", sid).order("created_at", { ascending: false }).limit(20),
  ]);
  const relations = (r.data ?? []).map((x) => ({ ...x, contradicted: isContradicted(x.support, x.contradict) }));
  return { engine: ENGINE_VERSION, events: e.data ?? [], entities: n.data ?? [], relations, corrections: c.data ?? [] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  const { data: settings } = await admin.from("senti_settings").select("live_enabled").eq("id", 1).maybeSingle();
  if (b.op === "status") return json({ live: !!settings?.live_enabled, engine: ENGINE_VERSION });
  if (!settings?.live_enabled) return json({ error: "Live research mode is currently off.", code: "unavailable" }, 503);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const { data: limited } = await admin.rpc("check_and_increment_rate_limit", { _key: `senti:${b.op}:${(await sha(ip)).slice(0, 16)}`, _max_count: b.op === "create_session" ? 10 : 120, _window_seconds: 3600 });
  if (limited === true) return json({ error: "Too many requests. Please wait a bit.", code: "rate_limited" }, 429);

  try {
    if (b.op === "create_session") {
      const token = crypto.randomUUID() + crypto.randomUUID();
      const { error } = await admin.from("senti_sessions").insert({ token_hash: await sha(token), training_consent: !!b.consent });
      if (error) throw error;
      await audit("create_session", true);
      return json({ token, engine: ENGINE_VERSION });
    }

    const sid = await sessionFor(b.token);
    if (!sid) return json({ error: "Session not found or expired.", code: "no_session" }, 404);

    if (b.op === "graph") return json(await graph(sid));

    if (b.op === "delete_session") {
      await admin.from("senti_sessions").delete().eq("id", sid);
      await audit("delete_session", true);
      return json({ deleted: true });
    }

    if (b.op === "observe") {
      const text = cleanText(b.text);
      if (!text) return json({ error: "Write a short observation (3–400 characters)." }, 400);
      const { count } = await admin.from("senti_events").select("id", { count: "exact", head: true }).eq("session_id", sid);
      if ((count ?? 0) >= 200) return json({ error: "This session is full. Start a new one." }, 400);
      const p = parseObservation(text);
      const { data: ev, error } = await admin.from("senti_events").insert({ session_id: sid, seq: (count ?? 0) + 1, text, time_hint: p.timeHint, polarity: p.polarity }).select("id").single();
      if (error) throw error;
      for (const e of p.entities) {
        const { data: ex } = await admin.from("senti_entities").select("id, mentions").eq("session_id", sid).eq("key", e.key).maybeSingle();
        if (ex) await admin.from("senti_entities").update({ mentions: ex.mentions + 1 }).eq("id", ex.id);
        else await admin.from("senti_entities").insert({ session_id: sid, key: e.key, label: e.label, kind: e.kind });
      }
      const changes: { predicate: string; source: string; target: string; before: number | null; after: number; contradicted: boolean }[] = [];
      for (const r of p.relations) {
        const { data: ex } = await admin.from("senti_relations").select("*").eq("session_id", sid).eq("source_key", r.source).eq("target_key", r.target).eq("predicate", r.predicate).maybeSingle();
        const support = (ex?.support ?? 0) + (r.polarity === 1 ? 1 : 0);
        const contradict = (ex?.contradict ?? 0) + (r.polarity === -1 ? 1 : 0);
        const weight = relationWeight(support, contradict);
        const row = { support, contradict, weight, evidence: [...(ex?.evidence ?? []), ev.id].slice(-50), updated_at: new Date().toISOString() };
        if (ex) await admin.from("senti_relations").update(row).eq("id", ex.id);
        else await admin.from("senti_relations").insert({ session_id: sid, source_key: r.source, target_key: r.target, predicate: r.predicate, ...row });
        changes.push({ predicate: r.predicate, source: r.source, target: r.target, before: ex?.weight ?? null, after: weight, contradicted: isContradicted(support, contradict) });
      }
      await audit("observe", true);
      return json({ parsed: { entities: p.entities, time: p.timeHint, negated: p.polarity === -1 }, changes, graph: await graph(sid) });
    }

    if (b.op === "correct") {
      const { data: rel } = await admin.from("senti_relations").select("*").eq("id", b.relation_id).eq("session_id", sid).maybeSingle();
      if (!rel) return json({ error: "Relationship not found." }, 404);
      let after: Record<string, unknown>;
      if (b.action === "reject") { after = { status: "rejected" }; await admin.from("senti_relations").update(after).eq("id", rel.id); }
      else if (b.action === "confirm") { const s = rel.support + 1; after = { support: s, weight: relationWeight(s, rel.contradict), status: "corrected" }; await admin.from("senti_relations").update(after).eq("id", rel.id); }
      else {
        if (!b.predicate) return json({ error: "Give the corrected relationship." }, 400);
        const pred = entityKey(b.predicate) || b.predicate.toLowerCase();
        await admin.from("senti_relations").update({ status: "rejected" }).eq("id", rel.id);
        const { data: nr } = await admin.from("senti_relations").upsert({ session_id: sid, source_key: rel.source_key, target_key: rel.target_key, predicate: pred, support: rel.support + 1, contradict: 0, weight: relationWeight(rel.support + 1, 0), evidence: rel.evidence, status: "corrected", revised_from: rel.id }, { onConflict: "session_id,source_key,target_key,predicate" }).select("id").single();
        after = { predicate: pred, id: nr?.id };
      }
      await admin.from("senti_corrections").insert({ session_id: sid, relation_id: rel.id, action: b.action, before: { predicate: rel.predicate, weight: rel.weight, status: rel.status }, after });
      await audit("correct", true);
      return json({ graph: await graph(sid) });
    }

    if (b.op === "infer") {
      const key = entityKey(b.about);
      const g = await graph(sid);
      const rel = g.relations.filter((r) => r.source_key === key || r.target_key === key).sort((a, z) => z.weight - a.weight);
      const evIds = new Set(rel.flatMap((r) => r.evidence));
      return json({ about: key, known: rel.length > 0, relations: rel, evidence: g.events.filter((e) => evIds.has(e.id)) });
    }
    return json({ error: "Unknown operation" }, 400);
  } catch (e) {
    await audit(b.op, false, e instanceof Error ? e.message : String(e));
    return json({ error: "The research engine hit an error.", code: "engine_error" }, 500);
  }
});
