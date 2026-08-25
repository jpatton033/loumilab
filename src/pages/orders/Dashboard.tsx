import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/orders/MetricCard";
import PayoutSetupCard from "@/components/orders/PayoutSetupCard";
import PaymentsPanel from "@/components/orders/PaymentsPanel";
import StorePanel from "@/components/orders/StorePanel";
import OrderQueue from "@/components/orders/OrderQueue";
import EstimatesPanel from "@/components/orders/EstimatesPanel";
import LockedFeature from "@/components/orders/LockedFeature";
import {
  dashboardMetrics,
  demoOrders,
  nextStatus,
  ORDER_STATUSES,
  type MerchantOrder,
  type OrderStatus,
} from "@/data/orders/dashboard";
import { demoStorefront, formatMoney } from "@/data/orders/storefronts";
import {
  useIndustries,
  findIndustry,
  resolveTerms,
  resolveModules,
  resolveWorkflow,
  MODULE_LABELS,
  MODULE_ENTITLEMENT,
  type ModuleKey,
} from "@/lib/orders/industries";
import { useMyMerchant, useJobs, useAdvanceJob, nextJobStatus, JOB_STATUS_LABELS } from "@/lib/orders/commerce";
import { usePublicPlans } from "@/lib/orders/plans";
import { resolveEntitlements, isEnabled, type EntitlementKey } from "@/lib/orders/entitlements";

type Filter = "All" | OrderStatus;
const filters: Filter[] = ["All", ...ORDER_STATUSES];

