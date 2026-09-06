import { useState } from "react";
import { ChevronDown, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  openBillingPortal,
  subscribeToPlan,
  useBillingStatus,
  usePayouts,
  type PayoutsSnapshot,
} from "@/lib/orders/billing";
import { openStripeDashboard, usePayoutStatus } from "@/lib/orders/connect";
import { useMerchantOrders } from "@/lib/orders/store-admin";
import { formatCents } from "@/lib/orders/storefront";
import { usePublicPlans } from "@/lib/orders/plans";
import { toast } from "sonner";

/** One line of an order's money breakdown. */
const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : "text-muted-foreground"}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

interface Props {
  merchantId?: string;
  planSlug?: string;
}

/** Stripe payout states in words a merchant recognises. */
const PAYOUT_ROW_LABELS: Record<string, string> = {
  paid: "Paid",
  in_transit: "In transit",
  pending: "Scheduled",
  canceled: "Cancelled",
  failed: "Failed",
};

/**
 * Payout schedule in words. Stripe usually returns a ready-made sentence; when
 * it only returns the raw interval we build one rather than showing vague copy.
 */
const describeSchedule = (p: PayoutsSnapshot): string => {
  if (p.payout_schedule) return p.payout_schedule;
  const delay =
    p.schedule_delay_days !== null
      ? `, ${p.schedule_delay_days} day${p.schedule_delay_days === 1 ? "" : "s"} after the sale`
      : "";
  switch (p.schedule_interval) {
    case "daily":
      return `Paid to your bank every business day${delay}.`;
    case "weekly":
      return `Paid to your bank every week${p.schedule_anchor ? ` on ${p.schedule_anchor}` : ""}${delay}.`;
    case "monthly":
      return `Paid to your bank monthly${p.schedule_anchor ? ` on day ${p.schedule_anchor}` : ""}${delay}.`;
    case "manual":
      return "Payouts are sent when you request them in Stripe.";
    default:
      return "Set in Stripe — open View in Stripe to see or change your schedule.";
  }
};

/**
 * Merchant payments home: Stripe payout balance, payout history, recent paid
 * orders and Loumilab plan billing. All state is read from Stripe or the
 * webhook-written tables — never written from the browser.
 */
