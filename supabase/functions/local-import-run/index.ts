// Loumilab Local Importer — Pass 2: bounded website extraction + discovery leads.
// Staff-only. Reads only approved official-website domains, max N pages each,
// never images/reviews/menus. Everything lands in the Review Queue; nothing is published here.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";
const JOBS_PER_RUN = 5;
const MAX_ATTEMPTS = 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Allow only public http(s) hosts; reject credentials, IPs, localhost, metadata hosts. */
function safeUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":") || h === "metadata.google.internal") return null;
    return u;
  } catch { return null; }
}
const domainOf = (u: URL) => u.hostname.toLowerCase().replace(/^www\./, "");

async function firecrawl(path: string, body: unknown) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("FIRECRAWL_API_KEY")!,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

const SCHEMA = {
  type: "object",
  properties: {
    business_name: { type: "string", description: "Official business name" },
    description: { type: "string", description: "One-sentence description of the food business, under 200 characters" },
    category: { type: "string", description: "One of: home-chef, baker, meal-prep, caterer, food-truck, pop-up, desserts, specialty, plate-sales, restaurant" },
    cuisines: { type: "array", items: { type: "string" } },
    city: { type: "string" }, region: { type: "string", description: "US state code" }, postal_code: { type: "string" },
    public_phone: { type: "string" }, public_email: { type: "string" },
    hours_text: { type: "string", description: "Opening hours as short text" },
    offers_pickup: { type: "boolean" }, offers_delivery: { type: "boolean" },
  },
};
const TEXT_FIELDS = ["business_name", "description", "category", "city", "region", "postal_code", "public_phone", "public_email", "hours_text"] as const;

async function loadSettings() {
  const { data } = await admin.from("local_importer_settings").select("*").eq("id", 1).single();
  const s = data as Record<string, any>;
  const today = new Date().toISOString().slice(0, 10);
  if (s.usage_date !== today) {
    await admin.from("local_importer_settings").update({ usage_date: today, pages_used_today: 0 }).eq("id", 1);
    s.usage_date = today; s.pages_used_today = 0;
  }
  return s;
}
async function usePages(s: Record<string, any>, n: number) {
  s.pages_used_today += n;
  await admin.from("local_importer_settings").update({ pages_used_today: s.pages_used_today }).eq("id", 1);
}
const remaining = (s: Record<string, any>) => s.daily_page_limit - s.pages_used_today;

async function sourceFor(domain: string) {
  const { data } = await admin.from("local_sources").select("*").or(`domain.eq.${domain}`).maybeSingle();
  if (data) return data as Record<string, any>;
  // Parent-domain block (e.g. m.facebook.com → facebook.com)
  const { data: blocked } = await admin.from("local_sources").select("domain,status").eq("status", "blocked");
  const hit = (blocked ?? []).find((b: any) => domain === b.domain || domain.endsWith(`.${b.domain}`));
  return hit ?? null;
}