const Dashboard = () => {
  const [orders, setOrders] = useState<MerchantOrder[]>(demoOrders);
  const [filter, setFilter] = useState<Filter>("All");
  const [accepting, setAccepting] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>("orders");
  /** Demo-only industry preview when the visitor has no merchant record. */
  const [previewIndustry, setPreviewIndustry] = useState(demoStorefront.industrySlug);

  const { data: merchant } = useMyMerchant();
  const { data: industries } = useIndustries();
  const { data: plans } = usePublicPlans();

  const industrySlug = merchant?.industry_slug ?? previewIndustry;
  const industry = findIndustry(industries, industrySlug);
  const terms = resolveTerms(industry);
  const modules = resolveModules(industry);
  const workflow = resolveWorkflow(industry);

  const plan = plans?.find((p) => p.slug === (merchant?.plan_slug ?? "launch")) ?? null;
  const entitlements = resolveEntitlements(plan);

  const { data: jobs } = useJobs(merchant?.id);
  const advanceJob = useAdvanceJob(merchant?.id);

  useEffect(() => {
    if (!modules.includes(activeModule)) setActiveModule(modules[0]);
  }, [industrySlug]);

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

  const moduleAllowed = (key: ModuleKey) => {
    const required = MODULE_ENTITLEMENT[key] as EntitlementKey | undefined;
    return !required || isEnabled(entitlements, required);
  };

  const transactionsLabel = terms.transactions;

  return (
    <Layout>
      <SEOHead
        title="Orders Dashboard — Loumilab Orders"
        description="Manage incoming work, update statuses, and track daily revenue from one simple merchant dashboard."
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
                {merchant?.business_name ?? demoStorefront.name}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {openCount} open {transactionsLabel.toLowerCase().replace(/s$/, "")}
                {openCount === 1 ? "" : "s"} · {formatMoney(openValue)} in the queue
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {industry?.name ?? "Food & Catering"} · {plan?.name ?? "Starter"} plan
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={accepting ? "secondary" : "default"}
                className="rounded-full"
                onClick={() => setAccepting((v) => !v)}
              >
                {accepting ? `Pause new ${transactionsLabel.toLowerCase()}` : `Resume ${transactionsLabel.toLowerCase()}`}
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

          {!merchant && (
            <div className="mt-6 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
              <p>Demo dashboard with sample data. Actions update this screen only.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">Preview industry:</span>
                {(industries ?? []).slice(0, 6).map((i) => (
                  <button
                    key={i.slug}
                    type="button"
                    onClick={() => setPreviewIndustry(i.slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      industrySlug === i.slug
                        ? "border-transparent bg-foreground text-background"
                        : "border-border hover:text-foreground"
                    }`}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {dashboardMetrics.map((m) => (
              <MetricCard
                key={m.id}
                label={m.id === "orders" ? transactionsLabel : m.label}
                value={m.value}
                delta={m.delta}
              />
            ))}
          </div>

          {/* Industry modules */}
          <div className="mt-10 flex flex-wrap gap-2">
            {modules.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveModule(key)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  activeModule === key
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {key === "orders" || key === "jobs"
                  ? transactionsLabel
                  : key === "menu" || key === "products" || key === "services"
                    ? terms.catalog
                    : MODULE_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {/* Transactions */}
            {(activeModule === "orders" || activeModule === "jobs") && (
              <>
                <div className="flex flex-wrap gap-2">
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

                {merchant && jobs?.length ? (
                  <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                      <p className="font-display font-semibold">{transactionsLabel}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {jobs.map((job) => (
                        <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold">{job.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {job.customer_name}
                              {job.service_address && ` · ${job.service_address}`} ·{" "}
                              {JOB_STATUS_LABELS[job.status]}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => advanceJob.mutate({ id: job.id, status: nextJobStatus(job.status) })}
                          >
                            Move to {JOB_STATUS_LABELS[nextJobStatus(job.status)]}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                      <p className="font-display font-semibold">{transactionsLabel} queue</p>
                      <p className="mt-1 text-xs text-muted-foreground">{workflow.join(" → ")}</p>
                    </div>
                    <OrderQueue orders={visible} onAdvance={advance} />
                  </div>
                )}
              </>
            )}

            {/* Catalog */}
            {(activeModule === "menu" || activeModule === "products" || activeModule === "services") && (
              <StorePanel
                merchantId={merchant?.id}
                businessName={merchant?.business_name}
                catalogLabel={terms.catalog}
                itemLabel={terms.catalogItem}
              />
            )}

            {/* Estimates */}
            {activeModule === "estimates" &&
              (moduleAllowed("estimates") ? (
                merchant ? (
                  <EstimatesPanel
                    merchantId={merchant.id}
                    depositsEnabled={isEnabled(entitlements, "deposits.enabled")}
                    invoicingEnabled={isEnabled(entitlements, "invoicing.enabled")}
                  />
                ) : (
                  <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
                    Sign in with a merchant account to send estimates, collect deposits and invoice balances.
                  </div>
                )
              ) : (
                <LockedFeature
                  entitlement="quotes.enabled"
                  description={`Send priced estimates, collect a deposit and invoice the balance for every ${terms.transaction.toLowerCase()}.`}
                />
              ))}

            {/* Schedule */}
            {activeModule === "schedule" &&
              (moduleAllowed("schedule") ? (
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
                  <p className="font-display font-semibold">{terms.schedule}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Approved work appears here with its {terms.schedule.toLowerCase()} and {terms.location.toLowerCase()}.
                  </p>
                </div>
              ) : (
                <LockedFeature
                  entitlement="orders.scheduling"
                  description={`Let customers book a ${terms.schedule.toLowerCase()} and keep your day organised.`}
                />
              ))}

            {activeModule === "customers" && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
                <p className="font-display font-semibold">{terms.customer}s</p>
                {isEnabled(entitlements, "customer_insights.enabled") ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Contact details, history and repeat-visit insight for every {terms.customer.toLowerCase()}.
                  </p>
                ) : (
                  <LockedFeature
                    className="mt-5"
                    entitlement="customer_insights.enabled"
                    description="See repeat customers, lifetime value and who to follow up with."
                  />
                )}
              </div>
            )}

            {activeModule === "payments" && (
              <PaymentsPanel merchantId={merchant?.id} planSlug={merchant?.plan_slug} />
            )}

            {activeModule === "analytics" && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
                <p className="font-display font-semibold">Analytics</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Revenue, {transactionsLabel.toLowerCase()} volume and repeat rate.
                </p>
                {!isEnabled(entitlements, "exports.enabled") && (
                  <LockedFeature
                    className="mt-5"
                    entitlement="exports.enabled"
                    description="Download your data as CSV for accounting and reporting."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
