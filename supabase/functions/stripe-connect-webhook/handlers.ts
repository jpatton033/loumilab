import { admin } from "../_shared/auth.ts";
import { stripeLivemode } from "../_shared/stripe.ts";
import { str } from "./util.ts";

/** Post-payment order/invoice effects live in `_shared/order-complete.ts` so the
 * reconciliation function can reuse the exact same logic. */
export { handleCheckoutCompleted } from "../_shared/order-complete.ts";

type Obj = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" ? v : 0);

/** Keeps the merchant's plan and fee rate in step with Stripe Billing. */
export async function handleSubscriptionChange(subscription: Obj, eventType: string) {
  const metadata = (subscription.metadata ?? {}) as Record<string, string>;
  const merchantId = metadata.merchant_id;
  const subId = str(subscription.id);
  if (!subId) return;

  const status = eventType === "customer.subscription.deleted" ? "canceled" : str(subscription.status) ?? "incomplete";
  const items = ((subscription.items as Obj | undefined)?.data ?? []) as Obj[];
  const price = (items[0]?.price ?? {}) as Obj;
  const recurring = (price.recurring ?? {}) as Obj;
  const planSlug = metadata.plan_slug ?? ((price.metadata ?? {}) as Record<string, string>).plan_slug;

  const { data: plan } = planSlug
    ? await admin.from("orders_plans").select("platform_fee_bps").eq("slug", planSlug).maybeSingle()
    : { data: null };

  const periodEnd = num(subscription.current_period_end);
  const patch = {
    status,
    stripe_subscription_id: subId,
    stripe_customer_id: str(subscription.customer),
    cancel_at_period_end: subscription.cancel_at_period_end === true,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    interval: str(recurring.interval) ?? "month",
    ...(planSlug ? { plan_slug: planSlug } : {}),
    ...(plan?.platform_fee_bps != null ? { platform_fee_bps: plan.platform_fee_bps } : {}),
    livemode: stripeLivemode,
  };

  if (merchantId) {
    await admin.from("merchant_subscriptions").upsert(
      { merchant_id: merchantId, plan_slug: planSlug ?? "starter", ...patch },
      { onConflict: "merchant_id" },
    );

    // Cancellation drops the merchant to Starter without deleting any data.
    const effectivePlan = ["active", "trialing", "past_due"].includes(status) ? planSlug : "starter";
    if (effectivePlan) {
      await admin.from("merchants").update({ plan_slug: effectivePlan }).eq("id", merchantId);
    }
  } else {
    await admin.from("merchant_subscriptions").update(patch).eq("stripe_subscription_id", subId);
  }
}

/**
 * Refunds and lost chargebacks reduce the month's eligible volume so later
 * orders don't get a lower tier they didn't earn. The fee already charged on
 * the order itself is never recalculated.
 */
export async function handleChargeReversal(charge: Obj, kind: "refund" | "dispute_lost") {
  const pi = str(charge.payment_intent);
  if (!pi) return;
  const reversed = kind === "refund" ? num(charge.amount_refunded) : num(charge.amount);
  for (const table of ["orders", "merchant_invoices"] as const) {
    const amountCol = table === "orders" ? "subtotal_cents" : "amount_cents";
    const { data } = await admin
      .from(table)
      .select(`id, ${amountCol}, fee_refunded_cents`)
      .eq("stripe_payment_intent_id", pi)
      .maybeSingle();
    if (!data) continue;
    const row = data as unknown as Record<string, number | string>;
    // Never above the merchandise amount; never lowers an earlier, larger value.
    const value = Math.min(Number(row[amountCol]) || 0, reversed);
    if (value > (Number(row.fee_refunded_cents) || 0)) {
      await admin.from(table).update({ fee_refunded_cents: value }).eq("id", row.id as string);
    }
    return;
  }
}
