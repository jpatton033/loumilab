import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { formatCents, useQuoteByToken, useRespondToQuote } from "@/lib/orders/storefront";
import { toast } from "sonner";

/** Public estimate: the customer approves or declines from a secret link. */
const QuoteView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuoteByToken(token);
  const respond = useRespondToQuote(token);

  const answer = (approve: boolean) =>
    respond.mutate(approve, {
      onSuccess: (result) => {
        if (approve && result?.invoice_token) {
          toast.success("Estimate approved", { description: "Complete your payment to get started." });
          navigate(`/orders/invoice/${result.invoice_token}`);
          return;
        }
        toast.success(approve ? "Estimate approved" : "Estimate declined");
      },
      onError: (err) =>
        toast.error("We couldn't record that", {
          description: err instanceof Error ? err.message : "Please try again.",
        }),
    });

  const answered = quote && quote.status !== "sent" && quote.status !== "draft";

  return (
    <Layout>
      <SEOHead
        title="Your Estimate — Loumilab Orders"
        description="Review and approve your estimate."
        path={`/orders/quote/${token ?? ""}`}
        noindex
      />

      <section className="pb-32 pt-28 lg:pt-32">
        <div className="section-container max-w-2xl">
          {isLoading ? (
            <p className="text-muted-foreground">Loading your estimate…</p>
          ) : !quote ? (
            <div className="text-center">
              <h1 className="font-hero text-4xl font-semibold tracking-tight">Estimate not found</h1>
              <p className="mt-4 text-muted-foreground">This link is no longer valid.</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {quote.business_name}
              </p>
              <h1 className="mt-4 font-hero text-3xl font-semibold tracking-tight lg:text-4xl">{quote.title}</h1>
              {quote.message && <p className="mt-4 text-muted-foreground">{quote.message}</p>}

              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="divide-y divide-border">
                  {(quote.line_items ?? []).map((item, i) => (
                    <div key={`${item.description}-${i}`} className="flex justify-between gap-4 px-5 py-4 sm:px-6">
                      <span className="text-sm">
                        {item.quantity} × {item.description}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCents(item.quantity * item.unit_price_cents)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-border bg-secondary px-5 py-4 text-sm sm:px-6">
                  <div className="flex justify-between font-display font-semibold">
                    <span>Total</span>
                    <span>{formatCents(quote.subtotal_cents)}</span>
                  </div>
                  {quote.deposit_cents > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Deposit due to book</span>
                      <span>{formatCents(quote.deposit_cents)}</span>
                    </div>
                  )}
                </div>
              </div>

              {answered ? (
                <p className="mt-8 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                  This estimate is {quote.status}.
                </p>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    className="h-12 rounded-full px-6"
                    disabled={respond.isPending}
                    onClick={() => answer(true)}
                  >
                    Approve estimate
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full px-6"
                    disabled={respond.isPending}
                    onClick={() => answer(false)}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default QuoteView;
