import { admin } from "../_shared/auth.ts";
import { Mail } from "../_shared/emailSetup.ts";

type Obj = Record<string, unknown>;

/** Business Email & Domain Setup payments. Paid state comes only from here. */
export async function handleEmailSetupSession(session: Obj, type: string) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  if (metadata.kind !== "email_setup" || !metadata.request_id) return false;
  const id = metadata.request_id;

  const { data: r } = await admin.from("email_setup_requests").select("*").eq("id", id).maybeSingle();
  if (!r) return true;

  const paid =
    (type === "checkout.session.completed" && session.payment_status === "paid") ||
    type === "checkout.session.async_payment_succeeded";

  if (paid) {
    // Conditional update makes retries a no-op.
    const { data: updated } = await admin.from("email_setup_requests").update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      paid_cents: typeof session.amount_total === "number" ? session.amount_total : r.total_cents,
      stripe_session_id: String(session.id),
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      service_status: "paid_awaiting_setup",
    }).eq("id", id).neq("payment_status", "paid").select("*").maybeSingle();
    if (updated) {
      await admin.from("email_setup_events").insert({ request_id: id, kind: "payment", detail: "Payment confirmed", visible_to_customer: true });
      await Mail.paid(updated, null);
    }
    return true;
  }

  if (type === "checkout.session.completed") {
    // Delayed payment method still processing.
    await admin.from("email_setup_requests").update({ payment_status: "pending" }).eq("id", id).neq("payment_status", "paid");
    return true;
  }

  if (r.payment_status === "paid" || r.stripe_session_id !== session.id) return true;
  const status = type === "checkout.session.expired" ? "expired" : "failed";
  await admin.from("email_setup_requests").update({ payment_status: status }).eq("id", id).neq("payment_status", "paid");
  await admin.from("email_setup_events").insert({ request_id: id, kind: "payment", detail: `Checkout ${status}` });
  if (status === "failed") await Mail.paymentProblem(r, "failed");
  return true;
}
