import AdminShell from "@/components/admin/AdminShell";
import OrderConversationsPanel from "@/components/admin/OrderConversationsPanel";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/data/orders/storefronts";
import {
  ORDERS_WINDOW_DAYS,
  PAYOUT_STATUS_LABELS,
  useAdminOrdersSnapshot,
} from "@/lib/admin/ordersAdmin";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const MODE_LABEL: Record<string, string> = {
  live: "Live payments",
  test: "Test payments",
  mixed: "Live and test payments",
  none: "No payment accounts yet",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  refunded: "Refunded",
};

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-hero text-3xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const AdminOrders = () => {
  const { data, isLoading } = useAdminOrdersSnapshot();
  const totals = data?.totals;
  const dash = "—";

  return (
    <AdminShell
      title="Orders"
      description={`Live Loumilab Orders activity — last ${ORDERS_WINDOW_DAYS} days.`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/orders">
            <ExternalLink size={14} /> Product page
          </Link>
        </Button>
      }
    >
      <SEOHead title="Orders | Loumilab Admin" description="Loumilab Orders admin." path="/admin/orders" noindex />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Live merchants"
          value={isLoading ? dash : String(totals!.merchantsLive)}
          hint={isLoading ? undefined : `${totals!.merchantsTotal} signed up`}
        />
        <Metric
          label={`Paid orders (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : String(totals!.paidOrdersWindow)}
          hint={isLoading ? undefined : `${totals!.paidOrdersAllTime} all time`}
        />
        <Metric
          label={`Gross sales (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : formatMoney(totals!.grossSalesWindowCents)}
          hint={isLoading ? undefined : MODE_LABEL[data!.mode]}
        />
        <Metric
          label={`Platform fees (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : formatMoney(totals!.platformFeeWindowCents)}
          hint={
            isLoading
              ? undefined
              : totals!.activeSubscriptions > 0
                ? `${totals!.activeSubscriptions} active plan subscription${totals!.activeSubscriptions === 1 ? "" : "s"}`
                : "No plan subscriptions billing yet"
          }
        />
      </div>

      {!isLoading && totals!.testOrders > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {totals!.testOrders} of the most recent orders were placed in Stripe test mode and are included above.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">Merchants &amp; storefronts</h2>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, city"
              className="h-9 w-full sm:w-56"
              aria-label="Search merchants"
            />
          </div>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading merchants…</p>}
            {!isLoading && data!.merchants.length === 0 && (
              <p className="text-sm text-muted-foreground">No merchants have signed up yet.</p>
            )}
            {!isLoading && data!.merchants.length > 0 && merchants.length === 0 && (
              <p className="text-sm text-muted-foreground">No merchants match “{search}”.</p>
            )}
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} onEdit={() => setEditing(m)} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">Plans in use</h2>
            <Link to="/admin/plans" className="text-xs text-muted-foreground transition-colors hover:text-accent">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
            {!isLoading &&
              data!.plans.map((p) => (
                <div key={p.slug} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {p.name}
                      {!p.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                    </p>
                    <p className="font-display text-sm font-semibold">
                      {p.monthlyPriceCents ? `${formatMoney(p.monthlyPriceCents)}/mo` : (p.priceLabel ?? "Free")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.merchantCount} merchant{p.merchantCount === 1 ? "" : "s"}
                    {p.platformFeeBps !== null
                      ? ` · ${(p.platformFeeBps / 100).toFixed(2)}% platform fee per order`
                      : p.feeLabel
                        ? ` · ${p.feeLabel}`
                        : ""}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-sm font-semibold">Recent orders</h2>
        </div>
        {!isLoading && data!.orders.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No orders have been placed yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.orders ?? []).slice(0, 25).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.reference ?? o.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground">{o.merchantName}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{formatMoney(o.totalCents)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatMoney(o.platformFeeCents)}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "pending" || o.status === "failed" ? "outline" : "default"}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                    {!o.livemode && <span className="ml-1 text-xs">(test)</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <OrderConversationsPanel />
    </AdminShell>
  );
};

export default AdminOrders;
