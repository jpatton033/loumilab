// Deterministic backend dependency detection and env-var safety rules for Spaces (no AI).
export type DepStatus = "detected" | "configuration_required" | "manual_migration" | "verified" | "not_verified";
export type Confidence = "high" | "medium" | "low";
export interface Dependency {
  id: string; label: string; evidence: string[]; confidence: Confidence;
  required: string[]; spacesCanConfigure: boolean; externalSetup: boolean; status: DepStatus;
}

const isCode = (p: string) => /\.(t|j)sx?$|\.mjs$/.test(p) && !/(^|\/)node_modules\//.test(p);

export function detectDependencies(paths: string[], read: (p: string) => string | null): Dependency[] {
  const out = new Map<string, Dependency>();
  const add = (id: string, label: string, ev: string, base: Partial<Dependency>) => {
    const d = out.get(id) ?? { id, label, evidence: [], confidence: "low", required: [], spacesCanConfigure: false, externalSetup: true, status: "detected", ...base } as Dependency;
    if (!d.evidence.includes(ev) && d.evidence.length < 8) d.evidence.push(ev);
    const rank = { low: 0, medium: 1, high: 2 };
    if (base.confidence && rank[base.confidence] > rank[d.confidence]) d.confidence = base.confidence;
    out.set(id, d);
  };
  const pkgPath = paths.filter((p) => /(^|\/)package\.json$/.test(p) && !p.includes("node_modules/")).sort((a, b) => a.length - b.length)[0];
  let deps: Record<string, string> = {};
  if (pkgPath) { try { const j = JSON.parse(read(pkgPath) ?? "{}"); deps = { ...j.dependencies, ...j.devDependencies }; } catch { /* ignore */ } }
  const sb = { required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"], spacesCanConfigure: true, status: "configuration_required" as DepStatus };
  if (deps["@supabase/supabase-js"]) add("supabase_db", "Supabase database", "package.json: @supabase/supabase-js", { ...sb, confidence: "medium" });
  if (deps["vite"]) add("vite", "React/Vite frontend", "package.json: vite", { confidence: "high", externalSetup: false, spacesCanConfigure: true, required: [] });
  if (deps["@stripe/stripe-js"] || deps["stripe"]) add("stripe", "Stripe payments", `package.json: ${deps["stripe"] ? "stripe" : "@stripe/stripe-js"}`, { confidence: "medium", required: ["Server-side payment endpoint", "Stripe webhook endpoint"], status: "configuration_required" });

  for (const p of paths) {
    if (/(^|\/)supabase\/migrations\/.+\.sql$/.test(p)) {
      add("supabase_db", "Supabase database", `migration: ${p}`, { ...sb, confidence: "high" });
      const sql = read(p) ?? "";
      if (/enable row level security|create policy/i.test(sql)) add("supabase_rls", "Row Level Security policies", p, { confidence: "high", status: "manual_migration", required: ["Apply migrations in your own Supabase project"] });
      if (/storage\.buckets/i.test(sql)) add("supabase_storage", "Supabase storage buckets", p, { confidence: "high", status: "manual_migration", required: ["Create buckets in your Supabase project"] });
    }
    const fn = p.match(/(^|\/)supabase\/functions\/([^_/][^/]*)\/index\.ts$/);
    if (fn) add("supabase_functions", "Supabase Edge Functions", `function: ${fn[2]}`, { confidence: "high", status: "manual_migration", required: ["Deploy functions to your Supabase project"] });
    if (/(^|\/)supabase\/config\.toml$/.test(p)) add("supabase_db", "Supabase database", p, { ...sb, confidence: "high" });
    if (/(^|\/)\.env\.example$/.test(p)) {
      for (const m of (read(p) ?? "").matchAll(/^\s*([A-Z][A-Z0-9_]+)\s*=/gm)) add("env_example", "Variables listed in .env.example", m[1], { confidence: "high", required: [], spacesCanConfigure: true, externalSetup: false, status: "configuration_required" });
    }
    if (!isCode(p)) continue;
    const src = read(p) ?? "";
    if (/createClient\s*\(/.test(src) && /supabase/i.test(src)) add("supabase_db", "Supabase database", `client init: ${p}`, { ...sb, confidence: "high" });
    if (/\.auth\.(signInWith|signUp|resetPasswordForEmail|onAuthStateChange)/.test(src)) add("supabase_auth", "Supabase authentication", p, { confidence: "high", status: "not_verified", required: ["Site URL and redirect URLs set to the Spaces address"] });
    if (/functions\.invoke\(/.test(src)) add("supabase_functions", "Supabase Edge Functions", `invoke: ${p}`, { confidence: "high", status: "manual_migration", required: ["Deploy functions to your Supabase project"] });
    if (/loadStripe\(|checkout\.sessions|paymentIntents|webhooks\.constructEvent|stripe\.accounts/.test(src)) add("stripe", "Stripe payments", p, { confidence: "high", required: ["Server-side payment endpoint", "Stripe webhook endpoint"], status: "configuration_required" });
    for (const m of src.matchAll(/fetch\(\s*["'`](https:\/\/[a-z0-9.-]+)/gi)) add("external_api", "External REST APIs", m[1], { confidence: "medium", status: "not_verified", required: [] });
  }
  return [...out.values()];
}

// ---- env var safety ----
export const ENV_NAME = /^[A-Z][A-Z0-9_]{0,63}$/;
export type EnvKind = "public" | "private_build";
const SECRET_SHAPES: [RegExp, string][] = [
  [/^sk_(live|test)_/, "Stripe secret key"],
  [/^rk_(live|test)_/, "Stripe restricted key"],
  [/^whsec_/, "Stripe webhook secret"],
  [/^sb_secret_/, "Supabase secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/^gh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/^AKIA[0-9A-Z]{16}$/, "AWS access key"],
];
function jwtRole(v: string): string | null {
  const parts = v.split("."); if (parts.length !== 3) return null;
  try { return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))).role ?? null; } catch { return null; }
}
/** Returns why a value must never be stored/embedded publicly, or null. */
export function secretReason(value: string): string | null {
  const v = value.trim();
  for (const [re, why] of SECRET_SHAPES) if (re.test(v)) return why;
  if (jwtRole(v) === "service_role") return "Supabase service-role key";
  return null;
}
/** Validate a variable before saving. Service-role keys are refused everywhere; secrets refused as public. */
export function checkEnvVar(name: string, value: string, kind: EnvKind): string | null {
  if (!ENV_NAME.test(name)) return "Use capital letters, numbers and underscores only.";
  if (value.length > 8192) return "Value is too long.";
  const why = secretReason(value);
  if (why === "Supabase service-role key") return "Service-role keys are never accepted. Use the publishable (anon) key.";
  if (kind === "public" && why) return `This looks like a ${why}. Public values are visible to anyone, so it can't be stored here.`;
  if (kind === "public" && !name.startsWith("VITE_")) return "Public build values must start with VITE_.";
  if (kind === "private_build" && name.startsWith("VITE_")) return "VITE_ values are embedded in the site. Use a name without VITE_ for private values.";
  return null;
}
/** Scan built output for private values or known secret shapes. */
export function scanArtifact(text: string, privateValues: string[]): string[] {
  const hits: string[] = [];
  for (const v of privateValues) if (v.length >= 8 && text.includes(v)) hits.push("private build value");
  for (const m of text.matchAll(/\b(sk_live_[A-Za-z0-9]{10,}|sk_test_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|sb_secret_[A-Za-z0-9_-]{10,})/g)) hits.push(secretReason(m[1]) ?? "secret");
  for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) if (jwtRole(m[0]) === "service_role") hits.push("Supabase service-role key");
  return [...new Set(hits)];
}
/** Mask secrets out of build logs. */
export const redact = (log: string, values: string[]) => values.filter((v) => v.length >= 4).reduce((s, v) => s.split(v).join("•••"), log);

export function validateSupabaseUrl(u: string): string | null {
  try { const x = new URL(u); if (x.protocol !== "https:") return "Must start with https://"; if (!/\.supabase\.(co|in)$/.test(x.hostname) && !/^[a-z0-9.-]+$/.test(x.hostname)) return "Not a valid address"; return null; } catch { return "Not a valid address"; }
}
