import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/tracking";
import { HandoffAndRenewals, ManagementPlans, PurchaseQuote, StageTracker, type PurchasingStatus } from "@/components/services/EmailSetupCustomerExtras";
import { ThirdPartyCosts, type ThirdPartySnapshot } from "@/components/services/ProviderCosts";
import {
  computeBalance, decideEmailSetupChange, payEmailSetupBalance, type ChangeStatus,
  addEmailSetupInfo, PAYMENT_STATUS_LABELS, PACKAGE_LABELS, PROVIDER_LABELS, SERVICE_STATUS_LABELS, startEmailSetupCheckout, usd,
  type EmailPackage, type EmailProvider,
} from "@/lib/services/emailSetup";

interface Status extends Omit<PurchasingStatus, "quote_cents" | "service_status"> {
  request_number: string; package: EmailPackage; business_name: string; first_name: string; provider: EmailProvider;
  primary_address: string | null; needs_review: boolean; price_lines: { label: string; cents: number }[]; total_cents: number;
  quote_cents: number | null; quote_note: string | null; service_status: string; payment_status: string;
  customer_action_message: string | null; third_party: ThirdPartySnapshot | null;
  payments: { kind: "charge" | "refund"; amount_cents: number; at: string }[];
  change_sets: { id: string; status: ChangeStatus; customer_reason: string; package_from: EmailPackage; package_to: EmailPackage;
    total_before_cents: number; total_after_cents: number; paid_before_cents: number; amount_due_cents: number; credit_cents: number;
    created_at: string; lines: { label: string; quantity: number; unit_cents: number; amount_cents: number; note: string | null }[] }[];
  updates: { kind: string; detail: string; at: string }[];
}

