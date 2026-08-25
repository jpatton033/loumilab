import { admin } from "./auth.ts";
import { stripeLivemode } from "./stripe.ts";

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
  feeBps: number;
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
  return Math.min(Math.max(bps, 0), 1000);
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

  const feeBps = await resolveFeeBps(merchantId, merchant.plan_slug);
  return { merchant, account, feeBps };
}

/** Loumilab's application fee, charged on merchandise only — never on tax or tips. */
export const platformFeeCents = (merchandiseCents: number, feeBps: number) =>
  Math.max(0, Math.round((merchandiseCents * feeBps) / 10000));
