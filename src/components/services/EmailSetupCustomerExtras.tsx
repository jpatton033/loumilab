import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  authorizeEmailSetupPurchase, cancelEmailSetupManagement, MANAGEMENT_PLANS, MANAGEMENT_STATUS_LABELS, PURCHASE_AUTH_ACKS,
  STAGES, startEmailSetupCheckout, startEmailSetupManagement, usd, type ManagementPlan, type ThirdPartyLine,
} from "@/lib/services/emailSetup";

export interface PurchasingStatus {
  purchase_mode: "customer_direct" | "loumilab_purchase";
  third_party_lines: ThirdPartyLine[];
  third_party_budget_cents: number;
  purchase_auth_at: string | null;
  fulfillment_stage: string;
  handoff_customer_actions: string | null;
  renewals: { vendor: string; kind: string; commitment: string | null; renews_on: string | null }[];
  management_plan: ManagementPlan | null;
  management_status: string;
  quote_cents: number | null;
  service_status: string;
}

export function StageTracker({ s }: { s: PurchasingStatus }) {
  const stage = s.service_status === "completed" ? "completed" : s.fulfillment_stage;
  const at = STAGES.findIndex(([k]) => k === stage);
  return (
    <ol className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Setup progress">
      {STAGES.map(([k, label], i) => (
        <li key={k} className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
          i < at ? "border-border text-muted-foreground" : i === at ? "border-accent bg-accent-soft font-medium" : "border-border text-muted-foreground/70")}
          aria-current={i === at ? "step" : undefined}>
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
            i < at ? "bg-foreground text-background" : i === at ? "bg-accent text-accent-foreground" : "bg-secondary")}>
            {i < at ? <Check size={13} /> : i + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

/** Itemized quote + purchase authorization + payment for Loumilab-purchased orders. */
export function PurchaseQuote({ s, token, paid, onDone }: { s: PurchasingStatus; token: string; paid: boolean; onDone: () => void }) {
  const [acks, setAcks] = useState<boolean[]>(PURCHASE_AUTH_ACKS.map(() => false));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (s.purchase_mode !== "loumilab_purchase") return null;
  if (!s.quote_cents) return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-sm">
      <h2 className="font-display text-lg font-semibold">Loumilab will buy your services</h2>
      <p className="mt-2 text-muted-foreground">We're confirming the real domain and email hosting prices. You'll get an itemized quote to review and authorize. Nothing is bought or charged before that.</p>
    </div>
  );
  const service = s.quote_cents - s.third_party_budget_cents;
  const authorized = !!s.purchase_auth_at;
  const go = async () => {
    setBusy(true); setErr(null);
    try {
      if (!authorized) await authorizeEmailSetupPurchase(token, acks.map(() => true as const), s.quote_cents!);
      const { url } = await startEmailSetupCheckout(token);
      window.location.href = url;
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); onDone(); }
  };
  return (
    <div className="mt-6 rounded-3xl border-2 border-accent/40 bg-card p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-lg font-semibold">Your itemized quote</h2>
      <table className="mt-4 w-full text-sm"><tbody>
        <tr><td className="py-1">Loumilab setup <span className="text-muted-foreground">· one-time</span></td><td className="py-1 text-right">{usd(service)}</td></tr>
        {s.third_party_lines.map((l) => (
          <tr key={l.label}><td className="py-1">{l.label}<span className="block text-xs text-muted-foreground">{l.billing} · bought on your behalf</span></td><td className="py-1 text-right align-top">{usd(l.cents)}</td></tr>
        ))}
        <tr><td className="py-1 text-muted-foreground">Taxes</td><td className="py-1 text-right text-muted-foreground">None currently charged</td></tr>
        <tr className="border-t border-border font-semibold"><td className="pt-2">Initial total</td><td className="pt-2 text-right">{usd(s.quote_cents)}</td></tr>
      </tbody></table>
      <p className="mt-3 text-xs text-muted-foreground">
        Provider amounts go to the providers, not to Loumilab. If we spend less, the difference comes back to you. If a price goes up, we ask you before buying.
        Future renewals are billed to you by the providers after handoff.
      </p>
      {!paid && !authorized && (
        <fieldset className="mt-5 space-y-3">
          <legend className="text-sm font-semibold">Purchase authorization</legend>
          {PURCHASE_AUTH_ACKS.map((a, i) => (
            <label key={a} className="flex min-h-11 items-start gap-3 text-sm">
              <Checkbox className="mt-0.5" checked={acks[i]} onCheckedChange={(v) => setAcks((p) => p.map((x, j) => (j === i ? v === true : x)))} />
              <span>{a}{i === 3 && <> (<Link to="/orders/terms" className="underline" target="_blank">Loumilab terms</Link>)</>}</span>
            </label>
          ))}
        </fieldset>
      )}
      {!paid && authorized && <p className="mt-4 text-sm text-muted-foreground">Authorized {new Date(s.purchase_auth_at!).toLocaleString()}.</p>}
      {!paid && s.service_status === "awaiting_payment" && (
        <Button className="mt-5 w-full" size="lg" disabled={busy || (!authorized && !acks.every(Boolean))} onClick={go}>
          {busy ? "Please wait…" : `${authorized ? "Pay" : "Authorize and pay"} ${usd(s.quote_cents)} securely`}
        </Button>
      )}
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
    </div>
  );
}

