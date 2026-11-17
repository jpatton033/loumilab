// Pure rules for Cloudflare Registrar search/check. Shared by the domain-search function and tests.
export type DomainStatus = "available" | "unavailable" | "premium" | "unsupported" | "verification_required" | "provider_unavailable";
export interface Pricing { currency: string; registration: string; renewal: string | null }
export interface DomainResult { name: string; status: DomainStatus; tier: string | null; pricing: Pricing | null; reason: string | null; verified: boolean }

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** Lowercases, strips scheme/path/www, and rejects anything that isn't a plausible domain. */
export function normalizeDomain(input: string): string | null {
  let s = String(input ?? "").trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").replace(/\.$/, "");
  if (s.length < 4 || s.length > 253) return null;
  const parts = s.split(".");
  if (parts.length < 2 || !parts.every((p) => LABEL.test(p))) return null;
  if (!/^[a-z]{2,63}$/.test(parts[parts.length - 1])) return null;
  return s;
}

/** Keyword query for search: letters, digits, spaces, dots and hyphens only, 2–63 chars. */
export function normalizeQuery(input: string): string | null {
  const s = String(input ?? "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/\s+/g, " ");
  if (s.length < 2 || s.length > 63 || !/^[a-z0-9 .-]+$/.test(s)) return null;
  return s;
}

const money = (v: unknown) => (typeof v === "string" && /^\d+(\.\d{1,2})?$/.test(v) ? v : null);

/** Maps one Cloudflare domain record into a safe result. `verified` = came from the live Check endpoint. */
export function mapDomain(raw: unknown, verified: boolean): DomainResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, any>;
  const name = typeof r.name === "string" ? normalizeDomain(r.name) : null;
  if (!name) return null;
  const tier = typeof r.tier === "string" ? r.tier : null;
  const reg = money(r.pricing?.registration_cost);
  const pricing: Pricing | null = reg && typeof r.pricing?.currency === "string"
    ? { currency: r.pricing.currency, registration: reg, renewal: money(r.pricing?.renewal_cost) } : null;
  const reason = typeof r.reason === "string" ? r.reason.slice(0, 80) : null;
  let status: DomainStatus;
  if (r.registrable === true) status = tier && tier !== "standard" ? "premium" : "available";
  else if (r.registrable === false) status = reason && /not_supported|unsupported/.test(reason) ? "unsupported" : reason && /premium/.test(reason) ? "premium" : "unavailable";
  else status = "verification_required";
  return { name, status, tier, pricing: status === "unavailable" ? null : pricing, reason, verified };
}

export const STATUS_LABEL: Record<DomainStatus, string> = {
  available: "Available", unavailable: "Unavailable", premium: "Premium", unsupported: "Unsupported",
  verification_required: "Verification required", provider_unavailable: "Provider unavailable",
};
