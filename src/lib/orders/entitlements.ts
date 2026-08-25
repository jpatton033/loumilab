import type { OrdersPlan } from "./plans";

/**
 * Centralized entitlement engine.
 *
 * Components and pages must never branch on a plan slug (`plan === "business"`).
 * They ask this module whether a capability is enabled for the merchant's
 * effective plan. Entitlement values are stored on the plan row, so changing
 * what a tier includes is a data change, not a code change.
 *
 * The client copy is for rendering only. Any server action that depends on an
 * entitlement must re-resolve it from the database before acting.
 */

export type EntitlementKey =
  | "storefront.unlimited_products"
  | "orders.pickup"
  | "orders.delivery"
  | "orders.tips"
  | "orders.scheduling"
  | "orders.windows"
  | "orders.advanced_controls"
  | "quotes.enabled"
  | "deposits.enabled"
  | "invoicing.enabled"
  | "recurring.enabled"
  | "discounts.enabled"
  | "promo_codes.enabled"
  | "analytics.level"
  | "customization.level"
  | "branding.remove_loumilab"
  | "branding.reduced_loumilab"
  | "staff.max_users"
  | "staff.roles"
  | "exports.enabled"
  | "customer_insights.enabled"
  | "custom_workflows.enabled"
  | "priority_support.enabled"
  | "custom";

export type EntitlementValue = boolean | number | string | string[];

export type Entitlements = Partial<Record<EntitlementKey, EntitlementValue>>;

/** Baseline every merchant gets, regardless of plan. */
export const BASE_ENTITLEMENTS: Entitlements = {
  "storefront.unlimited_products": true,
  "orders.pickup": true,
  "orders.delivery": true,
  "orders.tips": true,
  "orders.scheduling": false,
  "orders.windows": false,
  "orders.advanced_controls": false,
  "quotes.enabled": false,
  "deposits.enabled": false,
  "invoicing.enabled": false,
  "recurring.enabled": false,
  "discounts.enabled": false,
  "promo_codes.enabled": false,
  "analytics.level": "basic",
  "customization.level": "basic",
  "branding.remove_loumilab": false,
  "branding.reduced_loumilab": false,
  "staff.max_users": 1,
  "exports.enabled": false,
  "customer_insights.enabled": false,
  "custom_workflows.enabled": false,
  "priority_support.enabled": false,
};

/** Plain-language label for each capability, used in upgrade prompts. */
export const ENTITLEMENT_LABELS: Partial<Record<EntitlementKey, string>> = {
  "orders.scheduling": "Scheduling and appointments",
  "orders.windows": "Service windows",
  "orders.advanced_controls": "Advanced order controls",
  "quotes.enabled": "Quotes and estimates",
  "deposits.enabled": "Deposits",
  "invoicing.enabled": "Invoicing",
  "recurring.enabled": "Recurring services",
  "discounts.enabled": "Discounts",
  "promo_codes.enabled": "Promo codes",
  "exports.enabled": "CSV exports",
  "customer_insights.enabled": "Customer insights",
  "custom_workflows.enabled": "Custom workflow stages",
  "branding.remove_loumilab": "Remove Loumilab branding",
  "priority_support.enabled": "Priority support",
};

/** Lowest paid tier that unlocks a capability, for upgrade copy. */
export const ENTITLEMENT_TIER: Partial<Record<EntitlementKey, string>> = {
  "orders.scheduling": "Business",
  "orders.windows": "Business",
  "quotes.enabled": "Business",
  "deposits.enabled": "Business",
  "invoicing.enabled": "Business",
  "discounts.enabled": "Business",
  "promo_codes.enabled": "Business",
  "exports.enabled": "Business",
  "customer_insights.enabled": "Business",
  "orders.advanced_controls": "Premium",
  "recurring.enabled": "Premium",
  "custom_workflows.enabled": "Premium",
  "branding.remove_loumilab": "Premium",
  "priority_support.enabled": "Premium",
};


/** Merge a plan's stored entitlements over the baseline. */
export const resolveEntitlements = (plan?: Pick<OrdersPlan, "entitlements"> | null): Entitlements => ({
  ...BASE_ENTITLEMENTS,
  ...((plan?.entitlements ?? {}) as Entitlements),
});

export const isEnabled = (ents: Entitlements, key: EntitlementKey): boolean => ents[key] === true;

export const limitOf = (ents: Entitlements, key: EntitlementKey): number => {
  const value = ents[key];
  return typeof value === "number" ? value : 0;
};

export const levelOf = (ents: Entitlements, key: EntitlementKey): string => {
  const value = ents[key];
  return typeof value === "string" ? value : "basic";
};

export const rolesOf = (ents: Entitlements, key: EntitlementKey = "staff.roles"): string[] => {
  const value = ents[key];
  return Array.isArray(value) ? value : ["owner"];
};

/** Human-readable summary of what a downgrade would remove. */
export const entitlementDiff = (from: Entitlements, to: Entitlements): string[] => {
  const lost: string[] = [];
  (Object.keys(from) as EntitlementKey[]).forEach((key) => {
    const a = from[key];
    const b = to[key];
    if (a === true && b !== true) lost.push(key);
    else if (typeof a === "number" && typeof b === "number" && b < a) lost.push(`${key} (${a} → ${b})`);
    else if (typeof a === "string" && typeof b === "string" && a !== b) lost.push(`${key} (${a} → ${b})`);
  });
  return lost;
};
