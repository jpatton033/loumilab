import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openBillingPortal, subscribeToPlan, useBillingStatus, usePayouts } from "@/lib/orders/billing";
import { useMerchantOrders } from "@/lib/orders/store-admin";
import { formatCents } from "@/lib/orders/storefront";
import { usePublicPlans } from "@/lib/orders/plans";
import { toast } from "sonner";

interface Props {
  merchantId?: string;
  planSlug?: string;
}

/**
 * Merchant payments home: Stripe payout balance, payout history, recent paid
 * orders and Loumilab plan billing. All state is read from Stripe or the
 * webhook-written tables — never written from the browser.
 */
const PaymentsPanel = ({ merchantId, planSlug }: Props) => {
  const { data: payouts, isLoading: payoutsLoading, error: payoutsError } = usePayouts(!!merchantId);
  const { data: billing } = useBillingStatus(!!merchantId);
  const { data: orders } = useMerchantOrders(merchantId);
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

  if (!merchantId) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
        Sign in with a merchant account to see payouts, fees and plan billing.
      </div>
    );
  }

  const currentPlan = plans?.find((p) => p.slug === (billing?.subscription?.plan_slug ?? planSlug));
  const paidOrders = (orders ?? []).filter((o) => o.paid_at);
  const grossCents = paidOrders.reduce((n, o) => n + o.total_cents, 0);
  const feesCents = paidOrders.reduce((n, o) => n + (o.platform_fee_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Payout balance */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-display font-semibold">Payouts</p>
        {payoutsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading your Stripe balance…</p>
        ) : payoutsError || !payouts ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Finish payout setup above to see your balance and payout history.
          </p>
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

            {payouts.payouts.length > 0 && (
              <div className="mt-6 divide-y divide-border border-t border-border">
                {payouts.payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(p.created * 1000).toLocaleDateString()} · {p.status}
                    </span>
                    <span className="font-semibold">{formatCents(p.amount_cents, p.currency)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 text-xs text-muted-foreground">
              Stripe pays your bank account automatically on your payout schedule.
            </p>
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            </div>
            <div className="mt-6 divide-y divide-border border-t border-border">
              {paidOrders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {o.reference ?? o.id.slice(0, 8)} · {o.customer_name} · {o.fulfilment}
                  </span>
                  <span className="font-semibold">{formatCents(o.total_cents, o.currency)}</span>
                </div>
              ))}
            </div>
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
