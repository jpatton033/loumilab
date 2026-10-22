import { useState } from "react";
import { FEE_PLANS, pct, progressiveFee, tierLabels, usd, useFeeSchedule } from "@/lib/orders/feeSchedule";

/**
 * Progressive fee announcement, tier table and calculator for the Orders
 * pricing section. Renders nothing until a schedule is live or announced.
 */
const ProgressiveFees = () => {
  const { data } = useFeeSchedule();
  const sched = data?.active ?? data?.upcoming ?? null;
  const [plan, setPlan] = useState<string>("launch");
  const [sales, setSales] = useState("6000");
  if (!sched) return null;
  const tiers = sched.tiers;
  const labels = tierLabels(tiers);
  const upcoming = !data?.active && data?.upcoming;
  const cents = Math.max(0, Math.round((Number(sales.replace(/[^0-9.]/g, "")) || 0) * 100));
  const result = progressiveFee(tiers, plan, 0, cents);
  const fee = result?.feeCents ?? 0;

  return (
    <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-primary">Built for business. Priced for growth.</p>
      <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">Your business grows. Our fees shrink.</h3>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        As your monthly sales grow, your Loumilab platform fee automatically decreases on additional sales.
        {upcoming && ` Starting ${new Date(upcoming.effective_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })}.`}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <caption className="sr-only">Loumilab platform fee by monthly eligible sales and plan</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">Monthly sales</th>
              {FEE_PLANS.map((p) => (
                <th key={p.slug} scope="col" className="py-2 pr-4 font-medium">{p.name} <span className="font-normal">({p.price})</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label} className="border-b border-border/60 last:border-0">
                <th scope="row" className="py-2 pr-4 font-medium">{label}</th>
                {FEE_PLANS.map((p) => (
                  <td key={p.slug} className="py-2 pr-4">{tiers.rates[p.slug] ? pct(tiers.rates[p.slug][i]) : "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Each lower rate applies only to the sales above that threshold, not to the whole month. Resets on the 1st of each month (Eastern). Tax and tips are never charged a Loumilab fee.
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <label className="text-sm">
          <span className="block font-medium">Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3">
            {FEE_PLANS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium">Monthly sales ($)</span>
          <input inputMode="decimal" value={sales} onChange={(e) => setSales(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" />
        </label>
        <div className="text-sm" aria-live="polite">
          <span className="block text-muted-foreground">Loumilab fee</span>
          <span className="text-xl font-semibold">{usd(fee)}</span>
          {cents > 0 && <span className="ml-2 text-muted-foreground">≈ {(fee / cents * 100).toFixed(2)}% overall</span>}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Stripe card processing fees are charged separately by Stripe and are not included.</p>
    </div>
  );
};

export default ProgressiveFees;
