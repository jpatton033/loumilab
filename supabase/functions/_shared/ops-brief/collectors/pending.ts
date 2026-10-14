import type { Collector } from "../types.ts";
import { unavailableSection } from "../util.ts";

/**
 * Sections whose authoritative data source does not exist yet. Each one keeps
 * its place in the brief and states plainly what is missing — the brief never
 * estimates a financial figure. When the underlying capability ships, only the
 * `collect` body here changes.
 */
const pending = (
  key: string,
  title: string,
  module: Collector["module"],
  note: string,
): Collector => ({
  key,
  title,
  module,
  collect: () => Promise.resolve(unavailableSection(key, title, note)),
});

export const seoCollector = pending(
  "seo",
  "SEO & Discoverability",
  "website",
  "Search Console reporting is not wired into the application runtime, so impressions, clicks, CTR, queries and indexing issues are unavailable here. Nothing is estimated.",
);

export const customerExperienceCollector = pending(
  "experience",
  "Customer Experience",
  "orders",
  "Checkout conversion, abandoned carts, repeat-customer rate and order completion rate require a live checkout funnel.",
);
