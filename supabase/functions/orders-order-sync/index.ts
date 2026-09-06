import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { stripe, stripeConfigured } from "../_shared/stripe.ts";
import { handleCheckoutCompleted } from "../_shared/order-complete.ts";

/**
 * Reconciles orders that are still awaiting payment by asking Stripe directly
 * about their checkout session. Stripe webhooks can be delayed, misconfigured
 * or dropped; this makes "Awaiting payment" self-healing.
 *
 * Two entry points, both read-only towards Stripe:
 *  - `{ token }` — the receipt page, using the order's secret public token.
 *  - no body — the signed-in merchant, sweeping their own pending orders.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BodySchema = z.object({ token: z.string().uuid().optional() }).default({});

const SELECT = "id, merchant_id, status, stripe_checkout_session_id, public_token";

type PendingOrder = {
  id: string;
  merchant_id: string;
  status: string;
  stripe_checkout_session_id: string | null;
  public_token: string;
};

async function accountFor(merchantId: string): Promise<string | null> {
  const { data } = await admin
    .from("merchant_stripe_accounts")
    .select("stripe_account_id")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  return data?.stripe_account_id ?? null;
}

/** Returns the order's status after checking Stripe. */
async function syncOrder(order: PendingOrder): Promise<string> {
  if (!order.stripe_checkout_session_id) return order.status;
  const account = await accountFor(order.merchant_id);
  if (!account) return order.status;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id, {
      stripeAccount: account,
    });
  } catch (err) {
    console.error("session retrieve failed", err instanceof Error ? err.message : err);
    return order.status;
  }

  if (session.payment_status === "paid") {
    // Metadata is set at checkout; keep the order id authoritative here.
    const payload = {
      ...(session as unknown as Record<string, unknown>),
      metadata: { ...(session.metadata ?? {}), kind: "storefront_order", order_id: order.id },
    };
    await handleCheckoutCompleted(payload, account);
    return "paid";
  }

  if (session.status === "expired") {
    await admin
      .from("orders")
      .update({ status: "cancelled", failure_reason: "Checkout was not completed." })
      .eq("id", order.id)
      .eq("status", "pending");
    return "cancelled";
  }

  return order.status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) return json({ error: "Payments are not configured yet." }, 503);

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw ?? {});
    if (!parsed.success) return json({ error: "Invalid request." }, 400);
    const { token } = parsed.data;

    if (token) {
      const { data: order } = await admin
        .from("orders")
        .select(SELECT)
        .eq("public_token", token)
        .maybeSingle();
      if (!order) return json({ error: "Order not found." }, 404);
      if (order.status !== "pending") return json({ synced: 0, status: order.status });
      const status = await syncOrder(order as PendingOrder);
      return json({ synced: status === "pending" ? 0 : 1, status });
    }

    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: merchant } = await admin
      .from("merchants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!merchant) return json({ synced: 0 });

    const { data: pending } = await admin
      .from("orders")
      .select(SELECT)
      .eq("merchant_id", merchant.id)
      .eq("status", "pending")
      .not("stripe_checkout_session_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    let synced = 0;
    for (const order of (pending ?? []) as PendingOrder[]) {
      const status = await syncOrder(order);
      if (status !== "pending") synced += 1;
    }

    return json({ synced, checked: pending?.length ?? 0 });
  } catch (err) {
    console.error("orders-order-sync error", err);
    return json({ error: "We couldn't check payment status right now." }, 500);
  }
});
