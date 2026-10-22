/**
 * Pure promotion fee rule (no Deno/Node imports so it is unit-testable).
 * A promotion can only ever lower Loumilab's platform fee: the result is the
 * lower of plan and promo, clamped to 0–10%, and only while the promotion is
 * active and unexpired.
 */
export interface PromoRow {
  status: string;
  expires_at: string | null;
  promo_fee_bps: number;
}

export const clampBps = (bps: number) => Math.min(Math.max(Math.round(bps), 0), 1000);

export const isPromoLive = (promo: PromoRow | null | undefined, now: Date = new Date()) =>
  Boolean(promo && promo.status === "active" && promo.expires_at && new Date(promo.expires_at).getTime() > now.getTime());

export const effectiveFeeBps = (planBps: number, promo: PromoRow | null | undefined, now: Date = new Date()) => {
  const plan = clampBps(planBps);
  if (!isPromoLive(promo, now)) return plan;
  return Math.min(plan, clampBps(promo!.promo_fee_bps));
};
