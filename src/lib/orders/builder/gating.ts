/**
 * Builder capabilities by the plan's `customization.level` entitlement.
 * basic (Starter): every template, colors, fonts, logo, text, images, show/hide.
 * advanced/full (Business, Premium): add, remove and reorder sections, spacing,
 * corner style and heading size.
 */
export interface BuilderCaps {
  arrange: boolean;
  advancedStyle: boolean;
}

export const builderCaps = (level: unknown): BuilderCaps => {
  const full = level === "advanced" || level === "full";
  return { arrange: full, advancedStyle: full };
};
