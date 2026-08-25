import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { formatCents, useOrderByToken } from "@/lib/orders/storefront";

/** Public order receipt, reachable only with the order's secret token. */
const Receipt = () => {
  const { token } = useParams<{ token: string }>();
  const { data: order, isLoading } = useOrderByToken(token);

  const paid = order?.status && !["pending", "failed", "cancelled"].includes(order.status);
  const failed = order?.status === "failed" || order?.status === "cancelled";

  return (
    <Layout>
      <SEOHead
        title="Your Order — Loumilab Orders"
        description="Your order confirmation and receipt."
        path={`/orders/receipt/${token ?? ""}`}
        noindex
      />

      <section className="pb-32 pt-28 lg:pt-32">
        <div className="section-container max-w-2xl">
          {isLoading ? (
            <p className="text-muted-foreground">Loading your order…</p>
          ) : !order ? (
            <div className="text-center">
              <h1 className="font-hero text-4xl font-semibold tracking-tight">Order not found</h1>
              <p className="mt-4 text-muted-foreground">This receipt link is no longer valid.</p>
              <Button asChild className="mt-8 rounded-full">
                <Link to="/orders">Back to Orders</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {paid ? (
                  <CheckCircle2 className="text-accent" size={26} />
                ) : failed ? (
                  <XCircle className="text-destructive" size={26} />
                ) : (
                  <Clock className="text-muted-foreground" size={26} />
                )}
                <h1 className="font-hero text-3xl font-semibold tracking-tight lg:text-4xl">
                  {paid ? "Order confirmed" : failed ? "Payment not completed" : "Confirming payment…"}
                </h1>
              </div>

              <p className="mt-3 text-muted-foreground">
                {order.store_name ?? "Your order"} · {order.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                {order.reference ? ` · ${order.reference}` : ""}
              </p>

              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="divide-y divide-border">
                  {order.items.map((item, i) => (
                    <div key={`${item.name}-${i}`} className="flex justify-between gap-4 px-5 py-4 sm:px-6">
                      <span className="text-sm">
                        {item.quantity} × {item.name}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCents(item.line_total_cents, order.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 border-t border-border bg-secondary px-5 py-4 text-sm sm:px-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCents(order.subtotal_cents, order.currency)}</span>
                  </div>
                  {order.delivery_fee_cents > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>{formatCents(order.delivery_fee_cents, order.currency)}</span>
                    </div>
                  )}
                  {order.tip_cents > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tip</span>
                      <span>{formatCents(order.tip_cents, order.currency)}</span>
                    </div>
                  )}
                  {order.tax_cents > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span>{formatCents(order.tax_cents, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 font-display font-semibold">
                    <span>Total</span>
                    <span>{formatCents(order.total_cents, order.currency)}</span>
                  </div>
                </div>
              </div>

              {order.delivery_address && (
                <p className="mt-6 text-sm text-muted-foreground">Delivering to {order.delivery_address}</p>
              )}

              <p className="mt-6 text-sm text-muted-foreground">
                A copy of this receipt was emailed to {order.customer_email}.
              </p>

              <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link to="/orders">Powered by Loumilab Orders</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Receipt;
