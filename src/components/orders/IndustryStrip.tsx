import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { groupIndustries, useIndustries } from "@/lib/orders/industries";

/**
 * Every supported industry, straight from the database, so adding one is a
 * Super Admin change. Food groups stay first — Orders is food-first.
 */
const IndustryStrip = () => {
  const { data: industries = [], isLoading } = useIndustries();
  if (isLoading || industries.length === 0) return null;

  const groups = groupIndustries(industries);

  return (
    <Reveal className="mt-16 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="font-display text-xl font-semibold">Pick your industry. The app adapts.</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Your storefront, wording and dashboard change to match how your business actually sells — menus and pickup for
            food, quotes and visits for services.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/orders/get-started">Choose your industry</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="mt-3 space-y-1.5">
              {group.items.map((industry) => (
                <li key={industry.slug} className="text-sm">
                  {industry.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
};

export default IndustryStrip;
