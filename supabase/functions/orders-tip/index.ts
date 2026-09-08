import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin } from "../_shared/auth.ts";
import { resolveReturnBase, stripe, stripeConfigured } from "../_shared/stripe.ts";

/**
 * A tip added by the buyer after the order arrives.
 *
 * The tip is charged as its own payment straight to the merchant's connected
 * account with no Loumilab application fee — the merchant keeps all of it minus
 * Stripe's own processing cost. One tip per order, within 24 hours of payment.
 */

const BodySchema = z.object({
  token: z.string().uuid(),
  amount_cents: z.number().int().min(100).max(50000),
  returnUrl: z.string().url().max(500).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const TIPPABLE = ["ready", "out_for_delivery", "completed"];
const TIP_WINDOW_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) return json({ error: "Payments are not configured yet." }, 503);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const input = parsed.data;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const { data: limited } = await admin.rpc("check_and_increment_rate_limit", {
      _key: `orders_tip:${ip}`,
      _max_count: 20,
      _window_seconds: 3600,
    });
    if (limited === true) return json({ error: "Too many attempts. Please try again later." }, 429);

    const { data: order } = await admin
      .from("orders")
      .select(
        "id, public_token, merchant_id, currency, status, paid_at, tip_cents, tip_paid_at, customer_email, stripe_account_id",
      )
      .eq("public_token", input.token)
      .maybeSingle();

    if (!order) return json({ error: "We couldn't find this order." }, 404);
    if (!order.paid_at) return json({ error: "This order hasn't been paid yet." }, 409);
    if (order.tip_paid_at) return json({ error: "A tip has already been added to this order." }, 409);
    if (!TIPPABLE.includes(order.status)) {
      return json({ error: "You can add a tip once your order is on its way." }, 409);
    }
    if (Date.now() - new Date(order.paid_at).getTime() > TIP_WINDOW_MS) {
      return json({ error: "The window for adding a tip to this order has closed." }, 409);
    }
    if (!order.stripe_account_id) {
      return json({ error: "This business can't receive tips right now." }, 409);
    }

    const base = resolveReturnBase(input.returnUrl, req.headers.get("origin") ?? "");
    const origin = new URL(base).origin;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: order.currency ?? "usd",
              unit_amount: input.amount_cents,
              product_data: { name: "Tip", tax_code: "txcd_00000000" },
              tax_behavior: "exclusive" as const,
            },
          },
        ],
        customer_email: order.customer_email ?? undefined,
        // No application fee: Loumilab never takes a cut of a tip.
        payment_intent_data: {
          metadata: { order_id: order.id, merchant_id: order.merchant_id, kind: "order_tip" },
        },
        metadata: { order_id: order.id, merchant_id: order.merchant_id, kind: "order_tip" },
        success_url: `${origin}/orders/receipt/${order.public_token}?tip=thanks`,
        cancel_url: `${origin}/orders/receipt/${order.public_token}?tip=cancelled`,
      },
      { stripeAccount: order.stripe_account_id },
    );

    await admin
      .from("orders")
      .update({ tip_stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return json({ url: session.url });
  } catch (err) {
    console.error("orders-tip error", err);
    return json({ error: "We couldn't start the tip payment. Please try again." }, 500);
  }
});
