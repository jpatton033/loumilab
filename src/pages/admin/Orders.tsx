import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardMetrics, demoOrders } from "@/data/orders/dashboard";
import { formatMoney, storefronts } from "@/data/orders/storefronts";
import { pricingPlans } from "@/data/orders/pricing";
import { ExternalLink, Info } from "lucide-react";
import { Link } from "react-router-dom";

const AdminOrders = () => (
  <AdminShell
    title="Orders"
    description="Loumilab Orders control panel — read-only preview."
    actions={
      <Button variant="outline" size="sm" asChild>
        <Link to="/orders">
          <ExternalLink size={14} /> Product page
        </Link>
      </Button>
    }
  >
    <SEOHead title="Orders | Loumilab Admin" description="Loumilab Orders admin preview." path="/admin/orders" noindex />

    <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 text-sm shadow-[var(--shadow-soft)]">
      <Info size={16} className="mt-0.5 shrink-0 text-accent" />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Preview — mock data.</span> These panels read from the local
        Orders demo data. When merchant, product, and order tables go live, only the data source changes — the
        layout stays.
      </p>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {dashboardMetrics.map((m) => (
        <div key={m.id} className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {m.label}
          </p>
          <p className="mt-2 font-hero text-3xl font-semibold tracking-tight">{m.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.delta}</p>
        </div>
      ))}
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-sm font-semibold">Merchants &amp; storefronts</h2>
        <div className="mt-4 space-y-3">
          {storefronts.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-xs font-bold">
                {s.monogram}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.location} · {s.products.length} products
                </p>
              </div>
              <Badge variant={s.acceptingOrders ? "default" : "outline"}>
                {s.acceptingOrders ? "Open" : "Closed"}
              </Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/orders/store/${s.slug}`} aria-label={`View ${s.name}`}>
                  <ExternalLink size={14} />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-sm font-semibold">Plan tiers</h2>
        <div className="mt-4 space-y-3">
          {pricingPlans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="font-display text-sm font-semibold">
                  {p.price}
                  {p.period ? <span className="text-xs font-normal text-muted-foreground"> {p.period}</span> : null}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.transactionFee ?? p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-display text-sm font-semibold">Order queue snapshot</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Placed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demoOrders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.number}</TableCell>
              <TableCell>{o.customer}</TableCell>
              <TableCell className="text-muted-foreground">{o.items}</TableCell>
              <TableCell>{formatMoney(o.totalCents)}</TableCell>
              <TableCell>
                <Badge variant={o.status === "New" ? "default" : "outline"}>{o.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{o.placedAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </AdminShell>
);

export default AdminOrders;
