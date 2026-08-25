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

export const ordersCollector = pending(
  "orders",
  "Loumilab Orders",
  "orders",
  "Customer checkout is not live yet, so order volume, GMV, average order value, tips, taxes, delivery revenue and pickup/delivery mix have no authoritative source. Merchant onboarding and payout readiness are reported under Merchants and Payments.",
);

export const revenueCollector = pending(
  "revenue",
  "Revenue",
  "orders",
  "Platform fee revenue and subscription revenue begin accruing with the first customer checkout and the first plan subscription. Configured platform fees per plan are reported under Pricing & Policy Changes whenever they change.",
);

export const payoutsCollector = pending(
  "payouts",
  "Merchant Payouts",
  "orders",
  "No payouts exist yet because no customer payments have been processed. Payout readiness of each connected account is reported under Merchants.",
);

export const refundsCollector = pending(
  "refunds",
  "Refunds",
  "orders",
  "Refunds require processed payments, which begin with customer checkout.",
);

export const disputesCollector = pending(
  "disputes",
  "Disputes & Chargebacks",
  "orders",
  "Disputes and chargebacks require processed payments. Once live, evidence deadlines will surface in Action Required.",
);

export const subscriptionsCollector = pending(
  "subscriptions",
  "Subscriptions",
  "orders",
  "Plan subscriptions are not yet billing, so new subscriptions, renewals, upgrades, downgrades, cancellations and MRR movement have no source.",
);

export const websiteTrafficCollector = pending(
  "website",
  "Website & Growth",
  "website",
  "No web analytics integration is connected, so visitors, sessions, page views, engagement, referral sources and landing-page performance are unavailable. Conversion events that land in the database — contact submissions and custom project requests — are reported under Leads & Opportunities.",
);

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
