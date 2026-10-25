import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/tracking";
import {
  addEmailSetupInfo, PACKAGE_LABELS, PROVIDER_LABELS, SERVICE_STATUS_LABELS, startEmailSetupCheckout, usd,
  type EmailPackage, type EmailProvider,
} from "@/lib/services/emailSetup";

interface Status {
  request_number: string; package: EmailPackage; business_name: string; first_name: string; provider: EmailProvider;
  primary_address: string | null; needs_review: boolean; price_lines: { label: string; cents: number }[]; total_cents: number;
  quote_cents: number | null; quote_note: string | null; service_status: string; payment_status: string;
  customer_action_message: string | null; updates: { kind: string; detail: string; at: string }[];
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
    refetchInterval: (query) => (params.get("paid") && (query.state.data as Status | null)?.payment_status !== "paid" ? 3000 : false),
  });
  const s = q.data;

  useEffect(() => {
    if (s?.payment_status !== "paid") return;
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

  const amount = s ? (s.needs_review ? s.quote_cents : s.total_cents) : null;
  const canPay = s && s.payment_status !== "paid" && s.service_status === "awaiting_payment" && amount;

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
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">Payment: {s.payment_status === "paid" ? "Paid" : "Not paid"}</span>
              </div>
              {s.service_status === "awaiting_quote" && <p className="mt-3 text-sm text-muted-foreground">We're reviewing your request and will email a quote. No payment has been taken.</p>}
              {s.service_status === "awaiting_customer" && s.customer_action_message && (
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-accent-soft p-4 text-sm"><b>We need:</b> {s.customer_action_message}</p>
              )}
              {s.service_status === "paid_awaiting_setup" && <p className="mt-3 text-sm text-muted-foreground">Thanks — we'll contact you to schedule setup. Have your domain registrar sign-in ready. Never send us passwords.</p>}

              <table className="mt-5 w-full text-sm"><tbody>
                {s.needs_review ? (
                  s.quote_cents ? <tr className="font-semibold"><td>Quoted setup price</td><td className="text-right">{usd(s.quote_cents)}</td></tr>
                    : <tr><td className="text-muted-foreground">Price</td><td className="text-right text-muted-foreground">Awaiting quote</td></tr>
                ) : (<>
                  {s.price_lines.map((l) => <tr key={l.label}><td className="py-1">{l.label}</td><td className="py-1 text-right">{usd(l.cents)}</td></tr>)}
                  <tr className="border-t border-border font-semibold"><td className="pt-2">Total</td><td className="pt-2 text-right">{usd(s.total_cents)}</td></tr>
                </>)}
              </tbody></table>
              {s.quote_note && <p className="mt-3 text-sm text-muted-foreground">{s.quote_note}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Domain and email subscription fees are paid separately to your providers.</p>
              {canPay && <Button className="mt-5 w-full" size="lg" disabled={busy} onClick={pay}>{busy ? "Please wait…" : `Pay ${usd(amount!)} securely`}</Button>}
              {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            </div>

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
