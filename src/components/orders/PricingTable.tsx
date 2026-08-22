import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/Reveal";
import { pricingPlans } from "@/data/orders/pricing";
import { cn } from "@/lib/utils";

const PricingTable = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    {pricingPlans.map((plan, i) => (
      <Reveal
        key={plan.id}
        delay={i * 90}
        className={cn(
          "flex flex-col rounded-3xl border p-8",
          plan.featured
            ? "border-transparent bg-foreground text-background shadow-[var(--shadow-lift)]"
            : "border-border bg-card shadow-[var(--shadow-soft)]"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em]">{plan.name}</p>
          {plan.featured && (
            <span className="rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold">Most popular</span>
          )}
        </div>

        <p className="mt-6 font-hero text-4xl font-semibold tracking-tight">
          {plan.price}
          {plan.period && (
            <span className={cn("ml-2 text-sm font-medium", plan.featured ? "text-background/70" : "text-muted-foreground")}>
              {plan.period}
            </span>
          )}
        </p>
        {plan.transactionFee && (
          <p className={cn("mt-1 text-sm", plan.featured ? "text-background/70" : "text-muted-foreground")}>
            {plan.transactionFee}
          </p>
        )}

        <p className={cn("mt-5 text-sm leading-relaxed", plan.featured ? "text-background/80" : "text-muted-foreground")}>
          {plan.description}
        </p>

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check size={16} className={cn("mt-0.5 shrink-0", plan.featured ? "text-background" : "text-accent")} />
              <span className={plan.featured ? "text-background/90" : ""}>{f}</span>
            </li>
          ))}
        </ul>

        <Button
          asChild
          size="lg"
          variant={plan.featured ? "secondary" : "default"}
          className="mt-8 w-full rounded-full"
        >
          <Link to={plan.id === "premium" ? "/contact" : "/orders/get-started"}>{plan.cta}</Link>
        </Button>
      </Reveal>
    ))}
  </div>
);

export default PricingTable;
