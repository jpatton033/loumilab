import { admin } from "../_shared/auth.ts";
import { Mail, refreshBalance } from "../_shared/emailSetup.ts";

type Obj = Record<string, unknown>;

/**
 * Business Email & Domain Setup payments. Paid state comes only from here.
 * Each payment is one immutable ledger row, unique on the Checkout session id,
 * so Stripe retries can never record or email twice.
 */
export async function handleEmailSetupSession(session: Obj, type: string) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  if ((metadata.kind !== "email_setup" && metadata.kind !== "email_setup_balance") || !metadata.request_id) return false;
  const id = metadata.request_id;
  const changeId = metadata.kind === "email_setup_balance" ? metadata.change_set_id : null;

  const { data: r } = await admin.from("email_setup_requests").select("*").eq("id", id).maybeSingle();
  if (!r) return true;

  const paid =
    (type === "checkout.session.completed" && session.payment_status === "paid") ||
    type === "checkout.session.async_payment_succeeded";

  if (paid) {
    const amount = typeof session.amount_total === "number" ? session.amount_total : 0;
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
    const { error } = await admin.from("email_setup_payments").insert({
      request_id: id, change_set_id: changeId, kind: "charge", amount_cents: amount, stripe_ref: String(session.id), stripe_payment_intent_id: pi,
    });
    if (error) {
      if (error.code === "23505") return true; // already recorded
      throw new Error(error.message);
    }

    if (changeId) {
      const { data: c } = await admin.from("email_setup_change_sets")
        .update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", changeId).eq("status", "approved").select("*").maybeSingle();
      if (c) {
        await admin.from("email_setup_requests").update({
          package: c.package_to,
          ...(c.mailboxes_to != null ? { mailboxes: c.mailboxes_to } : {}),
          ...(c.devices_to != null ? { extra_devices: c.devices_to } : {}),
          service_status: r.service_status === "awaiting_payment" || r.service_status === "awaiting_approval" ? "ready_for_setup" : r.service_status,
        }).eq("id", id);
        await admin.from("email_setup_events").insert({ request_id: id, kind: "payment", detail: "Additional payment received — revised scope confirmed", visible_to_customer: true });
        await refreshBalance(id);
        await Mail.changePaid(r, c);
      }
      return true;
    }

    const { data: updated } = await admin.from("email_setup_requests").update({
      paid_at: new Date().toISOString(), paid_cents: amount, stripe_session_id: String(session.id), stripe_payment_intent_id: pi,
      service_status: "ready_for_setup", payment_status: "paid",
    }).eq("id", id).select("*").single();
    await refreshBalance(id);
    await admin.from("email_setup_events").insert({ request_id: id, kind: "payment", detail: "Payment confirmed", visible_to_customer: true });
    await Mail.paid(updated, null);
    return true;
  }

  if (type === "checkout.session.completed") {
    if (!changeId) await admin.from("email_setup_requests").update({ payment_status: "pending" }).eq("id", id).eq("payment_status", "unpaid");
    return true;
  }

  // Expired or failed checkout: nothing is recorded as paid.
  const failed = type === "checkout.session.async_payment_failed";
  if (!changeId && r.stripe_session_id === session.id && ["unpaid", "pending"].includes(r.payment_status)) {
    await admin.from("email_setup_requests").update({ payment_status: failed ? "failed" : "expired" }).eq("id", id);
  }
  await admin.from("email_setup_events").insert({ request_id: id, kind: "payment", detail: `Checkout ${failed ? "failed" : "expired"}` });
  if (failed) {
    await Mail.paymentProblem(r, "failed");
    await Mail.customerPaymentFailed(r);
  }
  return true;
}

/** Records Stripe refunds (issued by an admin in Stripe) against email-setup payments. */
export async function handleEmailSetupRefund(charge: Obj) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!pi) return;
  const { data: pay } = await admin.from("email_setup_payments").select("request_id").eq("stripe_payment_intent_id", pi).eq("kind", "charge").maybeSingle();
  if (!pay) return;
  const totalRefunded = typeof charge.amount_refunded === "number" ? charge.amount_refunded : 0;
  const { data: prior } = await admin.from("email_setup_payments").select("amount_cents").eq("stripe_payment_intent_id", pi).eq("kind", "refund");
  const already = (prior ?? []).reduce((n, p) => n + p.amount_cents, 0);
  const delta = totalRefunded - already;
  if (delta <= 0) return;
  const { error } = await admin.from("email_setup_payments").insert({
    request_id: pay.request_id, kind: "refund", amount_cents: delta, stripe_ref: `refund:${String(charge.id)}:${totalRefunded}`, stripe_payment_intent_id: pi,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
  await admin.from("email_setup_events").insert({ request_id: pay.request_id, kind: "refund", detail: `Refund of $${(delta / 100).toFixed(2)} recorded`, visible_to_customer: true });
  await refreshBalance(pay.request_id);
}
