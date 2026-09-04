import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/** Full lifecycle recorded on a storefront order. */
export type LiveOrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "refunded";

export const ORDER_STATUS_LABELS: Record<LiveOrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "New",
  failed: "Payment failed",
  cancelled: "Cancelled",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  refunded: "Refunded",
};

/** Stages a merchant actively moves an order through. */
export const ACTIVE_ORDER_STATUSES: LiveOrderStatus[] = [
  "paid",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
];

/** Orders that are finished or need no merchant action. */
export const CLOSED_ORDER_STATUSES: LiveOrderStatus[] = [
  "completed",
  "cancelled",
  "refunded",
  "failed",
  "pending",
];

export interface LiveOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  product_id: string | null;
}

export interface LiveOrder {
  id: string;
  reference: string | null;
  public_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfilment: "pickup" | "delivery";
  delivery_address: string | null;
  customer_notes: string | null;
  status: LiveOrderStatus;
  currency: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tip_cents: number;
  tax_cents: number;
  total_cents: number;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
  order_items: LiveOrderItem[];
}

export const ORDERS_QUERY_KEY = ["orders", "merchant-orders"] as const;

const SELECT =
  "id, reference, public_token, customer_name, customer_email, customer_phone, fulfilment, delivery_address, customer_notes, status, currency, subtotal_cents, delivery_fee_cents, tip_cents, tax_cents, total_cents, paid_at, failure_reason, created_at, order_items(id, name, quantity, unit_price_cents, line_total_cents, product_id)";

