import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Reveal from "@/components/Reveal";
import {
  annualSavingLabel,
  planPeriodLabel,
  planPriceLabel,
  usePublicPlans,
  type OrdersPlan,
} from "@/lib/orders/plans";
import { cn } from "@/lib/utils";
import { pct } from "@/lib/orders/feeSchedule";
import { useLiveFeeSchedule } from "@/components/orders/ProgressiveFees";

/**
 * Public pricing table. Every value is read from the database so Super Admin
 * pricing changes appear here without a deploy.
 */
const PricingTable = () => {
  const { data: plans = [], isLoading } = usePublicPlans();
  const [annual, setAnnual] = useState(false);
  const annualAvailable = plans.some((p) => p.annual_billing_active && p.annual_price_cents != null);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[520px] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {annualAvailable && (
        <div className="mb-10 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
          {(
            [
              { key: false, label: "Monthly" },
              { key: true, label: "Annual" },
            ] as const
          ).map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setAnnual(option.key)}
              aria-pressed={annual === option.key}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-semibold transition-colors",
                annual === option.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.filter((p) => p.slug !== "custom").map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} annual={annual} delay={i * 80} />
        ))}
      </div>
      {plans.filter((p) => p.slug === "custom").map((plan) => (
        <Reveal key={plan.id} className="mt-6 flex flex-col gap-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-display text-xl font-semibold">{plan.name}{plan.positioning && <span className="ml-2 text-sm font-normal text-muted-foreground">{plan.positioning}</span>}</h3>
            {plan.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to={plan.cta_secondary_href ?? plan.cta_href ?? "/contact"}>{plan.cta_secondary_label ?? plan.cta_label}</Link>
            </Button>
          </div>
        </Reveal>
      ))}
    </div>
  );
};

const PlanCard = ({ plan, annual, delay }: { plan: OrdersPlan; annual: boolean; delay: number }) => {
  const featured = Boolean(plan.badge);
  const saving = annual ? annualSavingLabel(plan) : null;
  const { tiers } = useLiveFeeSchedule();
  const startBps = tiers?.rates?.[plan.slug]?.[0];
  const period = planPeriodLabel(plan, annual);
  const features = plan.features.filter((f) => startBps == null || !/platform fee/i.test(f));

  return (
    <Reveal
      delay={delay}
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-8",
        featured ? "border-accent shadow-[var(--shadow-lift)]" : "border-border shadow-[var(--shadow-soft)]"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
          {plan.badge}
        </span>
      )}

      <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
      {plan.positioning && <p className="mt-1 text-sm text-muted-foreground">{plan.positioning}</p>}

      <p className="mt-6 font-hero text-5xl font-semibold tracking-tight">
        {planPriceLabel(plan, annual)}
        {period && <span className="ml-1.5 text-base font-medium text-muted-foreground">{period}</span>}
      </p>
      <p className="mt-2 min-h-5 text-sm text-muted-foreground">
        {startBps != null ? `Platform fee from ${pct(startBps)}, lower as sales grow` : plan.fee_label}
      </p>
      {saving && <p className="mt-1 text-xs font-medium text-accent">{saving}</p>}

      <Button
        asChild
        size="lg"
        variant={featured ? "default" : "outline"}
        className="mt-7 w-full rounded-full"
      >
        <Link to={plan.cta_href ?? "/orders/get-started"}>{plan.cta_label}</Link>
      </Button>
      {plan.cta_secondary_label && (
        <Link
          to={plan.cta_secondary_href ?? "/contact"}
          className="mt-3 text-center text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {plan.cta_secondary_label}
        </Link>
      )}

      <div className="mt-7 border-t border-border pt-6">
        {plan.description && <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p>}
        <ul className="mt-5 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
};

export default PricingTable;
