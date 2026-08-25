import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin } from "../_shared/auth.ts";
import { resolveReturnBase, stripe, stripeConfigured } from "../_shared/stripe.ts";
import { loadMerchantContext, PaymentsError, platformFeeCents } from "../_shared/fees.ts";

/**
 * Pays a merchant invoice from its secret public link. The amount comes from
 * the invoice row, never from the browser, and the Loumilab fee is recomputed
 * from the merchant's effective plan.
 */

const BodySchema = z.object({
  token: z.string().uuid(),
  email: z.string().email().max(255).optional(),
  returnUrl: z.string().url().max(500).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) return json({ error: "Payments are not configured yet." }, 503);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { token, email, returnUrl } = parsed.data;

    const { data: limited } = await admin.rpc("check_and_increment_rate_limit", {
      _key: `invoice_checkout:${token}`,
      _max_count: 15,
      _window_seconds: 3600,
    });
    if (limited === true) return json({ error: "Too many attempts. Please try again later." }, 429);

    const { data: invoice } = await admin
      .from("merchant_invoices")
      .select("id, merchant_id, job_id, kind, status, amount_cents, public_token")
      .eq("public_token", token)
      .maybeSingle();

    if (!invoice) return json({ error: "This invoice could not be found." }, 404);
    if (invoice.status === "paid") return json({ error: "This invoice is already paid." }, 409);
    if (invoice.status === "void") return json({ error: "This invoice is no longer payable." }, 409);
    if (invoice.amount_cents <= 0) return json({ error: "This invoice has no balance due." }, 400);

    const ctx = await loadMerchantContext(invoice.merchant_id);
    const feeCents = platformFeeCents(invoice.amount_cents, ctx.feeBps);

    const { data: job } = invoice.job_id
      ? await admin
          .from("merchant_jobs")
          .select("title, customer_email")
          .eq("id", invoice.job_id)
          .maybeSingle()
      : { data: null };

    const base = resolveReturnBase(returnUrl, req.headers.get("origin") ?? "");
    const origin = new URL(base).origin;
    const label = invoice.kind === "deposit" ? "Deposit" : "Balance";

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: invoice.amount_cents,
              product_data: {
                name: `${label} — ${job?.title ?? ctx.merchant.business_name}`,
                tax_code: "txcd_20030000",
              },
              tax_behavior: "exclusive" as const,
            },
          },
        ],
        customer_email: email?.toLowerCase() ?? job?.customer_email ?? undefined,
        automatic_tax: { enabled: true },
        payment_intent_data: {
          application_fee_amount: feeCents,
          metadata: { invoice_id: invoice.id, merchant_id: invoice.merchant_id },
        },
        metadata: { invoice_id: invoice.id, merchant_id: invoice.merchant_id, kind: "merchant_invoice" },
        success_url: `${origin}/orders/invoice/${invoice.public_token}?paid=1`,
        cancel_url: `${origin}/orders/invoice/${invoice.public_token}`,
      },
      { stripeAccount: ctx.account.stripe_account_id },
    );

    await admin
      .from("merchant_invoices")
      .update({ stripe_checkout_session_id: session.id, platform_fee_cents: feeCents })
      .eq("id", invoice.id);

    return json({ url: session.url });
  } catch (err) {
    if (err instanceof PaymentsError) return json({ error: err.message }, err.status);
    console.error("orders-invoice-checkout error", err);
    return json({ error: "We couldn't start this payment. Please try again." }, 500);
  }
});