export function HandoffAndRenewals({ s }: { s: PurchasingStatus }) {
  if (!s.handoff_customer_actions && !s.renewals.length) return null;
  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-sm">
      <h2 className="font-display text-lg font-semibold">Ownership and billing</h2>
      {s.handoff_customer_actions && s.service_status !== "completed" && (
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-accent-soft p-4"><b>Your next steps:</b> {s.handoff_customer_actions}</p>
      )}
      <p className="mt-3 text-muted-foreground">Set your own passwords and recovery options in each provider's sign-in page. Never send them to us.</p>
      {s.renewals.length > 0 && (
        <ul className="mt-3 space-y-1">
          {s.renewals.map((x, i) => (
            <li key={i} className="flex justify-between gap-3 border-b border-border py-1.5">
              <span>{x.kind === "domain" ? "Domain" : "Email hosting"} · {x.vendor}{x.commitment && <span className="block text-xs text-muted-foreground">{x.commitment}</span>}</span>
              <span className="shrink-0 text-muted-foreground">{x.renews_on ? `Renews ${new Date(x.renews_on + "T12:00:00").toLocaleDateString()}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ManagementPlans({ s, token, onDone }: { s: PurchasingStatus; token: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  if (s.service_status !== "completed") return null;
  const live = ["active", "past_due", "canceling"].includes(s.management_status);
  const start = async (plan: ManagementPlan) => {
    setBusy(true); setErr(null);
    try { const { url } = await startEmailSetupManagement(token, plan); window.location.href = url; }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); }
  };
  const cancel = async () => {
    if (!confirm("Cancel management at the end of this billing period? Your domain and email stay yours.")) return;
    setBusy(true); setErr(null);
    try { await cancelEmailSetupManagement(token); onDone(); } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    setBusy(false);
  };
  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-sm">
      <h2 className="font-display text-lg font-semibold">Optional ongoing management</h2>
      <p className="mt-1 text-muted-foreground">Billed monthly by Loumilab, separate from your domain and email hosting fees. Cancel any time without losing your domain or email.</p>
      {live ? (
        <div className="mt-4">
          <p><b>{MANAGEMENT_PLANS[s.management_plan ?? "essential"].label}</b> · {MANAGEMENT_STATUS_LABELS[s.management_status]}</p>
          {s.management_status !== "canceling" && <Button className="mt-3" variant="outline" disabled={busy} onClick={cancel}>Cancel management</Button>}
        </div>
      ) : (<>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["essential", "1 mailbox · monthly DNS and email security checks · domain expiration reminders · 1 support request a month · yearly security review"],
            ["business", "Up to 5 mailboxes · everything in Essential · mailbox and alias changes · MFA help · quarterly reviews · 2 support requests a month · renewal coordination"],
          ] as [ManagementPlan, string][]).map(([k, d]) => (
            <div key={k} className="rounded-2xl border border-border p-4">
              <p className="font-semibold">{MANAGEMENT_PLANS[k].label}</p>
              <p className="mt-1 text-lg font-semibold">{usd(MANAGEMENT_PLANS[k].cents)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="mt-2 text-xs text-muted-foreground">{d}</p>
              <Button className="mt-3 w-full" variant="outline" disabled={busy || !consent} onClick={() => start(k)}>Start {MANAGEMENT_PLANS[k].label.split(" ")[0]}</Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Checks are done by our team by hand on a schedule, not by automated monitoring.</p>
        <label className="mt-3 flex min-h-11 items-start gap-3">
          <Checkbox className="mt-0.5" checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
          <span>I agree to a recurring monthly charge from Loumilab until I cancel.</span>
        </label>
      </>)}
      {err && <p className="mt-3 text-destructive">{err}</p>}
    </div>
  );
}
