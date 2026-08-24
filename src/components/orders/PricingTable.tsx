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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} annual={annual} delay={i * 80} />
        ))}
      </div>
    </div>
  );
};

const PlanCard = ({ plan, annual, delay }: { plan: OrdersPlan; annual: boolean; delay: number }) => {
  const featured = Boolean(plan.badge);
  const saving = annual ? annualSavingLabel(plan) : null;

  return (
    <Reveal
      delay={delay}
      className={cn(
        "flex flex-col rounded-3xl border p-7",
        featured
          ? "border-transparent bg-foreground text-background shadow-[var(--shadow-lift)]"
          : "border-border bg-card shadow-[var(--shadow-soft)]"
      )}
    >
      <div className="flex min-h-6 items-start justify-between gap-2">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em]">{plan.name}</p>
        {plan.badge && (
          <span className="rounded-full bg-background/15 px-3 py-1 text-[10px] font-semibold leading-tight">
            {plan.badge}
          </span>
        )}
      </div>

      <p className={cn("mt-2 text-sm font-medium", featured ? "text-background/80" : "text-accent")}>
        {plan.positioning}
      </p>

      <p className="mt-5 font-hero text-4xl font-semibold tracking-tight">
        {planPriceLabel(plan, annual)}
        {planPeriodLabel(plan, annual) && (
          <span
            className={cn(
              "ml-2 text-sm font-medium",
              featured ? "text-background/70" : "text-muted-foreground"
            )}
          >
            {planPeriodLabel(plan, annual)}
          </span>
        )}
      </p>

      {plan.fee_label && (
        <p className={cn("mt-1 text-sm", featured ? "text-background/70" : "text-muted-foreground")}>
          {plan.fee_label}
        </p>
      )}
      {saving && (
        <p className={cn("mt-1 text-xs font-medium", featured ? "text-background/80" : "text-accent")}>{saving}</p>
      )}

      <p className={cn("mt-5 text-sm leading-relaxed", featured ? "text-background/80" : "text-muted-foreground")}>
        {plan.description}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check size={15} className={cn("mt-0.5 shrink-0", featured ? "text-background" : "text-accent")} />
            <span className={featured ? "text-background/90" : ""}>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        variant={featured ? "secondary" : "default"}
        className="mt-8 w-full rounded-full"
      >
        <Link to={plan.cta_href ?? "/orders/get-started"}>{plan.cta_label}</Link>
      </Button>

      {plan.cta_secondary_label && (
        <Button
          asChild
          variant="ghost"
          className={cn("mt-2 w-full rounded-full", featured ? "text-background hover:text-background" : "")}
        >
          <Link to={plan.cta_secondary_href ?? "/contact"}>{plan.cta_secondary_label}</Link>
        </Button>
      )}
    </Reveal>
  );
};

export default PricingTable;
