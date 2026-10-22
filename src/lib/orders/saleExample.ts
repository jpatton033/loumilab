/** Stripe's standard US card rate, shown only as a labelled estimate. */
export const STRIPE_EST_BPS = 290;
export const STRIPE_EST_FIXED_CENTS = 30;

/** Single-sale breakdown: Loumilab fee, estimated Stripe processing, estimated proceeds. */
export function saleBreakdown(saleCents: number, feeBps: number) {
  const loumilab = Math.round((saleCents * feeBps) / 10000);
  const stripe = Math.round((saleCents * STRIPE_EST_BPS) / 10000) + STRIPE_EST_FIXED_CENTS;
  return { loumilab, stripe, proceeds: saleCents - loumilab - stripe };
}
