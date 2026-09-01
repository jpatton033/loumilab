import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { resolveReturnBase, stripe, stripeConfigured, stripeLivemode } from "../_shared/stripe.ts";
import { ensurePrice, PLAN_STRIPE_COLUMNS, type PlanRow } from "../_shared/plan-prices.ts";

/**
 * Merchant plan subscriptions (Loumilab's own billing, on the platform account).
 *
 * Stripe products and prices are provisioned on demand from `orders_plans` so
 * Super Admins can keep editing pricing in the dashboard.
 */

const BodySchema = z.object({
  action: z.enum(["status", "subscribe", "portal"]),
  plan_slug: z.string().min(1).max(60).optional(),
  interval: z.enum(["month", "year"]).default("month"),
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

    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, plan_slug, interval, returnUrl } = parsed.data;

    const { data: merchant } = await admin
      .from("merchants")
      .select("id, business_name, contact_email, plan_slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant) return json({ error: "No merchant profile yet." }, 404);

    const { data: sub } = await admin
      .from("merchant_subscriptions")
      .select("*")
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (action === "status") return json({ merchant, subscription: sub ?? null });

    const base = resolveReturnBase(returnUrl, req.headers.get("origin") ?? "");
    const origin = new URL(base).origin;

    // A Stripe customer on the platform account represents the merchant.
    let customerId = sub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: merchant.contact_email,
        name: merchant.business_name,
        metadata: { merchant_id: merchant.id, owner_id: user.id },
      });
      customerId = customer.id;
    }

    if (action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/orders/dashboard`,
      });
      return json({ url: portal.url });
    }

    if (!plan_slug) return json({ error: "A plan is required." }, 400);

    const { data: plan } = await admin
      .from("orders_plans")
      .select(PLAN_STRIPE_COLUMNS)
      .eq("slug", plan_slug)
      .maybeSingle();

    if (!plan || !plan.is_active) return json({ error: "That plan is not available." }, 404);
    if (!plan.requires_subscription) return json({ error: "That plan doesn't need a subscription." }, 400);

    const priceId = await ensurePrice(plan as unknown as PlanRow, interval);

    await admin.from("merchant_subscriptions").upsert(
      {
        merchant_id: merchant.id,
        plan_slug: plan.slug,
        interval,
        status: sub?.status ?? "incomplete",
        platform_fee_bps: plan.platform_fee_bps,
        stripe_customer_id: customerId,
        livemode: stripeLivemode,
      },
      { onConflict: "merchant_id" },
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { merchant_id: merchant.id, plan_slug: plan.slug } },
      metadata: { merchant_id: merchant.id, plan_slug: plan.slug, kind: "merchant_subscription", interval },
      success_url: `${origin}/orders/dashboard?subscribed=${plan.slug}`,
      cancel_url: `${origin}/orders/dashboard?billing=cancelled`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("orders-billing error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
