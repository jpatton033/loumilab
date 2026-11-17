import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { mapDomain, normalizeDomain, normalizeQuery } from "../_shared/domainSearch.ts";

const CF = "https://connector-gateway.lovable.dev/cloudflare/client/v4";
const ACCOUNT = "d7014aa99cf391547ff882aa800309f4";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hashKey(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function cf(path: string, init: RequestInit = {}) {
  const lk = Deno.env.get("LOVABLE_API_KEY"), ck = Deno.env.get("CLOUDFLARE_API_KEY");
  if (!lk || !ck) return { status: 0, body: null as any, err: "not_configured" };
  try {
    const r = await fetch(`${CF}/accounts/${ACCOUNT}${path}`, {
      ...init, signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json" },
    });
    const body = await r.json().catch(() => null);
    if (!r.ok || !body?.success) {
      const msg = body?.errors?.[0]?.message ?? `HTTP ${r.status}`;
      return { status: r.status, body, err: r.status === 403 ? `Registrar permission missing: ${msg}` : String(msg).slice(0, 200) };
    }
    return { status: r.status, body, err: null };
  } catch (e) {
    return { status: 0, body: null, err: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "network_error" };
  }
}

const log = (op: string, ok: boolean, http_status: number, error: string | null, surface: string, result_count: number | null) =>
  admin.from("domain_provider_events").insert({ op, ok, http_status, error, surface, result_count }).then(() => {});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const op = b?.op;
  const surface = b?.surface === "spaces" ? "spaces" : "business";
  const user = await requireUser(req);

  if (op === "status") {
    if (!user || !(await admin.rpc("is_staff", { _user_id: user.id })).data) return json({ error: "Forbidden" }, 403);
    const r = await cf("/registrar/domain-search?q=loumilab&limit=1");
    await log("status", !r.err, r.status, r.err, "admin", r.err ? null : 1);
    return json({ connected: !r.err, error: r.err });
  }
  if (op !== "search" && op !== "check") return json({ error: "Unknown operation" }, 400);

  const { data: settings } = await admin.from("domain_settings").select("*").eq("id", 1).maybeSingle();
  if (settings && !settings.enabled) return json({ error: "Domain search is paused. Please try again later.", code: "paused" }, 503);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const who = user ? `u:${user.id}` : `ip:${await hashKey(ip)}`;
  const max = op === "search" ? settings?.searches_per_hour ?? 20 : settings?.checks_per_hour ?? 40;
  const { data: limited } = await admin.rpc("check_and_increment_rate_limit", { _key: `domain_${op}:${who}`, _max_count: max, _window_seconds: 3600 });
  if (limited === true) return json({ error: "Too many searches. Please wait a bit and try again.", code: "rate_limited" }, 429);

  if (op === "search") {
    const q = normalizeQuery(b?.q);
    if (!q) return json({ error: "Enter a name or domain using letters, numbers and hyphens.", code: "invalid" }, 400);
    const r = await cf(`/registrar/domain-search?q=${encodeURIComponent(q)}&limit=12`);
    if (r.err) { await log("search", false, r.status, r.err, surface, null); return json({ error: "Domain search is temporarily unavailable.", code: "provider_unavailable" }, 502); }
    const list = (Array.isArray(r.body?.result?.domains) ? r.body.result.domains : []).map((d: unknown) => mapDomain(d, false)).filter(Boolean);
    await log("search", true, r.status, null, surface, list.length);
    return json({ query: q, results: list });
  }

  const names = (Array.isArray(b?.domains) ? b.domains : [b?.domain]).slice(0, 5).map((d: string) => normalizeDomain(d)).filter(Boolean) as string[];
  if (!names.length) return json({ error: "Enter a full domain, like yourbusiness.com.", code: "invalid" }, 400);
  const r = await cf("/registrar/domain-check", { method: "POST", body: JSON.stringify({ domains: names }) });
  if (r.err) {
    await log("check", false, r.status, r.err, surface, null);
    return json({ results: names.map((name) => ({ name, status: "provider_unavailable", tier: null, pricing: null, reason: null, verified: false })) });
  }
  const list = (Array.isArray(r.body?.result?.domains) ? r.body.result.domains : []).map((d: unknown) => mapDomain(d, true)).filter(Boolean);
  await log("check", true, r.status, null, surface, list.length);
  return json({ results: list, checked_at: new Date().toISOString() });
});
