import { ExternalLink } from "lucide-react";
import { ADDITIONAL_PROVIDER_COSTS, usd, type ProviderPrice } from "@/lib/services/emailSetup";

export interface ThirdPartyItem { plan: string; monthly_cents: number; users: number; est_monthly_cents: number; billing: string; monthly_available: boolean; url: string; checked_on?: string }
export interface ThirdPartySnapshot { items: ThirdPartyItem[]; domain: { plan: string; est_yearly_cents: number; billing: string; url: string } | null; note?: string }

/** Prominent notice required wherever Loumilab pricing is shown. */
export const ProviderCostNotice = () => (
  <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4 text-sm leading-relaxed">
    <p className="font-semibold">Additional Provider Costs</p>
    <p className="mt-1">{ADDITIONAL_PROVIDER_COSTS}</p>
  </div>
);

/** Builds the same estimate the server stores, for display before submitting. */
export const buildSnapshot = (prices: ProviderPrice[], provider: string, plan: string | null, users: number, ownsDomain: boolean): ThirdPartySnapshot => {
  const mail = prices.filter((p) => p.provider !== "domain");
  const sameProvider = mail.filter((p) => p.provider === provider);
  const pick = provider === "help" ? mail : sameProvider.filter((p) => !plan || p.key === plan || sameProvider.length === 1);
  const d = prices.find((p) => p.provider === "domain");
  return {
    items: pick.map((p) => ({ plan: p.plan_name, monthly_cents: p.monthly_cents, users, est_monthly_cents: p.monthly_cents * users, billing: p.billing_note, monthly_available: p.monthly_available, url: p.url, checked_on: p.checked_on })),
    domain: !ownsDomain && d ? { plan: d.plan_name, est_yearly_cents: d.monthly_cents * 12, billing: d.billing_note, url: d.url } : null,
  };
};

export const ThirdPartyCosts = ({ snap, title = "Third-party costs (paid to providers, not Loumilab)" }: { snap: ThirdPartySnapshot; title?: string }) => (
  <div className="rounded-2xl border border-border p-4">
    <p className="text-sm font-semibold">{title}</p>
    <ul className="mt-3 space-y-3 text-sm">
      {snap.items.map((i) => (
        <li key={i.plan}>
          <div className="flex justify-between gap-3"><span className="font-medium">{i.plan}</span><span className="shrink-0">≈ {usd(i.est_monthly_cents)}/mo</span></div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {usd(i.monthly_cents)} per user/month × {i.users} user{i.users === 1 ? "" : "s"}. {i.billing} {i.monthly_available ? "Monthly billing available." : "No monthly billing option."}{" "}
            <a href={i.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">Official pricing <ExternalLink size={11} /></a>
          </p>
        </li>
      ))}
      {snap.domain && (
        <li>
          <div className="flex justify-between gap-3"><span className="font-medium">{snap.domain.plan}</span><span className="shrink-0">≈ {usd(snap.domain.est_yearly_cents)}/yr</span></div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{snap.domain.billing} Renews yearly with your registrar.</p>
        </li>
      )}
    </ul>
    <p className="mt-3 text-xs text-muted-foreground">Estimates only. Provider prices may change; check the official pricing pages before you subscribe.</p>
  </div>
);
