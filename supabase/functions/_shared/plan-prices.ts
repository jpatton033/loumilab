import { admin } from "./auth.ts";
import { stripe, stripeMode } from "./stripe.ts";

/**
 * Stripe product/price provisioning for Loumilab Orders plans.
 *
 * `orders_plans` is the source of truth: Super Admins edit prices in the
 * dashboard and the Stripe product/price objects are created (or re-created
 * when an amount changes) from those rows. Shared by merchant checkout and the
 * admin "Link to Stripe" action so both use identical logic.
 */

export interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  annual_billing_active?: boolean;
  requires_subscription?: boolean;
  stripe_product_id: string | null;
  stripe_price_monthly_id: string | null;
  stripe_price_annual_id: string | null;
}

export const PLAN_STRIPE_COLUMNS =
  "id, slug, name, description, monthly_price_cents, annual_price_cents, annual_billing_active, requires_subscription, is_active, platform_fee_bps, stripe_product_id, stripe_price_monthly_id, stripe_price_annual_id";

type Interval = "month" | "year";

const amountFor = (plan: PlanRow, interval: Interval) =>
  interval === "month" ? plan.monthly_price_cents : plan.annual_price_cents;

/** Ensures the plan has a Stripe product and a price for this interval. */
export async function ensurePrice(plan: PlanRow, interval: Interval): Promise<string> {
  const amount = amountFor(plan, interval);
  if (!amount || amount <= 0) throw new Error("This plan is not available for self-serve checkout.");

  let productId = plan.stripe_product_id;
  if (productId) {
    const product = await stripe.products.retrieve(productId).catch(() => null);
    if (!product || product.deleted) productId = null;
  }
  if (!productId) {
    const product = await stripe.products.create({
      name: `Loumilab Orders — ${plan.name}`,
      description: plan.description?.slice(0, 300) || undefined,
      metadata: { plan_slug: plan.slug },
    });
    productId = product.id;
  }

  let priceId = interval === "month" ? plan.stripe_price_monthly_id : plan.stripe_price_annual_id;

  if (priceId) {
    // Re-create the price when the admin changed the amount.
    const price = await stripe.prices.retrieve(priceId).catch(() => null);
    if (
      !price ||
      price.unit_amount !== amount ||
      price.recurring?.interval !== interval ||
      (typeof price.product === "string" ? price.product : price.product?.id) !== productId
    ) {
      priceId = null;
    }
  }

  if (!priceId) {
    const price = await stripe.prices.create({
      product: productId,
      currency: "usd",
      unit_amount: amount,
      recurring: { interval },
      metadata: { plan_slug: plan.slug },
    });
    priceId = price.id;
  }

  // Keep local state in sync so the admin dashboard reflects reality.
  plan.stripe_product_id = productId;
  if (interval === "month") plan.stripe_price_monthly_id = priceId;
  else plan.stripe_price_annual_id = priceId;

  await admin
    .from("orders_plans")
    .update({
      stripe_product_id: productId,
      ...(interval === "month" ? { stripe_price_monthly_id: priceId } : { stripe_price_annual_id: priceId }),
    })
    .eq("id", plan.id);

  return priceId;
}

/** Provisions every interval the plan actually sells (monthly, plus annual when on). */
export async function ensurePlanPrices(plan: PlanRow) {
  const monthly = await ensurePrice(plan, "month");
  let annual: string | null = null;
  if (plan.annual_billing_active && (plan.annual_price_cents ?? 0) > 0) {
    annual = await ensurePrice(plan, "year");
  }
  return { product_id: plan.stripe_product_id, monthly_price_id: monthly, annual_price_id: annual };
}

export type PlanLinkState = "not_applicable" | "not_linked" | "linked" | "stale";

export interface PlanLinkStatus {
  plan_id: string;
  slug: string;
  state: PlanLinkState;
  mode: "live" | "test";
  product_id: string | null;
  monthly_price_id: string | null;
  annual_price_id: string | null;
  monthly_ok: boolean;
  annual_ok: boolean;
  annual_required: boolean;
  detail: string;
}

const priceMatches = async (priceId: string | null, amount: number | null, interval: Interval) => {
  if (!priceId || !amount) return false;
  const price = await stripe.prices.retrieve(priceId).catch(() => null);
  if (!price || !price.active) return false;
  return price.unit_amount === amount && price.recurring?.interval === interval;
};

/** Read-only comparison of the saved Stripe IDs against the plan row. */
export async function planLinkStatus(plan: PlanRow): Promise<PlanLinkStatus> {
  const annualRequired = !!plan.annual_billing_active && (plan.annual_price_cents ?? 0) > 0;
  const base = {
    plan_id: plan.id,
    slug: plan.slug,
    mode: stripeMode,
    product_id: plan.stripe_product_id,
    monthly_price_id: plan.stripe_price_monthly_id,
    annual_price_id: plan.stripe_price_annual_id,
    annual_required: annualRequired,
  };

  if (!plan.requires_subscription || !plan.monthly_price_cents) {
    return {
      ...base,
      state: "not_applicable",
      monthly_ok: false,
      annual_ok: false,
      detail: "No recurring charge — nothing to link.",
    };
  }

  if (!plan.stripe_product_id && !plan.stripe_price_monthly_id) {
    return { ...base, state: "not_linked", monthly_ok: false, annual_ok: false, detail: "Not linked yet." };
  }

  const monthlyOk = await priceMatches(plan.stripe_price_monthly_id, plan.monthly_price_cents, "month");
  const annualOk = annualRequired
    ? await priceMatches(plan.stripe_price_annual_id, plan.annual_price_cents, "year")
    : true;

  if (monthlyOk && annualOk) {
    return {
      ...base,
      state: "linked",
      monthly_ok: true,
      annual_ok: annualOk,
      detail: annualRequired ? "Monthly and annual prices match Stripe." : "Monthly price matches Stripe.",
    };
  }

  return {
    ...base,
    state: "stale",
    monthly_ok: monthlyOk,
    annual_ok: annualOk,
    detail: !monthlyOk
      ? "The monthly price in Stripe no longer matches this plan."
      : "The annual price in Stripe no longer matches this plan.",
  };
}
