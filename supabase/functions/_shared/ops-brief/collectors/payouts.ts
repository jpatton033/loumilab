import type { Collector, Row } from "../types.ts";
import { formatInt, formatMoney, metric } from "../util.ts";
import { inRange, isPaid, loadOrders } from "./orders.ts";

/**
 * Merchant payouts. Stripe holds the payout schedule itself, so this section
 * reports what Loumilab can state with certainty: the merchant proceeds earned
 * on paid orders in the window, and how many connected accounts can actually
 * receive them.
 */
export const payoutsCollector: Collector = {
  key: "payouts",
  title: "Merchant Payouts",
  module: "orders",
  async collect(ctx) {
    const { window, previous } = ctx;

    const [orders, { data: accounts }] = await Promise.all([
      loadOrders(ctx.db, previous.start),
      ctx.db.from("merchant_stripe_accounts").select("merchant_id, payout_status, payouts_enabled, livemode"),
    ]);

    const proceeds = (start: Date, end: Date) =>
      orders
        .filter(isPaid)
        .filter((o) => inRange(o, start, end))
        .reduce((t, o) => t + (o.total_cents - (o.platform_fee_cents ?? 0) - (o.stripe_fee_cents ?? 0)), 0);

    const windowProceeds = proceeds(window.start, window.end);
    const previousProceeds = proceeds(previous.start, previous.end);

    const list = accounts ?? [];
    const enabled = list.filter((a: { payouts_enabled: boolean }) => a.payouts_enabled).length;
    const blocked = list.length - enabled;

    const rows: Row[] = [
      { label: "Merchant proceeds earned", value: formatMoney(windowProceeds) },
      { label: "Connected accounts able to receive payouts", value: formatInt(enabled) },
      { label: "Accounts still blocked", value: formatInt(blocked) },
    ];

    if (blocked > 0) {
      ctx.watch.push(
        `${blocked} connected account${blocked === 1 ? "" : "s"} cannot receive payouts yet — money stays with Stripe until verification finishes.`,
      );
    }

    return {
      key: "payouts",
      title: "Merchant Payouts",
      status: "live",
      metrics: [
        metric("Merchant proceeds", formatMoney(windowProceeds), {
          current: windowProceeds,
          previous: previousProceeds,
        }),
        metric("Payout-ready accounts", formatInt(enabled)),
        metric("Blocked accounts", formatInt(blocked), { positiveIsGood: false }),
      ],
      rows,
      emptyLine: windowProceeds === 0 ? "No merchant proceeds were earned in this period." : undefined,
      note: "Proceeds are order totals less Loumilab platform fees and Stripe processing fees. Stripe pays each merchant on its own payout schedule, so the amount deposited on a given day can differ.",
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    };
  },
};
