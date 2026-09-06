import { admin } from "./auth.ts";
import { money, row, sendEmail, shell } from "./notify.ts";
import { stripe } from "./stripe.ts";

/**
 * Post-payment side effects, shared by the Stripe webhook and the
 * reconciliation function that asks Stripe directly about an order.
 *
 * Everything here is idempotent: an order only moves to `paid` once (the
 * update is guarded on the current status), so confirmation emails and fee
 * figures can never be applied twice.
 */

type Obj = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : null);

/**
 * Stripe's own processing fee for a direct charge. The balance transaction fee
 * bundles the application (Loumilab) fee in, so only `stripe_fee` details
 * count — otherwise the merchant would see our cut twice.
 */
async function stripeFeeCents(
  paymentIntentId: string | null,
  stripeAccount?: string,
): Promise<number | null> {
  if (!paymentIntentId) return null;
  try {
    const pi = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ["latest_charge.balance_transaction"] },
      stripeAccount ? { stripeAccount } : undefined,
    );
    const charge = pi.latest_charge as unknown as Obj | null;
    const bt = charge?.balance_transaction as unknown as Obj | null;
    const details = (bt?.fee_details ?? []) as { type?: string; amount?: number }[];
    if (details.length) {
      return details
        .filter((d) => d.type === "stripe_fee")
        .reduce((sum, d) => sum + num(d.amount), 0);
    }
    if (typeof bt?.fee === "number") return bt.fee;
  } catch (err) {
    console.error("stripeFeeCents failed", err instanceof Error ? err.message : err);
  }
  return null;
}

export async function handleCheckoutCompleted(session: Obj, stripeAccount?: string) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const kind = metadata.kind;

  if (kind === "storefront_order" && metadata.order_id) {
    await completeOrder(metadata.order_id, session, stripeAccount);
  } else if (kind === "merchant_invoice" && metadata.invoice_id) {
    await completeInvoice(metadata.invoice_id, session);
  }
}

async function completeOrder(orderId: string, session: Obj, stripeAccount?: string) {
  const totalDetails = (session.total_details ?? {}) as Obj;
  const taxCents = num(totalDetails.amount_tax);
  const paymentIntentId = str(session.payment_intent);
  const feeCents = await stripeFeeCents(paymentIntentId, stripeAccount);

  const { data: order } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      tax_cents: taxCents,
      total_cents: num(session.amount_total),
      stripe_payment_intent_id: paymentIntentId,
      ...(feeCents !== null ? { stripe_fee_cents: feeCents } : {}),
    })
    .eq("id", orderId)
    .neq("status", "paid")
    .select(
      "id, public_token, reference, merchant_id, customer_email, customer_name, currency, subtotal_cents, delivery_fee_cents, tip_cents, tax_cents, total_cents, fulfilment",
    )
    .maybeSingle();

  // Already paid (a webhook and a reconcile can race) — nothing left to do.
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
    `order-confirm-${order.id}`,
  );

  if (merchant?.contact_email) {
    await sendEmail(
      merchant.contact_email,
      `New paid order — ${money(order.total_cents, cur)}`,
      shell(
        "New paid order",
        `<p style="margin:0 0 10px;font-size:15px;line-height:1.55">${order.customer_name} placed a ${order.fulfilment} order.</p>${table}`,
      ),
      `order-merchant-${order.id}`,
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
    .neq("status", "paid")
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
      `invoice-paid-${invoice.id}`,
    );
  }
}
