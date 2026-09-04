import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { stripe, stripeConfigured, stripeLivemode } from "../_shared/stripe.ts";

/**
 * Read-only payout visibility for the signed-in merchant. Stripe Express pays
 * merchants out automatically; this only reports balance, schedule and history.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Turn Stripe's payout schedule object into a sentence a merchant can read. */
function describeSchedule(schedule: {
  interval?: string;
  delay_days?: number;
  weekly_anchor?: string;
  monthly_anchor?: number;
} | null | undefined): string | null {
  if (!schedule?.interval) return null;
  const delay = typeof schedule.delay_days === "number" ? schedule.delay_days : null;
  const tail = delay !== null ? `, ${delay} day${delay === 1 ? "" : "s"} after the sale` : "";
  switch (schedule.interval) {
    case "manual":
      return "Payouts are sent when you request them in Stripe.";
    case "daily":
      return `Paid to your bank every business day${tail}.`;
    case "weekly": {
      const anchor = schedule.weekly_anchor
        ? schedule.weekly_anchor.charAt(0).toUpperCase() + schedule.weekly_anchor.slice(1)
        : DAYS[0];
      return `Paid to your bank every week on ${anchor}${tail}.`;
    }
    case "monthly": {
      const day = schedule.monthly_anchor ?? 1;
      return `Paid to your bank monthly on day ${day} of the month${tail}.`;
    }
    default:
      return null;
  }
}

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
    if (!merchant) return json({ error: "No merchant profile yet.", code: "no_merchant" }, 404);

    const { data: account } = await admin
      .from("merchant_stripe_accounts")
      .select("stripe_account_id, payout_status, livemode, details_submitted, payouts_enabled")
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (!account) {
      return json({ error: "Payments setup has not been started.", code: "not_started" }, 404);
    }
    if (account.livemode !== stripeLivemode) {
      return json({ error: "Payments mode mismatch.", code: "mode_mismatch" }, 409);
    }
    if (!account.details_submitted || !account.payouts_enabled) {
      return json(
        {
          error: "Payments setup is not finished yet.",
          code: "onboarding_incomplete",
          payout_status: account.payout_status,
        },
        409,
      );
    }

    const opts = { stripeAccount: account.stripe_account_id };
    const [balance, payouts, connected] = await Promise.all([
      stripe.balance.retrieve(opts),
      stripe.payouts.list({ limit: 10 }, opts),
      stripe.accounts.retrieve(account.stripe_account_id),
    ]);

    // The next expected payout is the soonest pending/in-transit arrival date.
    const upcoming = payouts.data
      .filter((p) => p.status === "pending" || p.status === "in_transit")
      .map((p) => p.arrival_date)
      .filter((d): d is number => typeof d === "number")
      .sort((a, b) => a - b)[0];

    return json({
      payout_status: account.payout_status,
      available_cents: balance.available.reduce((sum, b) => sum + b.amount, 0),
      pending_cents: balance.pending.reduce((sum, b) => sum + b.amount, 0),
      currency: balance.available[0]?.currency ?? "usd",
      payout_schedule: describeSchedule(connected.settings?.payouts?.schedule ?? null),
      next_payout_at: upcoming ? new Date(upcoming * 1000).toISOString() : null,
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount_cents: p.amount,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date ?? null,
        created: p.created,
        failure_message: p.failure_message ?? null,
      })),
    });
  } catch (err) {
    console.error("orders-payouts error", err);
    return json({ error: "We couldn't load payouts right now." }, 500);
  }
});
