import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { resolveReturnBase, stripe, stripeConfigured, stripeLivemode } from "../_shared/stripe.ts";
import { loadMerchantContext, PaymentsError, platformFeeCents } from "../_shared/fees.ts";

/**
 * Customer checkout for a Loumilab Orders storefront.
 *
 * Prices, tax and the Loumilab fee are computed here from the database — the
 * browser only sends which products and how many. The charge is created
 * directly on the merchant's connected account with an application fee, so
 * Stripe pays the merchant out automatically.
 */

const BodySchema = z.object({
  slug: z.string().min(1).max(120),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(255),
    phone: z.string().max(40).optional(),
  }),
  fulfilment: z.enum(["pickup", "delivery"]).default("pickup"),
  delivery_address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
  tip_cents: z.number().int().min(0).max(100000).optional(),
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
    const input = parsed.data;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const { data: limited } = await admin.rpc("check_and_increment_rate_limit", {
      _key: `orders_checkout:${ip}`,
      _max_count: 20,
      _window_seconds: 3600,
    });
    if (limited === true) return json({ error: "Too many attempts. Please try again later." }, 429);

    const { data: store } = await admin
      .from("merchant_storefronts")
      .select(
        "id, merchant_id, name, slug, currency, is_published, pickup_enabled, delivery_enabled, delivery_fee_cents, delivery_minimum_cents",
      )
      .eq("slug", input.slug)
      .maybeSingle();

    if (!store || !store.is_published) return json({ error: "This store is not available." }, 404);

    if (input.fulfilment === "pickup" && !store.pickup_enabled) {
      return json({ error: "Pickup isn't available for this store." }, 400);
    }
    if (input.fulfilment === "delivery") {
      if (!store.delivery_enabled) return json({ error: "Delivery isn't available for this store." }, 400);
      if (!input.delivery_address) return json({ error: "A delivery address is required." }, 400);
    }

    const ctx = await loadMerchantContext(store.merchant_id);
    if (!ctx.merchant.accepting_orders) {
      return json({ error: "This store isn't accepting orders right now." }, 409);
    }

    // Re-read every product server-side. Client prices are never trusted.
    const ids = input.items.map((i) => i.product_id);
    const { data: products } = await admin
      .from("merchant_products")
      .select("id, name, description, price_cents, availability, is_active, tax_code, storefront_id")
      .in("id", ids)
      .eq("storefront_id", store.id);

    const lines = input.items.map((item) => {
      const product = (products ?? []).find((p) => p.id === item.product_id);
      if (!product || !product.is_active || product.availability !== "available") {
        throw new PaymentsError("One of the items in your order is no longer available.", 409);
      }
      return {
        product,
        quantity: item.quantity,
        unit_price_cents: product.price_cents,
        line_total_cents: product.price_cents * item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.line_total_cents, 0);
    if (subtotal <= 0) return json({ error: "Your order total must be greater than zero." }, 400);

    const deliveryFee = input.fulfilment === "delivery" ? store.delivery_fee_cents : 0;
    if (input.fulfilment === "delivery" && subtotal < store.delivery_minimum_cents) {
      return json({ error: "Your order is below the delivery minimum for this store." }, 400);
    }

    const tip = input.tip_cents ?? 0;
    // The Loumilab fee applies to merchandise only — never tax, tips or delivery.
    const feeCents = platformFeeCents(subtotal, ctx.feeBps);

    const user = await requireUser(req);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        merchant_id: store.merchant_id,
        storefront_id: store.id,
        customer_user_id: user?.id ?? null,
        customer_name: input.customer.name,
        customer_email: input.customer.email.toLowerCase(),
        customer_phone: input.customer.phone ?? null,
        fulfilment: input.fulfilment,
        delivery_address: input.delivery_address ?? null,
        customer_notes: input.notes ?? null,
        currency: store.currency,
        subtotal_cents: subtotal,
        delivery_fee_cents: deliveryFee,
        tip_cents: tip,
        total_cents: subtotal + deliveryFee + tip,
        platform_fee_cents: feeCents,
        platform_fee_bps: ctx.feeBps,
        stripe_account_id: ctx.account.stripe_account_id,
        livemode: stripeLivemode,
        status: "pending",
      })
      .select("id, public_token")
      .single();

    if (orderError || !order) return json({ error: "We couldn't start your order. Please try again." }, 500);

    await admin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        name: l.product.name,
        unit_price_cents: l.unit_price_cents,
        quantity: l.quantity,
        line_total_cents: l.line_total_cents,
      })),
    );

    const base = resolveReturnBase(input.returnUrl, req.headers.get("origin") ?? "");
    const origin = new URL(base).origin;

    const lineItems = lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: store.currency,
        unit_amount: l.unit_price_cents,
        product_data: {
          name: l.product.name,
          description: l.product.description ?? undefined,
          tax_code: l.product.tax_code,
        },
        tax_behavior: "exclusive" as const,
      },
    }));

    if (deliveryFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: store.currency,
          unit_amount: deliveryFee,
          product_data: { name: "Delivery", description: undefined, tax_code: "txcd_92010001" },
          tax_behavior: "exclusive" as const,
        },
      });
    }

    if (tip > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: store.currency,
          unit_amount: tip,
          product_data: { name: "Tip", description: undefined, tax_code: "txcd_00000000" },
          tax_behavior: "exclusive" as const,
        },
      });
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        customer_email: input.customer.email.toLowerCase(),
        automatic_tax: { enabled: true },
        payment_intent_data: {
          application_fee_amount: feeCents,
          metadata: { order_id: order.id, merchant_id: store.merchant_id },
        },
        metadata: { order_id: order.id, merchant_id: store.merchant_id, kind: "storefront_order" },
        success_url: `${origin}/orders/receipt/${order.public_token}`,
        cancel_url: `${origin}/orders/store/${store.slug}?checkout=cancelled`,
      },
      { stripeAccount: ctx.account.stripe_account_id },
    );

    await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return json({ url: session.url, order_token: order.public_token });
  } catch (err) {
    if (err instanceof PaymentsError) return json({ error: err.message }, err.status);
    console.error("orders-checkout error", err);
    return json({ error: "We couldn't start checkout. Please try again." }, 500);
  }
});