async function processJob(job: Record<string, any>, s: Record<string, any>) {
  const { data: cand } = await admin.from("local_candidates").select("*").eq("id", job.candidate_id).single();
  if (!cand) { await admin.from("local_jobs").update({ state: "cancelled", last_error: "Candidate removed" }).eq("id", job.id); return "cancelled"; }
  const url = safeUrl(cand.website_url);
  if (!url) { await admin.from("local_jobs").update({ state: "failed", last_error: "Website address is not a safe public URL" }).eq("id", job.id); return "failed"; }
  const domain = domainOf(url);

  const src = await sourceFor(domain);
  if (!src) {
    await admin.from("local_sources").upsert({ domain, status: "pending", source_type: "official_website", notes: "Added automatically from an import — review before extraction" }, { onConflict: "domain", ignoreDuplicates: true });
  }
  if (!src || src.status === "pending") { await admin.from("local_jobs").update({ state: "paused", last_error: "Waiting for domain approval in Sources" }).eq("id", job.id); return "awaiting_source"; }
  if (src.status !== "approved") { await admin.from("local_jobs").update({ state: src.status === "blocked" ? "failed" : "paused", last_error: `Source is ${src.status}` }).eq("id", job.id); return "blocked"; }

  // Cooldown: same domain extracted recently
  const since = new Date(Date.now() - s.recrawl_cooldown_days * 86400_000).toISOString();
  const { data: recent } = await admin.from("local_jobs").select("id, candidate:local_candidates!inner(website_domain)").eq("state", "done").neq("id", job.id).gte("updated_at", since).eq("candidate.website_domain", domain).limit(1);
  if (!job.force && recent?.length) { await admin.from("local_jobs").update({ state: "done", last_error: "Skipped: domain checked recently (cooldown)" }).eq("id", job.id); return "cooldown"; }

  const maxPages = Math.min(job.max_pages ?? 4, s.max_pages_per_domain);
  if (remaining(s) < 1) return "budget";
  await admin.from("local_jobs").update({ state: "running", attempts: job.attempts + 1, lease_until: new Date(Date.now() + 5 * 60_000).toISOString() }).eq("id", job.id);

  try {
    const pages = [url.toString()];
    if (maxPages > 1 && remaining(s) > 1) {
      const map = await firecrawl("/map", { url: url.origin, search: "about contact hours location", limit: 30, includeSubdomains: false });
      await usePages(s, 1);
      const links: string[] = (map.links ?? map.data?.links ?? []).map((l: any) => (typeof l === "string" ? l : l?.url)).filter(Boolean);
      for (const l of links) {
        const lu = safeUrl(l);
        if (!lu || domainOf(lu) !== domain) continue;
        if (!/(about|contact|hours|location|visit|find-us)/i.test(lu.pathname)) continue;
        if (src.excluded_paths?.some((p: string) => lu.pathname.startsWith(p))) continue;
        if (!pages.includes(lu.toString())) pages.push(lu.toString());
        if (pages.length >= maxPages) break;
      }
    }

    const found: Record<string, { value: any; source: string }> = {};
    let fetched = 0;
    for (const p of pages) {
      if (remaining(s) < 1) break;
      if (fetched > 0) await sleep(Math.max(src.min_delay_seconds ?? 3, s.min_delay_seconds) * 1000);
      const r = await firecrawl("/scrape", { url: p, formats: [{ type: "json", schema: SCHEMA }], onlyMainContent: true, blockAds: true, timeout: 30000 });
      fetched++; await usePages(s, 1);
      const data = r.json ?? r.data?.json ?? {};
      for (const [k, v] of Object.entries(data ?? {})) {
        if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)) continue;
        if (!found[k]) found[k] = { value: v, source: p };
      }
    }

    const permitted: string[] = src.permitted_fields ?? [];
    const allow = (f: string) => !permitted.length || permitted.includes(f);
    const patch: Record<string, any> = {};
    const evidence: any[] = [];
    const expires = new Date(Date.now() + s.evidence_retention_days * 86400_000).toISOString();
    for (const [k, { value, source }] of Object.entries(found)) {
      if (!allow(k)) continue;
      let v: any = value;
      if (typeof v === "string") v = v.trim().slice(0, k === "description" ? 220 : k === "business_name" ? 120 : 300);
      if (k === "cuisines") v = (Array.isArray(v) ? v : []).map((x: any) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 6);
      if (k === "public_email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) continue;
      const current = cand[k];
      const empty = current === null || current === undefined || current === "" || (Array.isArray(current) && !current.length);
      const conflict = !empty && String(current).toLowerCase() !== String(v).toLowerCase();
      if (empty) patch[k] = v;
      evidence.push({ candidate_id: cand.id, field: k, value: Array.isArray(v) ? v.join(", ") : String(v), source_url: source, excerpt: (Array.isArray(v) ? v.join(", ") : String(v)).slice(0, 500), method: "firecrawl", quality: conflict ? "conflict" : "ok", expires_at: expires });
    }
    if (evidence.length) await admin.from("local_field_evidence").insert(evidence);
    const name = patch.business_name ?? cand.business_name;
    await admin.from("local_candidates").update({
      ...patch, source_url: url.toString(), source_type: "official_website", observed_at: new Date().toISOString(),
      status: cand.status === "needs_extraction" ? (name ? "draft" : "needs_extraction") : cand.status,
      review_notes: name ? cand.review_notes : `${cand.review_notes ? cand.review_notes + " · " : ""}Extraction found no business name`,
    }).eq("id", cand.id);
    await admin.from("local_jobs").update({ state: "done", last_error: evidence.length ? null : "No business details found on the site", lease_until: null }).eq("id", job.id);
    return "done";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const attempts = job.attempts + 1;
    await admin.from("local_jobs").update({
      state: attempts >= MAX_ATTEMPTS ? "failed" : "queued", last_error: msg.slice(0, 500), lease_until: null,
      next_attempt_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    }).eq("id", job.id);
    if (/Firecrawl (402|403)/.test(msg)) throw e; // credits/limits: stop the run
    return "error";
  }
}

