import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen, metric, threshold } from "../util.ts";

/**
 * Payments & Stripe. What is authoritative today is the Connect integration
 * itself: mode, connected-account readiness and webhook processing health.
 * Charge-level figures arrive with customer checkout.
 */
export const paymentsCollector: Collector = {
  key: "payments",
  title: "Payments & Stripe",
  module: "orders",
  async collect(ctx) {
    const { db, window, previous, settings } = ctx;

    const [{ data: events }, { data: accounts }] = await Promise.all([
      db
        .from("stripe_webhook_events")
        .select("id, stripe_event_id, type, livemode, processed_at, error, created_at")
        .gte("created_at", ctx.baselineStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("merchant_stripe_accounts").select("payout_status, livemode, charges_enabled, payouts_enabled"),
    ]);

    const allEvents = events ?? [];
    const inWindow = allEvents.filter(
      (e: { created_at: string }) =>
        new Date(e.created_at) >= window.start && new Date(e.created_at) < window.end,
    );
    const inPrevious = allEvents.filter(
      (e: { created_at: string }) =>
        new Date(e.created_at) >= previous.start && new Date(e.created_at) < previous.end,
    );

    const failed = inWindow.filter((e: { error: string | null }) => e.error);
    const unprocessed = inWindow.filter((e: { processed_at: string | null; error: string | null }) => !e.processed_at && !e.error);

    const liveAccounts = (accounts ?? []).filter((a: { livemode: boolean }) => a.livemode);
    const chargeReady = (accounts ?? []).filter((a: { charges_enabled: boolean }) => a.charges_enabled).length;

    const rows: Row[] = [
      { label: "Connect mode", value: liveAccounts.length > 0 ? "Live" : "Test" },
      { label: "Connected accounts", value: formatInt((accounts ?? []).length) },
      { label: "Accounts able to take charges", value: formatInt(chargeReady) },
      { label: "Webhook events received", value: formatInt(inWindow.length) },
      { label: "Webhook events failed", value: formatInt(failed.length) },
      { label: "Webhook events awaiting processing", value: formatInt(unprocessed.length) },
      {
        label: "Most recent event",
        value: allEvents[0] ? allEvents[0].type : "—",
        note: allEvents[0] ? formatWhen(allEvents[0].created_at, settings.timezone) : undefined,
      },
    ];

    const items: ListItem[] = failed.slice(0, 6).map((e: { type: string; error: string; created_at: string }) => ({
      title: `Webhook failed — ${e.type}`,
      meta: formatWhen(e.created_at, settings.timezone),
      detail: e.error.slice(0, 200),
      linkPath: "/admin/overview",
      linkLabel: "View payments status",
      severity: "critical",
    }));

    const webhookLimit = threshold(settings, "webhook_failures", 0);
    if (failed.length > webhookLimit) {
      ctx.actions.push({
        severity: "critical",
        title: `${failed.length} Stripe webhook event${failed.length === 1 ? "" : "s"} failed to process`,
        detail: failed[0]?.error?.slice(0, 200),
        system: "Loumilab Orders — Stripe webhooks",
        detectedAt: failed[0]?.created_at,
        recommendedAction: "Inspect the failing events and replay them once the cause is fixed; merchant payout status may be stale.",
        linkPath: "/admin/overview",
      });
      ctx.changes.push({ direction: "warn", text: `${failed.length} Stripe webhook failure${failed.length === 1 ? "" : "s"}` });
    }

    ctx.health.push({
      name: "Stripe",
      state: failed.length > 0 ? "issue" : allEvents.length > 0 ? "operational" : "not_monitored",
      note:
        failed.length > 0
          ? "Webhook processing errors detected"
          : allEvents.length > 0
            ? `Last event ${formatWhen(allEvents[0].created_at, settings.timezone)}`
            : "No webhook traffic in the baseline window",
    });

    return {
      key: "payments",
      title: "Payments & Stripe",
      status: "live",
      metrics: [
        metric("Webhook events", formatInt(inWindow.length), {
          current: inWindow.length,
          previous: inPrevious.length,
        }),
        metric("Failed events", formatInt(failed.length), { positiveIsGood: false }),
        metric("Connected accounts", formatInt((accounts ?? []).length)),
      ],
      rows,
      items,
      emptyLine: allEvents.length === 0 ? "No Stripe webhook activity recorded." : undefined,
      note:
        "Payment success rate, processing fees and charge volume become live figures once customer checkout is processing payments.",
      linkPath: "/admin/overview",
      linkLabel: "View payments status",
    };
  },
};