const BusinessEmailStatus = () => {
  const { token = "" } = useParams();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["email-setup-status", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("email_setup_status", { _token: token });
      if (error) throw error;
      return data as unknown as Status | null;
    },
    // Poll briefly after returning from Stripe until the webhook confirms payment.
    refetchInterval: (query) => {
      const d = query.state.data as Status | null | undefined;
      const waiting = d && (d.payments.length === 0 || d.change_sets.some((c) => c.status === "approved"));
      return params.get("paid") && waiting ? 3000 : false;
    },
  });
  const s = q.data;

  useEffect(() => {
    if (!s || s.payments.length === 0) return;
    const key = `loumilab.emailSetup.purchased.${s.request_number}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    track("Purchase", { value: (s.quote_cents ?? s.total_cents) / 100, currency: "USD", content_name: "Business Email Setup" });
  }, [s]);

  const pay = async () => {
    setBusy(true); setErr(null);
    try { const { url } = await startEmailSetupCheckout(token); window.location.href = url; }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); }
  };
  const send = async () => {
    setBusy(true); setErr(null);
    try { await addEmailSetupInfo(token, msg); setSent(true); setMsg(""); q.refetch(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    setBusy(false);
  };

  const bal = s ? computeBalance(s, [...s.change_sets].reverse(), s.payments) : null;
  const openChange = s?.change_sets.find((c) => c.status === "proposed" || c.status === "approved") ?? null;
  const amount = s ? (s.needs_review ? s.quote_cents : s.total_cents) : null;
  const purchasing = s?.purchase_mode === "loumilab_purchase";
  const canPay = s && !purchasing && bal && bal.chargedCents === 0 && !openChange && s.service_status === "awaiting_payment" && amount;

  const decide = async (approve: boolean) => {
    if (!openChange) return;
    setBusy(true); setErr(null);
    try {
      const res = await decideEmailSetupChange(token, openChange.id, approve);
      if (approve && (res.due ?? 0) > 0) { const { url } = await payEmailSetupBalance(token, openChange.id); window.location.href = url; return; }
      await q.refetch();
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    setBusy(false);
  };
  const payChange = async () => {
    if (!openChange) return;
    setBusy(true); setErr(null);
    try { const { url } = await payEmailSetupBalance(token, openChange.id); window.location.href = url; }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); }
  };

  return (
    <Layout>
      <SEOHead title="Your request | Loumilab" description="Business email setup request status." path="/services/business-email/status" noindex />
      <section className="section-padding">
        <div className="section-container max-w-2xl">
          {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!q.isLoading && !s && <p className="text-muted-foreground">We couldn't find this request. Check the link in your email or contact hello@loumilab.com.</p>}
          {s && (<>
            <p className="text-sm text-muted-foreground">Request {s.request_number}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">Hi {s.first_name}, here's your setup.</h1>
            <p className="mt-2 text-muted-foreground">{PACKAGE_LABELS[s.package]} · {PROVIDER_LABELS[s.provider]} · {s.business_name}</p>

            {params.get("paid") && s.payment_status !== "paid" && <p className="mt-6 rounded-2xl bg-accent-soft p-4 text-sm">We're confirming your payment with Stripe. This usually takes a few seconds.</p>}
            {params.get("canceled") && s.payment_status !== "paid" && <p className="mt-6 rounded-2xl bg-surface-subtle p-4 text-sm">Checkout was canceled. No payment was taken.</p>}

            <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-lg font-semibold">{SERVICE_STATUS_LABELS[s.service_status]}</span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">Payment: {PAYMENT_STATUS_LABELS[s.payment_status] ?? s.payment_status}</span>
              </div>
              {s.service_status === "awaiting_quote" && <p className="mt-3 text-sm text-muted-foreground">We're reviewing your request and will email a quote. No payment has been taken.</p>}
              {s.service_status === "awaiting_customer" && s.customer_action_message && (
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-accent-soft p-4 text-sm"><b>We need:</b> {s.customer_action_message}</p>
              )}
              {s.service_status === "ready_for_setup" && <p className="mt-3 text-sm text-muted-foreground">Thanks — we'll contact you to schedule setup. Have your domain registrar sign-in ready. Never send us passwords.</p>}

              <table className="mt-5 w-full text-sm"><tbody>
                {s.needs_review ? (
                  s.quote_cents ? <tr className="font-semibold"><td>{purchasing ? "Initial total (itemized below)" : "Quoted setup price"}</td><td className="text-right">{usd(s.quote_cents)}</td></tr>
                    : <tr><td className="text-muted-foreground">Price</td><td className="text-right text-muted-foreground">Awaiting quote</td></tr>
                ) : (<>
                  {s.price_lines.map((l) => <tr key={l.label}><td className="py-1">{l.label}</td><td className="py-1 text-right">{usd(l.cents)}</td></tr>)}
                  <tr className="border-t border-border font-semibold"><td className="pt-2">Total</td><td className="pt-2 text-right">{usd(s.total_cents)}</td></tr>
                </>)}
              </tbody></table>
              {s.quote_note && <p className="mt-3 text-sm text-muted-foreground">{s.quote_note}</p>}
              <p className="mt-3 text-xs text-muted-foreground">{purchasing ? "Loumilab buys your first domain and email hosting term for you. Renewals are billed to you by the providers after handoff." : "Domain and email subscription fees are paid separately to your providers."}</p>
              {canPay && <Button className="mt-5 w-full" size="lg" disabled={busy} onClick={pay}>{busy ? "Please wait…" : `Pay ${usd(amount!)} securely`}</Button>}
              {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            </div>

            <StageTracker s={s} />
            <PurchaseQuote s={s} token={token} paid={!!bal && bal.chargedCents > 0} onDone={() => q.refetch()} />

            {openChange && (
              <div className="mt-6 rounded-3xl border-2 border-accent/40 bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-display text-lg font-semibold">{openChange.status === "proposed" ? "Please review a change to your order" : "Approved — payment needed"}</h2>
                <p className="mt-2 text-sm"><b>Why:</b> {openChange.customer_reason}</p>
                <p className="mt-2 text-sm text-muted-foreground">Original: {PACKAGE_LABELS[openChange.package_from]} · {usd(openChange.total_before_cents)}</p>
                <table className="mt-4 w-full text-sm"><tbody>
                  {openChange.lines.map((l, i) => (
                    <tr key={i}><td className="py-1">{l.label}{l.quantity > 1 ? ` × ${l.quantity}` : ""}{l.note && <span className="block text-xs text-muted-foreground">{l.note}</span>}</td><td className="py-1 text-right align-top">{usd(l.amount_cents)}</td></tr>
                  ))}
                  <tr className="border-t border-border"><td className="pt-2">Revised total</td><td className="pt-2 text-right">{usd(openChange.total_after_cents)}</td></tr>
                  <tr><td>Already paid</td><td className="text-right">{usd(openChange.paid_before_cents)}</td></tr>
                  <tr className="font-semibold"><td>{openChange.amount_due_cents > 0 ? "Balance due to Loumilab" : "Credit to you"}</td><td className="text-right">{usd(openChange.amount_due_cents > 0 ? openChange.amount_due_cents : openChange.credit_cents)}</td></tr>
                </tbody></table>
                <p className="mt-3 text-xs text-muted-foreground">{purchasing ? "Any provider-cost line above is passed through to the provider, not kept by Loumilab." : "Third-party domain and email subscription costs stay separate and aren't part of this amount."}</p>
                {openChange.status === "proposed" ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button disabled={busy} onClick={() => decide(true)}>{openChange.amount_due_cents > 0 ? `Approve and pay ${usd(openChange.amount_due_cents)}` : "Approve changes"}</Button>
                    <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Decline</Button>
                  </div>
                ) : (
                  <Button className="mt-5" disabled={busy} onClick={payChange}>{busy ? "Please wait…" : `Pay ${usd(openChange.amount_due_cents)} securely`}</Button>
                )}
              </div>
            )}

            {bal && bal.chargedCents > 0 && (
              <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-sm">
                <h2 className="font-display text-lg font-semibold">Your payments to Loumilab</h2>
                <dl className="mt-3 space-y-1">
                  <div className="flex justify-between"><dt>Original order</dt><dd>{usd(bal.originalCents)}</dd></div>
                  {bal.adjustmentsCents !== 0 && <div className="flex justify-between"><dt>Approved changes</dt><dd>{usd(bal.adjustmentsCents)}</dd></div>}
                  <div className="flex justify-between font-semibold"><dt>Current total</dt><dd>{usd(bal.totalCents)}</dd></div>
                  <div className="flex justify-between"><dt>Paid</dt><dd>{usd(bal.chargedCents)}</dd></div>
                  {bal.refundedCents > 0 && <div className="flex justify-between"><dt>Refunded</dt><dd>−{usd(bal.refundedCents)}</dd></div>}
                  <div className="flex justify-between"><dt>{bal.balanceCents >= 0 ? "Balance due" : "Credit"}</dt><dd>{usd(Math.abs(bal.balanceCents))}</dd></div>
                </dl>
              </div>
            )}

            <HandoffAndRenewals s={s} />
            <ManagementPlans s={s} token={token} onDone={() => q.refetch()} />

            {s.third_party && !purchasing && <div className="mt-6"><ThirdPartyCosts snap={s.third_party} title="Provider costs you pay separately (estimates shown when you ordered)" /></div>}

            {s.service_status !== "completed" && s.service_status !== "canceled" && (
              <div className="mt-6 rounded-3xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold">Add information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Share details we asked for. Please don't include passwords or codes.</p>
                <Textarea className="mt-3" rows={3} maxLength={3000} value={msg} onChange={(e) => setMsg(e.target.value)} />
                <Button className="mt-3" variant="outline" disabled={busy || msg.trim().length < 2} onClick={send}>Send</Button>
                {sent && <p className="mt-2 text-sm text-muted-foreground">Sent. We'll take a look.</p>}
              </div>
            )}

            {s.updates.length > 0 && (
              <div className="mt-6">
                <h2 className="font-display text-lg font-semibold">Updates</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {s.updates.map((u, i) => (
                    <li key={i} className="flex justify-between gap-4 border-b border-border py-2">
                      <span className="line-clamp-2">{u.kind === "customer_info" ? "You added information" : u.detail}</span>
                      <span className="shrink-0 text-muted-foreground">{new Date(u.at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-8 text-xs text-muted-foreground">Keep this page's link private — it's how you reach your request. Questions: hello@loumilab.com</p>
          </>)}
        </div>
      </section>
    </Layout>
  );
};

export default BusinessEmailStatus;
