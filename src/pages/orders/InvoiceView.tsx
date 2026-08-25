import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, startInvoicePayment, useInvoiceByToken } from "@/lib/orders/storefront";
import { toast } from "sonner";

/** Public invoice payment page, reachable only with the invoice's secret token. */
const InvoiceView = () => {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const { data: invoice, isLoading } = useInvoiceByToken(token);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const justPaid = params.get("paid") === "1";
  const paid = invoice?.status === "paid" || justPaid;

  const pay = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const { url } = await startInvoicePayment(token, email.trim() || undefined);
      window.location.href = url;
    } catch (err) {
      toast.error("Payment couldn't start", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setBusy(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Your Invoice — Loumilab Orders"
        description="Review and pay your invoice securely."
        path={`/orders/invoice/${token ?? ""}`}
        noindex
      />

      <section className="pb-32 pt-28 lg:pt-32">
        <div className="section-container max-w-xl">
          {isLoading ? (
            <p className="text-muted-foreground">Loading your invoice…</p>
          ) : !invoice ? (
            <div className="text-center">
              <h1 className="font-hero text-4xl font-semibold tracking-tight">Invoice not found</h1>
              <p className="mt-4 text-muted-foreground">This link is no longer valid.</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {invoice.business_name}
              </p>
              <h1 className="mt-4 font-hero text-3xl font-semibold tracking-tight lg:text-4xl">
                {invoice.kind === "deposit" ? "Deposit" : "Balance"} due
              </h1>
              {invoice.job_title && <p className="mt-3 text-muted-foreground">{invoice.job_title}</p>}

              <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
                <p className="font-hero text-4xl font-semibold tracking-tight">
                  {formatCents(invoice.amount_cents)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tax is calculated at checkout. Payments are processed securely by Stripe.
                </p>

                {paid ? (
                  <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                    <CheckCircle2 size={16} /> Paid — thank you
                  </p>
                ) : invoice.status === "void" ? (
                  <p className="mt-6 text-sm text-muted-foreground">This invoice is no longer payable.</p>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inv-email">Email for the receipt (optional)</Label>
                      <Input
                        id="inv-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                    <Button onClick={pay} disabled={busy} className="h-12 w-full rounded-full">
                      {busy ? <Loader2 className="animate-spin" size={16} /> : "Pay now"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default InvoiceView;
