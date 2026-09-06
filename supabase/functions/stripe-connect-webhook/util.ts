/** Narrow an unknown Stripe field to a string or null. */
export const str = (v: unknown) => (typeof v === "string" ? v : null);