async function discover(s: Record<string, any>, marketId: string, category: string, userId: string) {
  const { data: market } = await admin.from("local_markets").select("*").eq("id", marketId).single();
  if (!market) return { error: "Unknown market" };
  if (remaining(s) < 1) return { error: "Daily page limit reached" };
  const query = `${category} food business ${market.name} Maryland official website`;
  const r = await firecrawl("/search", { query, limit: 10, country: "US" });
  await usePages(s, 1);
  const results: any[] = r.data?.web ?? r.data ?? r.web ?? [];
  const { data: blocked } = await admin.from("local_sources").select("domain").in("status", ["blocked", "paused"]);
  const bad = (d: string) => (blocked ?? []).some((b: any) => d === b.domain || d.endsWith(`.${b.domain}`));

  const { data: batch } = await admin.from("local_import_batches").insert({ kind: "urls", filename: `Discovery: ${category} · ${market.name}`, market_id: marketId, created_by: userId }).select("id").single();
  let leads = 0, skipped = 0;
  for (const it of results) {
    const u = safeUrl(it.url);
    if (!u) { skipped++; continue; }
    const d = domainOf(u);
    if (bad(d)) { skipped++; continue; }
    const key = `lead:${d}`;
    const { data: c, error } = await admin.from("local_candidates").insert({
      batch_id: batch?.id, market_id: marketId, status: "needs_extraction", website_url: u.origin,
      category: category || null, idempotency_key: key, source_type: "directory", created_by: userId,
      review_notes: `Search lead — ${String(it.title ?? "").slice(0, 120)}. Verify before publishing.`,
    }).select("id").single();
    if (error || !c) { skipped++; continue; }
    await admin.from("local_sources").upsert({ domain: d, status: "pending", source_type: "official_website", notes: "Found by discovery search — review before extraction" }, { onConflict: "domain", ignoreDuplicates: true });
    await admin.from("local_jobs").insert({ candidate_id: c.id, batch_id: batch?.id, kind: "extract", state: "queued", idempotency_key: `extract:${key}` });
    leads++;
  }
  return { leads, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return json({ error: "Unauthorized" }, 401);
  const { data: staff } = await userClient.rpc("is_staff", { _user_id: userId });
  if (!staff) return json({ error: "Forbidden" }, 403);
  if (!Deno.env.get("FIRECRAWL_API_KEY") || !Deno.env.get("LOVABLE_API_KEY")) return json({ error: "Website reader is not connected" }, 500);

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const s = await loadSettings();
  if (s.kill_switch) return json({ error: "Kill switch is on — turn it off in Settings to run" }, 409);

  try {
    if (body.action === "discover") {
      if (typeof body.market_id !== "string" || typeof body.category !== "string" || body.category.length > 60) return json({ error: "Pick a market and category" }, 400);
      const r = await discover(s, body.market_id, body.category.trim(), userId);
      return json({ ...r, pages_used_today: s.pages_used_today, daily_page_limit: s.daily_page_limit }, "error" in r ? 400 : 200);
    }
    if (s.dispatch_paused) return json({ error: "Dispatch is paused — resume it in Settings" }, 409);
    const limit = Math.min(JOBS_PER_RUN, s.max_domains_per_batch);
    const { data: jobs } = await admin.from("local_jobs").select("*").eq("kind", "extract").eq("state", "queued")
      .lte("next_attempt_at", new Date().toISOString()).order("created_at").limit(limit);
    const results: Record<string, number> = {};
    for (const job of jobs ?? []) {
      if (remaining(s) < 1) {
        await admin.from("local_importer_settings").update({ dispatch_paused: true }).eq("id", 1);
        results.budget = (results.budget ?? 0) + 1; break;
      }
      const r = await processJob(job, s);
      results[r] = (results[r] ?? 0) + 1;
    }
    const { count } = await admin.from("local_jobs").select("id", { count: "exact", head: true }).eq("state", "queued");
    await admin.from("audit_logs").insert({ action: "local.importer_run", actor_id: userId, new_value: { results, pages_used_today: s.pages_used_today } });
    return json({ processed: jobs?.length ?? 0, results, queued_left: count ?? 0, pages_used_today: s.pages_used_today, daily_page_limit: s.daily_page_limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("local-import-run failed:", msg);
    return json({ error: msg }, /Firecrawl 402/.test(msg) ? 402 : 502);
  }
});
