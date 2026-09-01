import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { stripeConfigured, stripeMode } from "../_shared/stripe.ts";
import {
  ensurePlanPrices,
  planLinkStatus,
  PLAN_STRIPE_COLUMNS,
  type PlanRow,
} from "../_shared/plan-prices.ts";

/**
 * Super Admin view of Stripe linkage for Loumilab Orders plans.
 *
 * `status` compares every plan's saved Stripe IDs against the plan row.
 * `link` provisions (or re-creates) the Stripe product and prices for one plan
 * so admins can verify pricing before launch instead of waiting for the first
 * merchant subscription.
 */

const BodySchema = z.object({
  action: z.enum(["status", "link"]),
  plan_id: z.string().uuid().optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) {
      return json(
        {
          error: stripeKeyMalformed
            ? "The saved Stripe secret key is not valid (it must start with sk_ or rk_). Update the payment key, then try linking again."
            : "Payments are not configured yet.",
        },
        503,
      );
    }


    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Only Loumilab staff may provision or inspect platform pricing.
    const { data: isStaff } = await admin.rpc("is_staff", { _user_id: user.id });
    if (!isStaff) return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, plan_id } = parsed.data;

    if (action === "status") {
      const { data: plans, error } = await admin
        .from("orders_plans")
        .select(PLAN_STRIPE_COLUMNS)
        .order("display_order");
      if (error) throw error;

      const statuses = [];
      for (const plan of (plans ?? []) as unknown as PlanRow[]) {
        statuses.push(await planLinkStatus(plan));
      }
      return json({ mode: stripeMode, plans: statuses });
    }

    if (!plan_id) return json({ error: "A plan is required." }, 400);

    const { data: plan, error } = await admin
      .from("orders_plans")
      .select(PLAN_STRIPE_COLUMNS)
      .eq("id", plan_id)
      .maybeSingle();
    if (error) throw error;
    if (!plan) return json({ error: "That plan does not exist." }, 404);

    const row = plan as unknown as PlanRow;
    if (!row.requires_subscription || !row.monthly_price_cents) {
      return json({ error: "This plan has no recurring charge, so there is nothing to link." }, 400);
    }

    const result = await ensurePlanPrices(row);
    const status = await planLinkStatus(row);

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      actor_role: "admin",
      action: "plan.stripe_linked",
      target_type: "orders_plan",
      target_id: row.id,
      new_value: { ...result, mode: stripeMode },
      metadata: { slug: row.slug },
    });

    return json({ mode: stripeMode, plan: status, ...result });
  } catch (err) {
    console.error("orders-plans-stripe error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
