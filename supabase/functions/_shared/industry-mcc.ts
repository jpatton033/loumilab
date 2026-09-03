/**
 * Stripe requires a merchant category code (MCC) on every connected account.
 * Loumilab already knows the merchant's industry, so we map it here instead of
 * asking the merchant to pick a Stripe category they've never heard of.
 */
const MCC_BY_INDUSTRY: Record<string, string> = {
  restaurant: "5812",
  bakery: "5462",
  "food-catering": "5811",
  retail: "5399",
  beauty: "7230",
  cleaning: "7349",
  landscaping: "0780",
  plumbing: "1711",
  electrician: "1731",
  handyman: "1520",
  automotive: "7538",
  photography: "7221",
  professional: "7392",
  other: "7299",
};

/** Safe default: miscellaneous personal services. */
export const DEFAULT_MCC = "7299";

export function mccForIndustry(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_MCC;
  return MCC_BY_INDUSTRY[slug] ?? DEFAULT_MCC;
}
