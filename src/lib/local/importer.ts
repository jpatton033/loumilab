import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Loumilab Local Importer — staff-only staging, review and publishing of unclaimed listings. */

const t = (name: string) => supabase.from(name as never) as any;
const rpc = (fn: string, args: Record<string, unknown>) => supabase.rpc(fn as never, args as never);

export interface Candidate {
  id: string; batch_id: string | null; market_id: string | null; status: string;
  business_name: string | null; category: string | null; cuisines: string[];
  city: string | null; region: string | null; postal_code: string | null; service_area: string | null;
  website_url: string | null; public_phone: string | null; public_email: string | null;
  social_links: Record<string, string>; hours_text: string | null;
  offers_pickup: boolean | null; offers_delivery: boolean | null; description: string | null;
  source_url: string | null; source_type: string | null; observed_at: string | null;
  match_kind: "exact" | "probable" | "suppressed" | null; match_profile_id: string | null; match_candidate_id: string | null;
  dup_decision: "distinct" | "link" | null; review_notes: string | null; is_sample: boolean;
  website_domain: string | null; created_at: string;
}

export const CSV_COLUMNS = [
  "business_name", "category", "cuisine_tags", "city", "state", "zip", "service_area", "website",
  "public_business_phone", "public_business_email", "instagram_url", "facebook_url", "hours_text",
  "pickup_available", "delivery_available", "source_url", "source_type", "observed_at",
] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Spreadsheet formula-injection guard for anything we export. */
export const csvSafe = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const templateCsv = () =>
  CSV_COLUMNS.join(",") + "\n" +
  ["Sample Bakery (example)", "bakery", "cakes;pastries", "Baltimore", "MD", "21218", "", "https://example.com", "410-555-0100", "", "", "", "Tue–Sat 8am–4pm", "yes", "no", "https://example.com/contact", "official_website", "2026-10-01"].map(csvSafe).join(",") + "\n";

