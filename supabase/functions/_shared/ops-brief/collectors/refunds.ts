import type { Collector, ListItem, Row, Section } from "../types.ts";
import { formatInt, formatMoney, formatWhen, metric } from "../util.ts";
import { loadOrders } from "./orders.ts";

interface WebhookEvent {
  stripe_event_id: string;
  type: string;
  livemode: boolean;
  created_at: string;
}

/** Stripe webhook events of given types inside the window. */
async function events(
  // deno-lint-ignore no-explicit-any
  db: any,
  prefixes: string[],
  start: Date,
  end: Date,
): Promise<WebhookEvent[]> {
  const { data } = await db
    .from("stripe_webhook_events")
    .select("stripe_event_id, type, livemode, created_at")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(500);
  return ((data ?? []) as WebhookEvent[]).filter((e) => prefixes.some((p) => e.type.startsWith(p)));
}

export const refundsCollector: Collector = {
  key: "refunds",
  title: "Refunds",
  module: "orders",
  async collect(ctx): Promise<Section> {
    const { window, previous } = ctx;

    const [refundEvents, priorEvents, orders] = await Promise.all([
      events(ctx.db, ["charge.refunded", "charge.refund", "refund."], window.start, window.end),
      events(ctx.db, ["charge.refunded", "charge.refund", "refund."], previous.start, previous.end),
      loadOrders(ctx.db, window.start),
    ]);

    const refundedOrders = orders.filter((o) => o.status === "refunded");
    const refundedValue = refundedOrders.reduce((t, o) => t + o.total_cents, 0);

    const rows: Row[] = [
      { label: "Refund events from Stripe", value: formatInt(refundEvents.length) },
      { label: "Orders marked refunded", value: formatInt(refundedOrders.length) },
      { label: "Value of refunded orders", value: formatMoney(refundedValue) },
    ];

    const items: ListItem[] = refundedOrders.slice(0, 6).map((o) => ({
      title: `${o.reference ?? o.id.slice(0, 8)} — ${formatMoney(o.total_cents)}`,
      meta: "Refunded",
      detail: `${o.customer_name} · ${formatWhen(o.paid_at ?? o.created_at, ctx.settings.timezone)}`,
      linkPath: "/admin/orders",
    }));

    if (refundedOrders.length > 0) {
      ctx.changes.push({
        direction: "warn",
        text: `${refundedOrders.length} order${refundedOrders.length === 1 ? "" : "s"} refunded (${formatMoney(refundedValue)})`,
      });
    }

    return {
      key: "refunds",
      title: "Refunds",
      status: "live",
      metrics: [
        metric("Refund events", formatInt(refundEvents.length), {
          current: refundEvents.length,
          previous: priorEvents.length,
          positiveIsGood: false,
        }),
        metric("Refunded value", formatMoney(refundedValue), { positiveIsGood: false }),
      ],
      rows,
      items,
      emptyLine: refundEvents.length === 0 && refundedOrders.length === 0 ? "No refunds in this period." : undefined,
      note: "Loumilab absorbs refunds and negative balances on behalf of merchants, so refunded platform fees are not clawed back from the merchant.",
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    };
  },
};

export const disputesCollector: Collector = {
  key: "disputes",
  title: "Disputes & Chargebacks",
  module: "orders",
  async collect(ctx): Promise<Section> {
    const { window, previous } = ctx;

    const [disputeEvents, priorEvents] = await Promise.all([
      events(ctx.db, ["charge.dispute"], window.start, window.end),
      events(ctx.db, ["charge.dispute"], previous.start, previous.end),
    ]);

    const opened = disputeEvents.filter((e) => e.type === "charge.dispute.created");

    for (const e of opened) {
      ctx.actions.push({
        severity: "critical",
        title: "A customer opened a payment dispute",
        detail: `Stripe event ${e.stripe_event_id}${e.livemode ? "" : " (test mode)"}.`,
        system: "Loumilab Orders — Disputes",
        detectedAt: e.created_at,
        recommendedAction: "Gather the order receipt and fulfilment evidence and respond in Stripe before the evidence deadline.",
        linkPath: "/admin/orders",
      });
    }

    const rows: Row[] = [
      { label: "Disputes opened", value: formatInt(opened.length) },
      { label: "All dispute events", value: formatInt(disputeEvents.length) },
    ];

    return {
      key: "disputes",
      title: "Disputes & Chargebacks",
      status: "live",
      metrics: [
        metric("Disputes opened", formatInt(opened.length), {
          current: opened.length,
          previous: priorEvents.filter((e) => e.type === "charge.dispute.created").length,
          positiveIsGood: false,
        }),
      ],
      rows,
      items: disputeEvents.slice(0, 6).map((e) => ({
        title: e.type,
        meta: e.livemode ? "Live" : "Test mode",
        detail: formatWhen(e.created_at, ctx.settings.timezone),
      })),
      emptyLine: disputeEvents.length === 0 ? "No disputes or chargebacks in this period." : undefined,
      note: "Evidence deadlines are tracked in Stripe; any new dispute is raised in Action Required above.",
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    };
  },
};
