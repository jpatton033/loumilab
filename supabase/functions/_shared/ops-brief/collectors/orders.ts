import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatMoney, formatWhen, metric } from "../util.ts";

/** Order statuses that represent money actually taken. */
export const PAID_STATUSES = [
  "paid",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "refunded",
];

export interface OrderRow {
  id: string;
  merchant_id: string;
  reference: string | null;
  customer_name: string;
  status: string;
  fulfilment: string;
  currency: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tip_cents: number;
  tax_cents: number;
  total_cents: number;
  platform_fee_cents: number;
  stripe_fee_cents: number | null;
  service_fee_cents: number;
  livemode: boolean;
  paid_at: string | null;
  created_at: string;
}

/** Loads the orders needed by the orders, revenue and payouts collectors once. */
export async function loadOrders(
  // deno-lint-ignore no-explicit-any
  db: any,
  since: Date,
): Promise<OrderRow[]> {
  const { data } = await db
    .from("orders")
    .select(
      "id, merchant_id, reference, customer_name, status, fulfilment, currency, subtotal_cents, delivery_fee_cents, tip_cents, tax_cents, total_cents, platform_fee_cents, stripe_fee_cents, service_fee_cents, livemode, paid_at, created_at",
    )
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  return (data ?? []) as OrderRow[];
}

export const isPaid = (o: OrderRow) => Boolean(o.paid_at) || PAID_STATUSES.includes(o.status);

export const inRange = (o: OrderRow, start: Date, end: Date) => {
  const t = new Date(o.paid_at ?? o.created_at).getTime();
  return t >= start.getTime() && t < end.getTime();
};

const sum = (rows: OrderRow[], pick: (o: OrderRow) => number) => rows.reduce((t, o) => t + (pick(o) ?? 0), 0);

/**
 * Loumilab Orders — real order activity for the reporting window. Checkout is
 * live, so these are authoritative figures taken from the orders table.
 */
export const ordersCollector: Collector = {
  key: "orders",
  title: "Loumilab Orders",
  module: "orders",
  async collect(ctx) {
    const { window, previous, settings } = ctx;

    const orders = await loadOrders(ctx.db, previous.start);
    const windowOrders = orders.filter((o) => inRange(o, window.start, window.end));
    const paid = windowOrders.filter(isPaid);
    const previousPaid = orders.filter((o) => inRange(o, previous.start, previous.end)).filter(isPaid);

    const failed = windowOrders.filter((o) => o.status === "failed");
    const pending = windowOrders.filter((o) => o.status === "pending");
    const gross = sum(paid, (o) => o.total_cents);
    const average = paid.length > 0 ? Math.round(gross / paid.length) : 0;
    const delivery = paid.filter((o) => o.fulfilment === "delivery").length;
    const testOrders = paid.filter((o) => !o.livemode).length;

    const rows: Row[] = [
      { label: "Paid orders", value: formatInt(paid.length) },
      { label: "Gross sales", value: formatMoney(gross) },
      { label: "Average order", value: paid.length > 0 ? formatMoney(average) : "—" },
      { label: "Tips", value: formatMoney(sum(paid, (o) => o.tip_cents)) },
      { label: "Tax collected", value: formatMoney(sum(paid, (o) => o.tax_cents)) },
      { label: "Delivery fees", value: formatMoney(sum(paid, (o) => o.delivery_fee_cents)) },
      { label: "Service fees", value: formatMoney(sum(paid, (o) => o.service_fee_cents)) },
      {
        label: "Pickup / delivery",
        value: `${formatInt(paid.length - delivery)} / ${formatInt(delivery)}`,
      },
      { label: "Failed checkouts", value: formatInt(failed.length) },
      { label: "Awaiting payment", value: formatInt(pending.length) },
    ];

    if (testOrders > 0) {
      rows.push({ label: "Placed in Stripe test mode", value: formatInt(testOrders) });
    }

    const items: ListItem[] = paid.slice(0, 6).map((o) => ({
      title: `${o.reference ?? o.id.slice(0, 8)} — ${formatMoney(o.total_cents)}`,
      meta: `${o.status} · ${o.fulfilment}`,
      detail: `${o.customer_name} · ${formatWhen(o.paid_at ?? o.created_at, settings.timezone)}${o.livemode ? "" : " · test mode"}`,
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    }));

    if (failed.length > 0) {
      ctx.actions.push({
        severity: failed.length >= 3 ? "important" : "review",
        title: `${failed.length} checkout${failed.length === 1 ? "" : "s"} failed to complete payment`,
        detail: "Customers reached Stripe Checkout but the payment did not succeed.",
        system: "Loumilab Orders — Checkout",
        recommendedAction: "Check the failure reasons on those orders; repeated failures can point at a card or Connect configuration problem.",
        linkPath: "/admin/orders",
      });
    }

    if (paid.length > 0) {
      ctx.changes.push({
        direction: paid.length >= previousPaid.length ? "up" : "down",
        text: `${paid.length} paid order${paid.length === 1 ? "" : "s"} totalling ${formatMoney(gross)}`,
      });
    }

    return {
      key: "orders",
      title: "Loumilab Orders",
      status: "live",
      metrics: [
        metric("Paid orders", formatInt(paid.length), { current: paid.length, previous: previousPaid.length }),
        metric("Gross sales", formatMoney(gross), {
          current: gross,
          previous: sum(previousPaid, (o) => o.total_cents),
        }),
        metric("Average order", paid.length > 0 ? formatMoney(average) : "—"),
      ],
      rows,
      items,
      emptyLine: windowOrders.length === 0 ? "No orders were placed in this period." : undefined,
      linkPath: "/admin/orders",
      linkLabel: "View orders",
    };
  },
};
