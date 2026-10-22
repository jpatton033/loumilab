import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FEE_PLANS, type FeeTiers, pct, progressiveFee, usd, useFeeSchedule } from "@/lib/orders/feeSchedule";
import { usePublicPlans } from "@/lib/orders/plans";
import { saleBreakdown } from "@/lib/orders/saleExample";

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

/** Plan names/prices as saved in Plans & Fees, so tables match the cards. */
export const useFeePlans = () => {
  const { data: plans = [] } = usePublicPlans();
  return FEE_PLANS.map((f) => {
    const p = plans.find((x) => x.slug === f.slug);
    return {
      slug: f.slug,
      name: p?.name ?? f.name,
      price: p?.monthly_price_cents != null ? `${usd(p.monthly_price_cents)}/month` : f.price,
      monthlyCents: p?.monthly_price_cents ?? 0,
    };
  });
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
    <div className="max-w-3xl border-l-2 border-primary pl-5">
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
  const plans = useFeePlans();
  const labels = bandLabels(tiers);
  return (
    <div>
      {/* Tablet and up: one table */}
      <table className="hidden w-full text-left text-sm sm:table">
        <caption className="sr-only">Loumilab platform fee on each portion of monthly eligible sales, by plan</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-4 font-medium">Monthly eligible sales</th>
            {plans.map((p) => <th key={p.slug} scope="col" className="py-2 pr-4 font-medium">{p.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label} className="border-b border-border/60 last:border-0">
              <th scope="row" className="py-2.5 pr-4 font-medium">{label}</th>
              {plans.map((p) => <td key={p.slug} className="py-2.5 pr-4">{pct(tiers.rates[p.slug][i])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Phones: one short list per plan */}
      <div className="grid gap-4 sm:hidden">
        {plans.map((p) => (
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
  const plans = useFeePlans();
  const r = progressiveFee(tiers, plan, 0, salesCents);
  if (!r) return null;
  const name = plans.find((p) => p.slug === plan)?.name ?? plan;
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
  const plans = useFeePlans();
  const [plan, setPlan] = useState("launch");
  const [sales, setSales] = useState("6000");
  const cents = Math.max(0, Math.round((Number(sales.replace(/[^0-9.]/g, "")) || 0) * 100));
  const fee = progressiveFee(tiers, plan, 0, cents)?.feeCents ?? 0;
  const sub = plans.find((p) => p.slug === plan)?.monthlyCents ?? 0;
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium">Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3">
            {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
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

/** "You make a $100 sale." on the $0 plan; uses live starting rate or today's flat fee. */
export const FeeSaleExample = () => {
  const { tiers } = useLiveFeeSchedule();
  const { data: plans = [] } = usePublicPlans();
  const plan = plans.find((p) => p.slug === "launch");
  const bps = tiers?.rates?.launch?.[0] ?? plan?.platform_fee_bps;
  if (bps == null) return null;
  const sale = 10000;
  const b = saleBreakdown(sale, bps);
  const row = (label: string, v: string, strong = false) => (
    <div className="flex justify-between gap-4"><dt className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</dt><dd className={strong ? "font-semibold" : "font-medium"}>{v}</dd></div>
  );
  return (
    <div className="max-w-md rounded-2xl border border-border bg-card p-5 text-sm">
      <p className="font-semibold">You make a {usd(sale)} sale.</p>
      <dl className="mt-3 space-y-1.5">
        {row(`Loumilab platform fee (${pct(bps)})`, usd(b.loumilab))}
        {row("Estimated Stripe processing (2.9% + $0.30)", usd(b.stripe))}
        {row("Estimated merchant proceeds", usd(b.proceeds), true)}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {plan?.name ?? "Free"} plan, {usd(sale)} merchandise subtotal, no tax, tips, delivery or promotions. Stripe processing is an estimate charged by Stripe, not Loumilab. Proceeds are an estimate, not a guaranteed payout.
      </p>
    </div>
  );
};

/** Section under the homepage pricing cards: simple example plus a plain explainer. */
const ProgressiveFees = () => {
  const { tiers } = useLiveFeeSchedule();
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-start">
      <FeeSaleExample />
      {tiers && (
        <details className="rounded-2xl border border-border bg-card p-5 text-sm">
          <summary className="cursor-pointer font-semibold">How do lower fees work?</summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Each plan has a starting platform fee.</li>
            <li>Lower rates become available as your monthly sales grow.</li>
            <li>Lower rates apply only to additional sales above each threshold.</li>
            <li>Monthly sales totals reset on the 1st of each month.</li>
            <li>It's automatic. You don't need to request anything.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            No Loumilab fee on tips or sales tax. Stripe processing is separate.{" "}
            <Link to="/orders/pricing" className="font-medium text-primary hover:underline">See the full rate table</Link>
          </p>
        </details>
      )}
    </div>
  );
};

export default ProgressiveFees;
