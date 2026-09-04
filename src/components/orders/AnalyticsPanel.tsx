import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MapPin, TrendingUp, Truck, Users } from "lucide-react";
import { formatCents } from "@/lib/orders/storefront";
import { describeChange, type OrderAnalytics } from "@/lib/orders/orders";

interface Props {
  analytics: OrderAnalytics;
  transactionsLabel: string;
  catalogItemLabel: string;
}

const Stat = ({ label, value, note }: { label: string; value: string; note?: string | null }) => (
  <div className="rounded-2xl border border-border bg-secondary p-4">
    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-display text-xl font-semibold tracking-tight">{value}</p>
    {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
  </div>
);

const AnalyticsPanel = ({ analytics, transactionsLabel, catalogItemLabel }: Props) => {
  const { currency } = analytics;
  const money = (cents: number) => formatCents(cents, currency);
  const fulfilment = analytics.pickupOrders + analytics.deliveryOrders;

  if (!analytics.hasData) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)] sm:p-10">
        <TrendingUp size={20} className="mx-auto text-muted-foreground" />
        <p className="mt-3 font-display font-semibold">Analytics start with your first paid order</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Once customers start paying on your storefront, this is where you will see revenue by day, your
          best sellers, pickup versus delivery, and who keeps coming back.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display font-semibold">Revenue, last 30 days</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {money(analytics.last30.revenueCents)} from {analytics.last30.orders}{" "}
              {transactionsLabel.toLowerCase()}
              {describeChange(analytics.last30.revenueCents, analytics.previous30.revenueCents)
                ? ` · ${
                    analytics.previous30.revenueCents
                      ? `${
                          analytics.last30.revenueCents >= analytics.previous30.revenueCents ? "up" : "down"
                        } on the 30 days before`
                      : "your first 30 days of sales"
                  }`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Last 7 days
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{money(analytics.last7.revenueCents)}</p>
          </div>
        </div>

        <div className="mt-6 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.trend} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="ordersRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval={6}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: 12,
                }}
                formatter={(value: number, name) =>
                  name === "revenue" ? [money(Math.round(value * 100)), "Revenue"] : [value, "Orders"]
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#ordersRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label={transactionsLabel} value={String(analytics.last30.orders)} note="Last 30 days" />
          <Stat label="Average order" value={money(analytics.last30.averageCents)} note="Last 30 days" />
          <Stat label="Tips collected" value={money(analytics.tipsCents)} note="Last 30 days" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="font-display font-semibold">Best sellers</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your top {catalogItemLabel.toLowerCase()}s by revenue over the last 30 days.
          </p>
          <ul className="mt-5 divide-y divide-border">
            {analytics.topItems.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} sold</p>
                </div>
                <p className="font-display text-sm font-semibold">{money(item.revenueCents)}</p>
              </li>
            ))}
            {!analytics.topItems.length && (
              <li className="py-3 text-sm text-muted-foreground">Nothing sold in the last 30 days yet.</li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <p className="font-display font-semibold">How customers get their order</p>
            <div className="mt-5 space-y-4">
              {[
                { icon: MapPin, label: "Pickup", count: analytics.pickupOrders },
                { icon: Truck, label: "Delivery", count: analytics.deliveryOrders },
              ].map(({ icon: Icon, label, count }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Icon size={14} className="text-muted-foreground" /> {label}
                    </span>
                    <span className="text-muted-foreground">
                      {count} · {fulfilment ? Math.round((count / fulfilment) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${fulfilment ? (count / fulfilment) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-accent" />
              <p className="font-display font-semibold">Returning customers</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {analytics.repeatRate}% of your orders come from the {analytics.repeatCustomers} customer
              {analytics.repeatCustomers === 1 ? "" : "s"} who have ordered more than once.
            </p>
            <ul className="mt-4 divide-y divide-border">
              {analytics.topCustomers.map((c) => (
                <li key={c.email || c.name} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.orders} order{c.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="font-display text-sm font-semibold">{money(c.spendCents)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