/** Last 90 days of a merchant's own orders, newest first. */
export const useMerchantOrders = (merchantId?: string) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...ORDERS_QUERY_KEY, merchantId ?? "none"],
    enabled: Boolean(merchantId),
    queryFn: async (): Promise<LiveOrder[]> => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select(SELECT)
        .eq("merchant_id", merchantId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as LiveOrder[];
    },
  });

  // Keep the queue fresh when a customer checks out while the merchant watches.
  useEffect(() => {
    if (!merchantId) return;
    const channel = supabase
      .channel(`merchant-orders-${merchantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `merchant_id=eq.${merchantId}` },
        () => {
          void qc.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, merchantId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [merchantId, qc]);

  return query;
};

/** Next stage for an order, respecting pickup vs delivery. */
export const nextOrderStatus = (order: Pick<LiveOrder, "status" | "fulfilment">): LiveOrderStatus | null => {
  switch (order.status) {
    case "paid":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return order.fulfilment === "delivery" ? "out_for_delivery" : "completed";
    case "out_for_delivery":
      return "completed";
    default:
      return null;
  }
};

export const useAdvanceOrder = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LiveOrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { status }) => {
      void qc.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, merchantId ?? "none"] });
      toast({ title: `Moved to ${ORDER_STATUS_LABELS[status]}` });
    },
    onError: () =>
      toast({
        title: "Could not update that order",
        description: "Please try again in a moment.",
        variant: "destructive",
      }),
  });
};

/* ------------------------------------------------------------------ */
/* Analytics derived from the same orders, so every figure agrees.     */
/* ------------------------------------------------------------------ */

export interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface WindowStats {
  revenueCents: number;
  orders: number;
  averageCents: number;
}

export interface TopItem {
  name: string;
  quantity: number;
  revenueCents: number;
}

export interface TopCustomer {
  name: string;
  email: string;
  orders: number;
  spendCents: number;
}

export interface OrderAnalytics {
  currency: string;
  hasData: boolean;
  today: WindowStats;
  sameDayLastWeek: WindowStats;
  awaitingAction: number;
  last7: WindowStats;
  last30: WindowStats;
  previous30: WindowStats;
  trend: DayPoint[];
  topItems: TopItem[];
  pickupOrders: number;
  deliveryOrders: number;
  tipsCents: number;
  repeatRate: number;
  repeatCustomers: number;
  topCustomers: TopCustomer[];
}

/** Revenue only counts orders the customer actually paid for. */
const isRevenue = (o: LiveOrder) => Boolean(o.paid_at) && o.status !== "refunded" && o.status !== "failed";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const summarise = (orders: LiveOrder[]): WindowStats => {
  const revenueCents = orders.reduce((s, o) => s + o.total_cents, 0);
  return {
    revenueCents,
    orders: orders.length,
    averageCents: orders.length ? Math.round(revenueCents / orders.length) : 0,
  };
};

export const buildOrderAnalytics = (orders: LiveOrder[]): OrderAnalytics => {
  const paid = orders.filter(isRevenue);
  const now = new Date();
  const today = startOfDay(now);
  const at = (o: LiveOrder) => new Date(o.paid_at ?? o.created_at);
  const between = (from: Date, to: Date) => paid.filter((o) => at(o) >= from && at(o) < to);

  const tomorrow = new Date(today.getTime() + 86400000);
  const lastWeekDay = new Date(today.getTime() - 7 * 86400000);
  const day30 = new Date(today.getTime() - 29 * 86400000);
  const day60 = new Date(today.getTime() - 59 * 86400000);
  const day7 = new Date(today.getTime() - 6 * 86400000);

  const trend: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(day30.getTime() + i * 86400000);
    const rows = between(d, new Date(d.getTime() + 86400000));
    return {
      date: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: rows.reduce((s, o) => s + o.total_cents, 0) / 100,
      orders: rows.length,
    };
  });

  const window30 = between(day30, tomorrow);

  const itemTotals = new Map<string, TopItem>();
  for (const order of window30) {
    for (const item of order.order_items ?? []) {
      const entry = itemTotals.get(item.name) ?? { name: item.name, quantity: 0, revenueCents: 0 };
      entry.quantity += item.quantity;
      entry.revenueCents += item.line_total_cents;
      itemTotals.set(item.name, entry);
    }
  }

  const byCustomer = new Map<string, TopCustomer>();
  for (const order of paid) {
    const key = (order.customer_email || order.customer_name).toLowerCase();
    const entry =
      byCustomer.get(key) ??
      { name: order.customer_name, email: order.customer_email, orders: 0, spendCents: 0 };
    entry.orders += 1;
    entry.spendCents += order.total_cents;
    byCustomer.set(key, entry);
  }
  const customers = [...byCustomer.values()];
  const repeatCustomers = customers.filter((c) => c.orders > 1).length;
  const repeatOrders = customers.filter((c) => c.orders > 1).reduce((s, c) => s + c.orders, 0);

  return {
    currency: orders[0]?.currency ?? "USD",
    hasData: paid.length > 0,
    today: summarise(between(today, tomorrow)),
    sameDayLastWeek: summarise(between(lastWeekDay, new Date(lastWeekDay.getTime() + 86400000))),
    awaitingAction: orders.filter((o) => ["paid", "preparing", "ready", "out_for_delivery"].includes(o.status))
      .length,
    last7: summarise(between(day7, tomorrow)),
    last30: summarise(window30),
    previous30: summarise(between(day60, day30)),
    trend,
    topItems: [...itemTotals.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 6),
    pickupOrders: window30.filter((o) => o.fulfilment === "pickup").length,
    deliveryOrders: window30.filter((o) => o.fulfilment === "delivery").length,
    tipsCents: window30.reduce((s, o) => s + o.tip_cents, 0),
    repeatRate: paid.length ? Math.round((repeatOrders / paid.length) * 100) : 0,
    repeatCustomers,
    topCustomers: customers.sort((a, b) => b.spendCents - a.spendCents).slice(0, 5),
  };
};

export const useOrderAnalytics = (orders?: LiveOrder[]) =>
  useMemo(() => buildOrderAnalytics(orders ?? []), [orders]);

/** "+12% vs last week" style helper; returns null when there is nothing to compare. */
export const describeChange = (current: number, previous: number): string | null => {
  if (!previous) return current ? "First activity in this period" : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "Level with last week";
  return `${pct > 0 ? "+" : ""}${pct}% vs last week`;
};
