import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/orders/MetricCard";
import PayoutSetupCard from "@/components/orders/PayoutSetupCard";
import OrderQueue from "@/components/orders/OrderQueue";
import { dashboardMetrics, demoOrders, nextStatus, ORDER_STATUSES, type MerchantOrder, type OrderStatus } from "@/data/orders/dashboard";
import { demoStorefront, formatMoney } from "@/data/orders/storefronts";

type Filter = "All" | OrderStatus;
const filters: Filter[] = ["All", ...ORDER_STATUSES];

const Dashboard = () => {
  const [orders, setOrders] = useState<MerchantOrder[]>(demoOrders);
  const [filter, setFilter] = useState<Filter>("All");
  const [accepting, setAccepting] = useState(true);

  const visible = useMemo(
    () => (filter === "All" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const advance = (orderId: string) =>
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus(o.status) } : o)));

  const openCount = orders.filter((o) => o.status !== "Completed").length;
  const openValue = orders
    .filter((o) => o.status !== "Completed")
    .reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <Layout>
      <SEOHead
        title="Orders Dashboard — Loumilab Orders"
        description="Manage incoming orders, update statuses, and track daily revenue from one simple merchant dashboard."
        path="/orders/dashboard"
        noindex
      />

      <section className="section-padding pt-28 lg:pt-36">
        <div className="section-container">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> Back to Orders
          </Link>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Merchant dashboard</Eyebrow>
              <h1 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
                {demoStorefront.name}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {openCount} open order{openCount === 1 ? "" : "s"} · {formatMoney(openValue)} in the queue
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={accepting ? "secondary" : "default"}
                className="rounded-full"
                onClick={() => setAccepting((v) => !v)}
              >
                {accepting ? "Pause new orders" : "Resume orders"}
              </Button>
              <Button variant="outline" asChild className="rounded-full">
                <Link to={`/orders/store/${demoStorefront.slug}`}>
                  View storefront <ExternalLink size={15} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <PayoutSetupCard />
          </div>

          <p className="mt-6 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
            Demo dashboard with sample data. Order actions update this screen only.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {dashboardMetrics.map((m) => (
              <MetricCard key={m.id} label={m.label} value={m.value} delta={m.delta} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
                {f !== "All" && ` (${orders.filter((o) => o.status === f).length})`}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="font-display font-semibold">Order queue</p>
            </div>
            <OrderQueue orders={visible} onAdvance={advance} />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