/** Minimal RFC-4180 parser. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = ""; if (row.some((x) => x.trim())) rows.push(row); row = [];
    } else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
};

const clean = (s?: string) => {
  const v = (s ?? "").replace(/[<>]/g, "").replace(/^'+/, "").trim();
  return v === "" ? null : v;
};
const yesNo = (s?: string) => {
  const v = (s ?? "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(v)) return true;
  if (["no", "n", "false", "0"].includes(v)) return false;
  return null;
};
const httpUrl = (s?: string | null) => {
  const v = clean(s ?? undefined); if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try { const u = new URL(withProto); return ["http:", "https:"].includes(u.protocol) && !u.username ? u.toString() : undefined; } catch { return undefined; }
};

export interface ParsedRow { index: number; data: Partial<Candidate>; errors: string[]; key: string }

export const rowToCandidate = (rec: Partial<Record<CsvColumn, string>>, index: number): ParsedRow => {
  const errors: string[] = [];
  const website = httpUrl(rec.website);
  const source = httpUrl(rec.source_url);
  if (website === undefined) errors.push("Website isn't a valid web address");
  if (source === undefined) errors.push("Source URL isn't a valid web address");
  const ig = httpUrl(rec.instagram_url); const fb = httpUrl(rec.facebook_url);
  const social: Record<string, string> = {};
  if (ig) social.instagram = ig; if (fb) social.facebook = fb;
  const email = clean(rec.public_business_email);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("Email looks invalid");
  const zip = clean(rec.zip);
  if (zip && !/^\d{5}$/.test(zip)) errors.push("ZIP must be 5 digits");
  const name = clean(rec.business_name);
  if (!name && !website) errors.push("Needs a business name or a website");
  const observed = clean(rec.observed_at);
  const data: Partial<Candidate> = {
    business_name: name, category: clean(rec.category),
    cuisines: (clean(rec.cuisine_tags) ?? "").split(/[;|]/).map((x) => x.trim()).filter(Boolean).slice(0, 6),
    city: clean(rec.city), region: clean(rec.state), postal_code: zip, service_area: clean(rec.service_area),
    website_url: website || null, public_phone: clean(rec.public_business_phone), public_email: email,
    social_links: social, hours_text: clean(rec.hours_text)?.slice(0, 400) ?? null,
    offers_pickup: yesNo(rec.pickup_available), offers_delivery: yesNo(rec.delivery_available),
    source_url: source || null, source_type: clean(rec.source_type) ?? "csv",
    observed_at: observed && !isNaN(Date.parse(observed)) ? new Date(observed).toISOString() : null,
    status: name ? "draft" : "needs_extraction",
  };
  const key = [name, data.city, data.website_url, data.public_phone].map((x) => (x ?? "").toString().toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");
  return { index, data, errors, key };
};

const sha256 = async (s: string) => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
};

export const useMarkets = () =>
  useQuery({ queryKey: ["local-imp", "markets"], queryFn: async () => {
    const { data, error } = await t("local_markets").select("*").order("name"); if (error) throw error;
    return data as { id: string; slug: string; name: string; state: string; is_active: boolean }[];
  } });

export const useCandidates = (status?: string) =>
  useQuery({ queryKey: ["local-imp", "candidates", status], queryFn: async () => {
    let q = t("local_candidates").select("*").order("created_at", { ascending: false }).limit(500);
    if (status) q = q.eq("status", status);
    const { data, error } = await q; if (error) throw error; return data as Candidate[];
  } });

export const useImporterCounts = () =>
  useQuery({ queryKey: ["local-imp", "counts"], queryFn: async () => {
    const head = (table: string, f?: (q: any) => any) => { let q = t(table).select("id", { count: "exact", head: true }); if (f) q = f(q); return q; };
    const [all, drafts, dups, ext, pub, claims, reqs, jobsQ, jobsF] = await Promise.all([
      head("local_candidates"), head("local_candidates", (q) => q.eq("status", "draft")),
      head("local_candidates", (q) => q.not("match_kind", "is", null)),
      head("local_candidates", (q) => q.eq("status", "needs_extraction")),
      head("merchant_local_profiles", (q) => q.eq("ownership_status", "unclaimed").eq("is_listed", true)),
      head("local_claims", (q) => q.eq("status", "pending")), head("local_requests", (q) => q.eq("status", "pending")),
      head("local_jobs", (q) => q.in("state", ["queued", "running", "waiting_config"])), head("local_jobs", (q) => q.eq("state", "failed")),
    ]);
    return { total: all.count ?? 0, drafts: drafts.count ?? 0, duplicates: dups.count ?? 0, needsExtraction: ext.count ?? 0,
      published: pub.count ?? 0, claims: claims.count ?? 0, requests: reqs.count ?? 0, jobsPending: jobsQ.count ?? 0, jobsFailed: jobsF.count ?? 0 };
  } });

const useInvalidate = () => { const qc = useQueryClient(); return () => { qc.invalidateQueries({ queryKey: ["local-imp"] }); qc.invalidateQueries({ queryKey: ["local-search"] }); }; };

export const useImportRows = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (i: { kind: "csv" | "manual" | "urls"; rows: Partial<Candidate>[]; filename?: string; raw?: string; marketId?: string | null; sample?: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const hash = i.raw ? await sha256(i.raw) : null;
      let batchId: string | null = null;
      if (i.kind !== "manual") {
        if (hash) {
          const { data: prior } = await t("local_import_batches").select("id").eq("file_hash", hash).maybeSingle();
          if (prior) batchId = prior.id;
        }
        if (!batchId) {
          const { data, error } = await t("local_import_batches").insert({ kind: i.kind, filename: i.filename ?? null, file_hash: hash, row_count: i.rows.length, market_id: i.marketId ?? null, created_by: u.user?.id }).select("id").single();
          if (error) throw error; batchId = data.id;
        }
      }
      const records = await Promise.all(i.rows.map(async (r) => ({
        ...r, batch_id: batchId, market_id: i.marketId ?? null, is_sample: !!i.sample, created_by: u.user?.id,
        idempotency_key: await sha256([r.business_name, r.city, r.website_url, r.public_phone, r.postal_code].map((x) => (x ?? "").toString().toLowerCase().trim()).join("|")),
      })));
      const { data, error } = await t("local_candidates").upsert(records, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id");
      if (error) throw error;
      const created = (data ?? []) as { id: string }[];
      // URL-only candidates get an extraction job that waits for the crawler connection.
      const urlOnly = records.filter((r) => r.status === "needs_extraction");
      if (urlOnly.length) {
        const { data: cs } = await t("local_candidates").select("id,idempotency_key").in("idempotency_key", urlOnly.map((r) => r.idempotency_key));
        if (cs?.length) await t("local_jobs").upsert(cs.map((c: any) => ({ candidate_id: c.id, batch_id: batchId, kind: "extract", state: "waiting_config", idempotency_key: `extract:${c.idempotency_key}` })), { onConflict: "idempotency_key", ignoreDuplicates: true });
      }
      return { created: created.length, skipped: records.length - created.length };
    },
    onSuccess: inv,
  });
};

export const useUpdateCandidate = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Candidate> }) => {
      const { error } = await t("local_candidates").update(patch).eq("id", id); if (error) throw error;
    }, onSuccess: inv,
  });
};

export const usePublishCandidates = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ ids, notes }: { ids: string[]; notes?: string }) => {
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const id of ids) {
        const { error } = await rpc("publish_local_candidate", { _id: id, _notes: notes ?? null });
        results.push({ id, ok: !error, error: error?.message });
      }
      return results;
    }, onSuccess: inv,
  });
};

export const usePublishedUnclaimed = () =>
  useQuery({ queryKey: ["local-imp", "published"], queryFn: async () => {
    const { data, error } = await t("merchant_local_profiles").select("id,slug,display_name,city,region,service_area_label,website_url,public_phone,is_listed,ownership_status,source_kind,last_checked_at,created_at,merchant_id").neq("source_kind", "merchant").order("created_at", { ascending: false });
    if (error) throw error; return data as any[];
  } });

export const useSuppressProfile = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
    const { error } = await rpc("suppress_local_profile", { _profile_id: id, _reason: reason ?? null }); if (error) throw error;
  }, onSuccess: inv });
};

export const useClaimsAndRequests = () =>
  useQuery({ queryKey: ["local-imp", "claims"], queryFn: async () => {
    const [c, r] = await Promise.all([
      t("local_claims").select("*, profile:merchant_local_profiles(slug,display_name,website_url)").order("created_at", { ascending: false }).limit(200),
      t("local_requests").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (c.error) throw c.error; if (r.error) throw r.error;
    return { claims: c.data as any[], requests: r.data as any[] };
  } });

export const useDecide = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: async (i: { type: "claim" | "request"; id: string; approve: boolean; notes?: string }) => {
    const { error } = i.type === "claim"
      ? await rpc("decide_local_claim", { _claim_id: i.id, _approve: i.approve, _notes: i.notes ?? null })
      : await rpc("decide_local_request", { _request_id: i.id, _approve: i.approve, _notes: i.notes ?? null });
    if (error) throw error;
  }, onSuccess: inv });
};

export const useSources = () =>
  useQuery({ queryKey: ["local-imp", "sources"], queryFn: async () => {
    const { data, error } = await t("local_sources").select("*").order("status").order("domain"); if (error) throw error; return data as any[];
  } });

export const useSaveSource = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: async (s: { domain: string; status: string; source_type?: string; notes?: string }) => {
    const { data: u } = await supabase.auth.getUser();
    const domain = s.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Enter a domain like example.com");
    const { error } = await t("local_sources").upsert({ domain, status: s.status, source_type: s.source_type ?? "official_website", notes: s.notes ?? null, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "domain" });
    if (error) throw error;
  }, onSuccess: inv });
};

export const useJobs = () =>
  useQuery({ queryKey: ["local-imp", "jobs"], queryFn: async () => {
    const { data, error } = await t("local_jobs").select("*, candidate:local_candidates(website_url,business_name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error; return data as any[];
  } });

export const useImporterSettings = () =>
  useQuery({ queryKey: ["local-imp", "settings"], queryFn: async () => {
    const { data, error } = await t("local_importer_settings").select("*").eq("id", 1).single(); if (error) throw error; return data as Record<string, any>;
  } });

export const useSaveSettings = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: async (patch: Record<string, unknown>) => {
    const { error } = await t("local_importer_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1); if (error) throw error;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({ action: "local.importer_settings_updated", actor_id: u.user?.id ?? null, actor_email: u.user?.email ?? null, new_value: patch } as never);
  }, onSuccess: inv });
};

/** Public: claims and requests. */
export const submitClaim = async (slug: string, contactName: string, role: string, evidence: string) => {
  const { error } = await rpc("submit_local_claim", { _slug: slug, _contact_name: contactName, _role: role, _evidence: evidence });
  if (error) throw error;
};
export const submitRequest = async (slug: string, kind: "correction" | "removal", name: string, email: string, message: string) => {
  const { error } = await rpc("submit_local_request", { _slug: slug, _kind: kind, _name: name, _email: email, _message: message });
  if (error) throw error;
};