const PaymentsPanel = ({ merchantId, planSlug }: Props) => {
  // Payout status decides whether asking Stripe for a balance makes sense at
  // all: before onboarding is finished the request can only fail.
  const { data: connect } = usePayoutStatus();
  const payoutsReady = connect?.account?.payout_status === "payout_enabled";
  const {
    data: payouts,
    isLoading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
    isFetching: payoutsFetching,
  } = usePayouts(!!merchantId && payoutsReady);
  const { data: billing } = useBillingStatus(!!merchantId);
  const { data: orders } = useMerchantOrders(merchantId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: plans } = usePublicPlans();
  const [busy, setBusy] = useState<string | null>(null);

  const go = async (label: string, run: () => Promise<{ url: string }>) => {
    setBusy(label);
    try {
      const { url } = await run();
      window.location.href = url;
    } catch (err) {
      toast.error("Stripe couldn't be reached", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setBusy(null);
    }
  };

  const viewInStripe = async () => {
    setBusy("stripe");
    const url = await openStripeDashboard();
    setBusy(null);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Stripe couldn't be opened", { description: "Please try again in a moment." });
  };

  if (!merchantId) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
        Sign in with a merchant account to see payouts, fees and plan billing.
      </div>
    );
  }

  const currentPlan = plans?.find((p) => p.slug === (billing?.subscription?.plan_slug ?? planSlug));
  const paidOrders = (orders ?? []).filter((o) => o.paid_at);
  const unsettled = (orders ?? []).filter((o) => !o.paid_at && o.status === "pending");
  const grossCents = paidOrders.reduce((n, o) => n + o.total_cents, 0);
  const feesCents = paidOrders.reduce((n, o) => n + (o.platform_fee_cents ?? 0), 0);
  const stripeFeeCents = paidOrders.reduce((n, o) => n + (o.stripe_fee_cents ?? 0), 0);
  const netCents = grossCents - feesCents - stripeFeeCents;

  return (
    <div className="space-y-6">
      {/* Payout balance */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-semibold">Payouts</p>
          {payoutsReady && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={busy !== null}
              onClick={viewInStripe}
            >
              {busy === "stripe" ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ExternalLink size={14} />
              )}
              View in Stripe
            </Button>
          )}
        </div>

        {!payoutsReady ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Finish payments setup above to see your balance and payout history. Once Stripe has
            verified your details, your payouts appear here automatically.
          </p>
        ) : payoutsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading your Stripe balance…</p>
        ) : payoutsError || !payouts ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              We couldn't load your payouts just now. Your money is safe with Stripe — this is only
              the view.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={payoutsFetching}
              onClick={() => void refetchPayouts()}
            >
              {payoutsFetching ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Available</p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">
                  {formatCents(payouts.available_cents, payouts.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">In transit</p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">
                  {formatCents(payouts.pending_cents, payouts.currency)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Payout schedule
              </p>
              <p className="mt-2 text-sm font-medium">{describeSchedule(payouts)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {payouts.next_payout_at
                  ? `Next payout expected ${new Date(payouts.next_payout_at).toLocaleDateString()}.`
                  : "Your next payout appears here as soon as a paid order settles."}
              </p>
            </div>

            {payouts.payouts.length > 0 ? (
              <div className="mt-6 divide-y divide-border border-t border-border">
                {payouts.payouts.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-muted-foreground">
                        {new Date(p.created * 1000).toLocaleDateString()} ·{" "}
                        {PAYOUT_ROW_LABELS[p.status] ?? p.status}
                      </p>
                      {p.arrival_date && p.status !== "paid" && (
                        <p className="text-xs text-muted-foreground">
                          Expected {new Date(p.arrival_date * 1000).toLocaleDateString()}
                        </p>
                      )}
                      {p.failure_message && (
                        <p className="text-xs text-destructive">{p.failure_message}</p>
                      )}
                    </div>
                    <span className="shrink-0 font-semibold">
                      {formatCents(p.amount_cents, p.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No payouts yet. Your first payout arrives a few days after your first paid order.
              </p>
            )}

          </>
        )}
      </div>


      {/* Sales + fees */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-display font-semibold">Recent sales</p>
        {paidOrders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No paid orders yet.</p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Gross</p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">{formatCents(grossCents)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Loumilab fees
                </p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">{formatCents(feesCents)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Card fees
                </p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">
                  {formatCents(stripeFeeCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Net to you</p>
                <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">{formatCents(netCents)}</p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-border border-t border-border">
              {paidOrders.slice(0, 10).map((o) => {
                const open = expanded === o.id;
                const net = o.total_cents - (o.platform_fee_cents ?? 0) - (o.stripe_fee_cents ?? 0);
                return (
                  <div key={o.id} className="py-3 text-sm">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() => setExpanded(open ? null : o.id)}
                    >
                      <span className="min-w-0 truncate text-muted-foreground">
                        {o.reference ?? o.id.slice(0, 8)} · {o.customer_name} · {o.fulfilment}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-semibold">
                        {formatCents(o.total_cents, o.currency)}
                        <ChevronDown
                          size={14}
                          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>

                    {open && (
                      <div className="mt-3 space-y-1.5 rounded-2xl bg-secondary p-4">
                        <Row label="Items" value={formatCents(o.subtotal_cents, o.currency)} />
                        {o.delivery_fee_cents > 0 && (
                          <Row label="Delivery" value={formatCents(o.delivery_fee_cents, o.currency)} />
                        )}
                        {o.tip_cents > 0 && <Row label="Tip" value={formatCents(o.tip_cents, o.currency)} />}
                        {o.tax_cents > 0 && <Row label="Tax" value={formatCents(o.tax_cents, o.currency)} />}
                        <Row label="Customer paid" value={formatCents(o.total_cents, o.currency)} strong />
                        <Row
                          label="Loumilab fee"
                          value={`−${formatCents(o.platform_fee_cents ?? 0, o.currency)}`}
                        />
                        <Row
                          label="Card fee"
                          value={
                            o.stripe_fee_cents === null
                              ? "Pending"
                              : `−${formatCents(o.stripe_fee_cents, o.currency)}`
                          }
                        />
                        <Row label="Net to you" value={formatCents(net, o.currency)} strong />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {unsettled.length > 0 && (
              <p className="mt-5 text-xs text-muted-foreground">
                {unsettled.length} order{unsettled.length === 1 ? "" : "s"} still awaiting payment
                confirmation. We check with Stripe automatically.
              </p>
            )}
          </>
        )}
      </div>

      {/* Loumilab plan */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-display font-semibold">Loumilab plan</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentPlan?.name ?? "Starter"}
          {billing?.subscription
            ? ` · ${billing.subscription.status}${
                billing.subscription.current_period_end
                  ? ` · renews ${new Date(billing.subscription.current_period_end).toLocaleDateString()}`
                  : ""
              }`
            : " · no active subscription"}
          {currentPlan?.fee_label ? ` · ${currentPlan.fee_label}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {(plans ?? [])
            .filter((p) => p.requires_subscription && p.slug !== billing?.subscription?.plan_slug)
            .map((p) => (
              <Button
                key={p.slug}
                variant="outline"
                className="rounded-full"
                disabled={busy !== null}
                onClick={() => go(p.slug, () => subscribeToPlan(p.slug, "month"))}
              >
                {busy === p.slug ? <Loader2 className="animate-spin" size={15} /> : `Upgrade to ${p.name}`}
              </Button>
            ))}

          {billing?.subscription && (
            <Button
              className="rounded-full"
              disabled={busy !== null}
              onClick={() => go("portal", () => openBillingPortal())}
            >
              {busy === "portal" ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <>
                  Manage billing <ExternalLink size={15} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPanel;
