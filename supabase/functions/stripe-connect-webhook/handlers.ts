import { admin } from "../_shared/auth.ts";
import { stripeLivemode } from "../_shared/stripe.ts";
import { money, row, sendEmail, shell } from "../_shared/notify.ts";

/**
 * Post-payment side effects. Everything here is idempotent: the webhook
 * dedupes on Stripe event ID, and each update is safe to repeat.
 */

type Obj = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : null);

export async function handleCheckoutCompleted(session: Obj) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const kind = metadata.kind;

  if (kind === "storefront_order" && metadata.order_id) {
    await completeOrder(metadata.order_id, session);
  } else if (kind === "merchant_invoice" && metadata.invoice_id) {
    await completeInvoice(metadata.invoice_id, session);
  }
}

async function completeOrder(orderId: string, session: Obj) {
  const totalDetails = (session.total_details ?? {}) as Obj;
  const taxCents = num(totalDetails.amount_tax);

  const { data: order } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      tax_cents: taxCents,
      total_cents: num(session.amount_total),
      stripe_payment_intent_id: str(session.payment_intent),
    })
    .eq("id", orderId)
    .select("id, public_token, reference, merchant_id, customer_email, customer_name, currency, subtotal_cents, delivery_fee_cents, tip_cents, tax_cents, total_cents, fulfilment")
    .maybeSingle();

  if (!order) return;

  const { data: merchant } = await admin
    .from("merchants")
    .select("business_name, contact_email")
    .eq("id", order.merchant_id)
    .maybeSingle();

  const cur = order.currency ?? "usd";
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
    ${row("Subtotal", money(order.subtotal_cents, cur))}
    ${order.delivery_fee_cents ? row("Delivery", money(order.delivery_fee_cents, cur)) : ""}
    ${order.tip_cents ? row("Tip", money(order.tip_cents, cur)) : ""}
    ${row("Tax", money(taxCents, cur))}
    ${row("Total paid", money(order.total_cents, cur), true)}
  </table>`;

  await sendEmail(
    order.customer_email,
    `Your order from ${merchant?.business_name ?? "Loumilab Orders"} is confirmed`,
    shell(
      "Order confirmed",
      `<p style="margin:0 0 10px;font-size:15px;line-height:1.55">Thanks ${order.customer_name}. ${
        merchant?.business_name ?? "The business"
      } has your ${order.fulfilment} order.</p>${table}`,
    ),
  );

  if (merchant?.contact_email) {
    await sendEmail(
      merchant.contact_email,
      `New paid order — ${money(order.total_cents, cur)}`,
      shell(
        "New paid order",
        `<p style="margin:0 0 10px;font-size:15px;line-height:1.55">${order.customer_name} placed a ${order.fulfilment} order.</p>${table}`,
      ),
    );
  }
}

async function completeInvoice(invoiceId: string, session: Obj) {
  const { data: invoice } = await admin
    .from("merchant_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: str(session.payment_intent),
    })
    .eq("id", invoiceId)
    .select("id, merchant_id, job_id, kind, amount_cents")
    .maybeSingle();

  if (!invoice) return;

  // A paid deposit moves the job forward; a paid balance closes it out.
  if (invoice.job_id) {
    await admin
      .from("merchant_jobs")
      .update({ status: invoice.kind === "deposit" ? "scheduled" : "completed" })
      .eq("id", invoice.job_id);
  }

  const { data: merchant } = await admin
    .from("merchants")
    .select("business_name, contact_email")
    .eq("id", invoice.merchant_id)
    .maybeSingle();

  if (merchant?.contact_email) {
    await sendEmail(
      merchant.contact_email,
      `${invoice.kind === "deposit" ? "Deposit" : "Invoice"} paid — ${money(invoice.amount_cents)}`,
      shell(
        "Payment received",
        `<p style="margin:0;font-size:15px;line-height:1.55">Your ${invoice.kind} of ${money(
          invoice.amount_cents,
        )} has been paid. Funds settle to your bank on Stripe's normal payout schedule.</p>`,
      ),
    );
  }
}

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
