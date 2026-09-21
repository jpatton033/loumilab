import type { Collector, Row } from "../types.ts";
import { formatInt, formatMoney, metric } from "../util.ts";
import { inRange, isPaid, loadOrders } from "./orders.ts";

/** Loumilab's own revenue: platform fees on paid orders plus plan subscriptions. */
export const revenueCollector: Collector = {
  key: "revenue",
  title: "Revenue",
  module: "orders",
  async collect(ctx) {
    const { window, previous, monthStart } = ctx;

    const since = new Date(Math.min(previous.start.getTime(), monthStart.getTime()));
    const [orders, { data: subs }] = await Promise.all([
      loadOrders(ctx.db, since),
      ctx.db.from("merchant_subscriptions").select("status, plan_slug, interval, livemode"),
    ]);

    const paid = orders.filter(isPaid);
    const fee = (rows: typeof paid) => rows.reduce((t, o) => t + (o.platform_fee_cents ?? 0), 0);

    const windowPaid = paid.filter((o) => inRange(o, window.start, window.end));
    const previousPaid = paid.filter((o) => inRange(o, previous.start, previous.end));
    const monthPaid = paid.filter((o) => new Date(o.paid_at ?? o.created_at) >= monthStart);

    const stripeFees = windowPaid.reduce((t, o) => t + (o.stripe_fee_cents ?? 0), 0);
    const activeSubs = (subs ?? []).filter(
      (s: { status: string }) => s.status === "active" || s.status === "trialing",
    ).length;

    const rows: Row[] = [
      { label: "Platform fees earned", value: formatMoney(fee(windowPaid)) },
      { label: "Platform fees this month", value: formatMoney(fee(monthPaid)) },
      {
        label: "Stripe processing fees on those orders",
        value: stripeFees > 0 ? formatMoney(stripeFees) : "Not yet reported by Stripe",
      },
      {
        label: "Subscription revenue",
        value: activeSubs > 0 ? `${formatInt(activeSubs)} active plan${activeSubs === 1 ? "" : "s"}` : "No plans billing yet",
      },
    ];

    return {
      key: "revenue",
      title: "Revenue",
      status: "live",
      metrics: [
        metric("Platform fees", formatMoney(fee(windowPaid)), {
          current: fee(windowPaid),
          previous: fee(previousPaid),
        }),
        metric("Month to date", formatMoney(fee(monthPaid))),
        metric("Paid orders", formatInt(windowPaid.length)),
      ],
      rows,
      emptyLine: windowPaid.length === 0 ? "No platform fee revenue was earned in this period." : undefined,
      note:
        activeSubs === 0
          ? "No merchant is on a billing plan yet, so all revenue shown is per-order platform fees."
          : undefined,
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    };
  },
};
