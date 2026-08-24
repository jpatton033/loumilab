import { admin } from "../_shared/auth.ts";
import { resolvePayoutStatus, stripe } from "../_shared/stripe.ts";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();

  if (!WEBHOOK_SECRET || !signature) {
    console.error("Missing webhook secret or signature");
    return new Response("Signature verification unavailable", { status: 400 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Invalid signature", err instanceof Error ? err.message : err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: unique index on stripe_event_id rejects replays.
  const claim = await admin.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    account_id: (event as { account?: string }).account ?? null,
    livemode: event.livemode ?? false,
    payload: event.data?.object ?? null,
  });

  if (claim.error) {
    if (claim.error.code === "23505") return new Response("ok (duplicate)", { status: 200 });
    console.error("Failed to record event", claim.error.message);
    return new Response("Storage error", { status: 500 });
  }

  try {
    if (event.type === "account.updated" || event.type === "capability.updated") {
      const accountId =
        event.type === "account.updated"
          ? (event.data.object as { id: string }).id
          : ((event as { account?: string }).account ?? "");

      if (accountId) {
        const account = await stripe.accounts.retrieve(accountId);
        await admin
          .from("merchant_stripe_accounts")
          .update({
            payout_status: resolvePayoutStatus(account),
            details_submitted: account.details_submitted ?? false,
            charges_enabled: account.charges_enabled ?? false,
            payouts_enabled: account.payouts_enabled ?? false,
            requirements_due: account.requirements?.currently_due ?? [],
            requirements_disabled_reason: account.requirements?.disabled_reason ?? null,
            last_synced_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", accountId);
      }
    }

    await admin
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Processing error", message);
    await admin.from("stripe_webhook_events").update({ error: message }).eq("stripe_event_id", event.id);
    return new Response("Processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
