/**
 * Customer-first website addresses: every published customer site lives at <name>.loumilab.com.
 * Until the wildcard *.loumilab.com is pointed at the site, links fall back to the old paths
 * (set SUBDOMAINS_LIVE to true once it is), while displays always show the new address.
 */
export const ROOT_DOMAIN = "loumilab.com";
export const SUBDOMAINS_LIVE = false;

export type CustomerKind = "store" | "space" | "local";

export const RESERVED_SLUGS = new Set([
  "www", "app", "apps", "admin", "api", "mail", "email", "smtp", "imap", "ftp", "cdn", "static", "assets",
  "spaces", "orders", "local", "help", "support", "status", "docs", "blog", "news", "the-dot", "thedot",
  "resources", "store", "shop", "auth", "login", "sign-in", "signup", "account", "dashboard", "billing",
  "pay", "payments", "checkout", "dev", "staging", "preview", "test", "loumilab", "vurtti", "id", "m",
]);

export const isReservedSlug = (slug: string) => RESERVED_SLUGS.has(slug.trim().toLowerCase());

/** Display address without protocol, e.g. "bakery.loumilab.com". */
export const customerHost = (slug: string) => `${slug || "your-name"}.${ROOT_DOMAIN}`;

/** Canonical public URL. */
export const customerUrl = (slug: string, path = "") => `https://${customerHost(slug)}${path}`;

/** Full shareable URL that works today: subdomain once live, otherwise loumilab.com + old path. */
export const customerShareUrl = (kind: CustomerKind, slug: string, path = "") =>
  SUBDOMAINS_LIVE ? customerUrl(slug, path) : `https://${ROOT_DOMAIN}${legacyPath(kind, slug)}${path}`;

/** Old in-app path for a customer site. */
export const legacyPath = (kind: CustomerKind, slug: string) =>
  kind === "store" ? `/orders/store/${slug}` : kind === "space" ? `/spaces/a/${slug}` : `/orders/local/${slug}`;

/** Link target: subdomain once live, otherwise the old path. */
export const customerHref = (kind: CustomerKind, slug: string, path = "") =>
  SUBDOMAINS_LIVE ? customerUrl(slug, path) : `${legacyPath(kind, slug)}${path}`;

/** Customer slug from a hostname, or null for Loumilab's own hosts. */
export const slugFromHost = (host: string): string | null => {
  const h = host.toLowerCase().split(":")[0];
  if (!h.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const sub = h.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!sub || sub.includes(".") || isReservedSlug(sub)) return null;
  return sub;
};
