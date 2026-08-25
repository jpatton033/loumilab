import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { stripe, stripeConfigured, stripeLivemode } from "../_shared/stripe.ts";

/**
 * Read-only payout visibility for the signed-in merchant. Stripe Express pays
 * merchants out automatically; this only reports balance and history.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) return json({ error: "Payments are not configured yet." }, 503);

    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: merchant } = await admin
      .from("merchants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!merchant) return json({ error: "No merchant profile yet." }, 404);

    const { data: account } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id, payout_status, livemode")
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (!account) return json({ error: "Payments setup has not been started." }, 404);
    if (account.livemode !== stripeLivemode) return json({ error: "Payments mode mismatch." }, 409);

    const opts = { stripeAccount: account.stripe_account_id };
    const [balance, payouts] = await Promise.all([
      stripe.balance.retrieve(opts),
      stripe.payouts.list({ limit: 10 }, opts),
    ]);

    return json({
      payout_status: account.payout_status,
      available_cents: balance.available.reduce((sum, b) => sum + b.amount, 0),
      pending_cents: balance.pending.reduce((sum, b) => sum + b.amount, 0),
      currency: balance.available[0]?.currency ?? "usd",
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount_cents: p.amount,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date,
        created: p.created,
      })),
    });
  } catch (err) {
    console.error("orders-payouts error", err);
    return json({ error: "We couldn't load payouts right now." }, 500);
  }
});
