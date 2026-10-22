import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FEE_PLANS, type FeeTiers, pct, progressiveFee, usd, useFeeSchedule } from "@/lib/orders/feeSchedule";
import { usePublicPlans } from "@/lib/orders/plans";

/**
 * Progressive pricing pieces. Every one renders nothing until a fee schedule
 * is live or announced with a start date — no public claims before then.
 */
export const useLiveFeeSchedule = () => {
  const { data } = useFeeSchedule();
  const sched = data?.active ?? data?.upcoming ?? null;
  const startsOn =
    !data?.active && data?.upcoming
      ? new Date(data.upcoming.effective_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
      : null;
  return { tiers: sched?.tiers ?? null, startsOn };
};

/** "First $2,500", "Next $2,500", "Next $5,000", "Above $10,000". */
export const bandLabels = (t: FeeTiers) =>
  [...t.thresholds, null].map((to, i) => {
    const from = i === 0 ? 0 : t.thresholds[i - 1];
    if (to === null) return `Above ${usd(from)}`;
    return i === 0 ? `First ${usd(to)}` : `Next ${usd(to - from)}`;
  });

export const FeeAnnouncement = ({ showLink = true }: { showLink?: boolean }) => {
  const { tiers, startsOn } = useLiveFeeSchedule();
  if (!tiers) return null;
  return (
    <div className="mx-auto max-w-3xl border-l-2 border-primary pl-5">
      <p className="text-sm text-muted-foreground">Built for business. Priced for growth.{startsOn && ` Starting ${startsOn}.`}</p>
      <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">Your business grows. Our fees shrink.</p>
      <p className="mt-2 text-base text-muted-foreground">
        As your monthly sales increase, your Loumilab platform fee automatically decreases on additional sales.
        {showLink && (
          <>
            {" "}
            <Link to="/orders/pricing" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              See how pricing works <ArrowRight size={14} aria-hidden />
            </Link>
          </>
        )}
      </p>
    </div>
  );
};

export const FeeTiersTable = ({ tiers }: { tiers: FeeTiers }) => {
  const labels = bandLabels(tiers);
  return (
    <div>
      {/* Tablet and up: one table */}
      <table className="hidden w-full text-left text-sm sm:table">
        <caption className="sr-only">Loumilab platform fee on each portion of monthly eligible sales, by plan</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-4 font-medium">Monthly eligible sales</th>
            {FEE_PLANS.map((p) => <th key={p.slug} scope="col" className="py-2 pr-4 font-medium">{p.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label} className="border-b border-border/60 last:border-0">
              <th scope="row" className="py-2.5 pr-4 font-medium">{label}</th>
              {FEE_PLANS.map((p) => <td key={p.slug} className="py-2.5 pr-4">{pct(tiers.rates[p.slug][i])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Phones: one short list per plan */}
      <div className="grid gap-4 sm:hidden">
        {FEE_PLANS.map((p) => (
          <div key={p.slug} className="rounded-2xl border border-border p-4">
            <p className="font-semibold">{p.name} <span className="font-normal text-muted-foreground">· {p.price}</span></p>
            <dl className="mt-2 space-y-1 text-sm">
              {labels.map((label, i) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{pct(tiers.rates[p.slug][i])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Worked example computed from the live schedule, never hardcoded. */
export const FeeExample = ({ tiers, plan = "launch", salesCents = 600000 }: { tiers: FeeTiers; plan?: string; salesCents?: number }) => {
  const r = progressiveFee(tiers, plan, 0, salesCents);
  if (!r) return null;
  const name = FEE_PLANS.find((p) => p.slug === plan)?.name ?? plan;
  return (
    <div className="rounded-2xl bg-muted/50 p-5 text-sm">
      <p className="font-medium">Example: a {name} merchant with {usd(salesCents)} in eligible monthly sales pays</p>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {r.slices.map((s, i) => (
          <li key={i}>{pct(s.bps)} on the {i === 0 ? "first" : i === r.slices.length - 1 && i > 0 ? "remaining" : "next"} {usd(s.cents)} = {usd(Math.round((s.cents * s.bps) / 10000))}</li>
        ))}
      </ul>
      <p className="mt-2 font-medium">Total Loumilab platform fees: {usd(r.feeCents)}, excluding Stripe processing fees.</p>
    </div>
  );
};

export const FeeCalculator = ({ tiers }: { tiers: FeeTiers }) => {
  const { data: plans = [] } = usePublicPlans();
  const [plan, setPlan] = useState("launch");
  const [sales, setSales] = useState("6000");
  const cents = Math.max(0, Math.round((Number(sales.replace(/[^0-9.]/g, "")) || 0) * 100));
  const fee = progressiveFee(tiers, plan, 0, cents)?.feeCents ?? 0;
  const sub = plans.find((p) => p.slug === plan)?.monthly_price_cents ?? 0;
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium">Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3">
            {FEE_PLANS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium">Estimated monthly sales ($)</span>
          <input inputMode="decimal" value={sales} onChange={(e) => setSales(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" />
        </label>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" aria-live="polite">
        <div><dt className="text-muted-foreground">Platform fee</dt><dd className="text-lg font-semibold">{usd(fee)}</dd></div>
        <div><dt className="text-muted-foreground">Subscription</dt><dd className="text-lg font-semibold">{usd(sub)}</dd></div>
        <div><dt className="text-muted-foreground">Estimated total</dt><dd className="text-lg font-semibold">{usd(fee + sub)}</dd></div>
        <div><dt className="text-muted-foreground">Overall fee rate</dt><dd className="text-lg font-semibold">{cents > 0 ? `${((fee / cents) * 100).toFixed(2)}%` : "—"}</dd></div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">Estimate only. Excludes Stripe processing fees and sales tax. Actual fees are calculated on each order.</p>
    </div>
  );
};

/** Section under the homepage pricing cards. */
const ProgressiveFees = () => {
  const { tiers } = useLiveFeeSchedule();
  if (!tiers) return null;
  return (
    <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h3 className="text-xl font-semibold">Lower fees as your monthly sales grow</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Each lower rate applies only to the additional sales above that threshold — never retroactively. Thresholds reset each month. No request needed; it's automatic.
      </p>
      <div className="mt-6"><FeeTiersTable tiers={tiers} /></div>
      <div className="mt-6"><FeeExample tiers={tiers} /></div>
      <p className="mt-4 text-sm text-muted-foreground">
        Stripe processing fees are separate. No Loumilab fee on tips or sales tax.{" "}
        <Link to="/orders/pricing" className="font-medium text-primary hover:underline">Try the pricing calculator</Link>
      </p>
    </div>
  );
};

export default ProgressiveFees;
