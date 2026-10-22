import { TrendingDown } from "lucide-react";
import { FEE_PLANS, marginalBps, nextThreshold, pct, progressiveFee, usd, useMerchantFeeProgress } from "@/lib/orders/feeSchedule";

/** "Your fee this month" — shown only when progressive pricing is live. */
const FeeProgressCard = ({ enabled }: { enabled: boolean }) => {
  const { data: p } = useMerchantFeeProgress(enabled);
  if (!p?.schedule) return null;
  const tiers = p.schedule.tiers;
  const rate = marginalBps(tiers, p.plan_slug, p.volume_cents);
  if (rate === null) return null;
  const next = nextThreshold(tiers, p.volume_cents);
  const nextRate = next !== null ? marginalBps(tiers, p.plan_slug, next) : null;
  const flat = Math.round((p.volume_cents * p.flat_bps) / 10000);
  const tiered = progressiveFee(tiers, p.plan_slug, 0, p.volume_cents)?.feeCents ?? flat;
  const savings = flat - tiered;
  const planName = FEE_PLANS.find((x) => x.slug === p.plan_slug)?.name ?? p.plan_slug;

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-primary" aria-hidden />
        <p className="font-semibold">Your fee this month</p>
        <span className="ml-auto text-sm text-muted-foreground">{planName} plan</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Current rate</dt><dd className="text-lg font-semibold">{pct(rate)}</dd></div>
        <div><dt className="text-muted-foreground">Sales this month</dt><dd className="text-lg font-semibold">{usd(p.volume_cents)}</dd></div>
        <div><dt className="text-muted-foreground">Loumilab fees</dt><dd className="text-lg font-semibold">{usd(p.fees_cents)}</dd></div>
        <div><dt className="text-muted-foreground">Saved vs flat {pct(p.flat_bps)}</dt><dd className="text-lg font-semibold">{savings > 0 ? usd(savings) : "—"}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        {next !== null && nextRate !== null
          ? `${usd(next - p.volume_cents)} more in sales and your rate drops to ${pct(nextRate)} on sales above ${usd(next)}.`
          : "You're at the lowest rate for your plan."}{" "}
        Lower rates apply only to sales after each threshold. Resets on the 1st (Eastern).
      </p>
    </div>
  );
};

export default FeeProgressCard;
