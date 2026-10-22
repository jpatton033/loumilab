import { admin } from "./auth.ts";
import { stripeLivemode } from "./stripe.ts";
import { clampBps, effectiveFeeBps, isPromoLive } from "./promoFee.ts";
import { type FeeSlice, type FeeTiers, progressiveFee } from "./progressiveFee.ts";

/**
 * Server-side money authority for Loumilab Orders.
 *
 * The platform fee is always derived here from the merchant's effective plan.
 * Nothing the browser sends about prices, fees or plans is trusted.
 */

export interface MerchantContext {
  merchant: {
    id: string;
    business_name: string;
    contact_email: string;
    plan_slug: string;
    accepting_orders: boolean;
  };
  account: {
    stripe_account_id: string;
    payout_status: string;
    livemode: boolean;
  };
  planSlug: string;
  /** Fee actually charged (plan fee, lowered by a live promotion). */
  feeBps: number;
  /** The plan's normal fee, before any promotion. */
  planFeeBps: number;
  merchantPromotionId: string | null;
}

export class PaymentsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Fee rate in basis points for a merchant's currently effective plan. */
export async function resolveFeeBps(merchantId: string, fallbackPlanSlug: string): Promise<number> {
  return (await resolvePlanFee(merchantId, fallbackPlanSlug)).bps;
}

/** Effective plan slug and its flat fee rate. */
export async function resolvePlanFee(merchantId: string, fallbackPlanSlug: string) {
  const { data: sub } = await admin
    .from("merchant_subscriptions")
    .select("plan_slug, status, platform_fee_bps")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  const activeSub = sub && ["active", "trialing", "past_due"].includes(sub.status) ? sub : null;
  const planSlug = activeSub?.plan_slug ?? fallbackPlanSlug ?? "starter";

  const { data: plan } = await admin
    .from("orders_plans")
    .select("platform_fee_bps")
    .eq("slug", planSlug)
    .maybeSingle();

  const bps = plan?.platform_fee_bps ?? activeSub?.platform_fee_bps ?? 500;
  // Guard rail: never charge more than 10% or a negative fee.
  return { planSlug, bps: Math.min(Math.max(bps, 0), 1000) };
}

/**
 * Plan fee plus any live promotion for this merchant. A promotion only lowers
 * the fee (see promoFee.ts) and expiry is checked against the clock here, so it
 * ends on time even before the hourly cleanup marks it expired.
 */
export async function resolvePromoFee(merchantId: string, planBps: number) {
  const { data: promo } = await admin
    .from("merchant_promotions")
    .select("id, status, expires_at, promo_fee_bps")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  const feeBps = effectiveFeeBps(planBps, promo);
  const live = isPromoLive(promo) && feeBps < clampBps(planBps);
  return { feeBps, merchantPromotionId: live ? (promo!.id as string) : null };
}

/** Merchant, connected account and fee rate — or a thrown PaymentsError. */
export async function loadMerchantContext(merchantId: string): Promise<MerchantContext> {
  const { data: merchant } = await admin
    .from("merchants")
    .select("id, business_name, contact_email, plan_slug, accepting_orders")
    .eq("id", merchantId)
    .maybeSingle();

  if (!merchant) throw new PaymentsError("This business is not available.", 404);

  const { data: account } = await admin
    .from("merchant_stripe_accounts")
    .select("stripe_account_id, payout_status, livemode")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (!account || account.payout_status !== "payout_enabled") {
    throw new PaymentsError("This business isn't ready to take payments yet.", 409);
  }

  if (account.livemode !== stripeLivemode) {
    throw new PaymentsError("Payments are temporarily unavailable for this business.", 409);
  }

  const { planSlug, bps: planFeeBps } = await resolvePlanFee(merchantId, merchant.plan_slug);
  const promo = await resolvePromoFee(merchantId, planFeeBps);
  return { merchant, account, planSlug, feeBps: promo.feeBps, planFeeBps, merchantPromotionId: promo.merchantPromotionId };
}

/** Loumilab's application fee, charged on merchandise only — never on tax or tips. */
export const platformFeeCents = (merchandiseCents: number, feeBps: number) =>
  Math.max(0, Math.round((merchandiseCents * feeBps) / 10000));

export interface OrderFee {
  /** Fee to charge through Stripe, in cents. */
  feeCents: number;
  /** Fee the merchant would have paid without a promotion. */
  baseFeeCents: number;
  /** Blended rate actually charged, in basis points (for records). */
  feeBps: number;
  scheduleId: string | null;
  volumeStartCents: number | null;
  breakdown: { schedule_version: number; plan: string; slices: FeeSlice[]; promo_applied: boolean } | null;
  reservationId: string | null;
}

/**
 * Loumilab fee for one order's merchandise. Uses the active progressive
 * schedule (marginal tiers on this month's volume) when one is live, otherwise
 * the flat plan rate. A live promotion can only lower it.
 */
export async function priceOrderFee(ctx: MerchantContext, merchandiseCents: number): Promise<OrderFee> {
  const flatBase = platformFeeCents(merchandiseCents, ctx.planFeeBps);
  const promoCents = ctx.merchantPromotionId ? platformFeeCents(merchandiseCents, ctx.feeBps) : null;

  const { data, error } = await admin.rpc("reserve_fee_volume", {
    _merchant_id: ctx.merchant.id,
    _cents: merchandiseCents,
  });
  if (error) console.error("reserve_fee_volume failed", error.message);
  const res = (data ?? null) as
    | { volume_start_cents: number; reservation_id: string; schedule: { id: string; version: number; tiers: FeeTiers } | null }
    | null;

  const prog = res?.schedule
    ? progressiveFee(res.schedule.tiers, ctx.planSlug, Number(res.volume_start_cents), merchandiseCents)
    : null;

  const baseFeeCents = prog ? prog.feeCents : flatBase;
  const feeCents = promoCents !== null ? Math.min(baseFeeCents, promoCents) : baseFeeCents;
  const feeBps = merchandiseCents > 0 ? Math.round((feeCents * 10000) / merchandiseCents) : 0;

  return {
    feeCents: Math.max(0, feeCents),
    baseFeeCents,
    feeBps,
    scheduleId: prog ? res!.schedule!.id : null,
    volumeStartCents: res ? Number(res.volume_start_cents) : null,
    breakdown: prog
      ? { schedule_version: res!.schedule!.version, plan: ctx.planSlug, slices: prog.slices, promo_applied: feeCents < baseFeeCents }
      : null,
    reservationId: res?.reservation_id ?? null,
  };
}

/** Release a volume hold once the pending order (which counts itself) exists. */
export async function releaseFeeReservation(id: string | null) {
  if (id) await admin.from("orders_fee_reservations").delete().eq("id", id);
}
