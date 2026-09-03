import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { mccForIndustry } from "../_shared/industry-mcc.ts";
import {
  resolvePayoutStatus,
  resolveReturnBase,
  stripe,
  stripeConfigured,
  stripeLivemode,
  stripeMode,
} from "../_shared/stripe.ts";


const BodySchema = z.object({
  action: z.enum(["start", "status", "dashboard_link"]),
  returnUrl: z.string().url().max(500).optional(),
  business: z
    .object({
      business_name: z.string().min(1).max(200),
      contact_email: z.string().email().max(255),
      phone: z.string().max(40).optional(),
      country: z.string().length(2).optional(),
      business_type: z.string().max(80).optional(),
    })
    .optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!stripeConfigured) return json({ error: "Payments are not configured yet." }, 503);

    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, returnUrl, business } = parsed.data;

    // Resolve or create the merchant record for this user.
    let { data: merchant } = await admin
      .from("merchants")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant) {
      if (action !== "start" || !business) return json({ error: "No merchant profile yet." }, 404);
      const insert = await admin
        .from("merchants")
        .insert({
          owner_id: user.id,
          business_name: business.business_name,
          contact_email: business.contact_email,
          phone: business.phone ?? null,
          country: (business.country ?? "US").toUpperCase(),
          business_type: business.business_type ?? null,
        })
        .select("*")
        .single();
      if (insert.error) return json({ error: insert.error.message }, 400);
      merchant = insert.data;
    }

    const origin = req.headers.get("origin") ?? "";
    const base = resolveReturnBase(returnUrl, origin);
    const publicOrigin = (() => {
      try {
        return new URL(base).origin;
      } catch {
        return "https://loumilab.com";
      }
    })();

    /**
     * Everything Loumilab already knows about the business is handed to Stripe,
     * so the merchant is never asked to re-enter details they gave us during
     * store set-up. Only what Stripe must collect first-hand (bank account,
     * owner identity, terms acceptance) is left to them.
     */
    const { data: storefront } = await admin
      .from("merchant_storefronts")
      .select("slug, name, description, location")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    const description = (storefront?.description ?? "").trim();
    const businessProfile: Record<string, unknown> = {
      name: storefront?.name || merchant.business_name,
      mcc: mccForIndustry(merchant.industry_slug),
      url: storefront?.slug ? `${publicOrigin}/orders/store/${storefront.slug}` : `${publicOrigin}/orders`,
      product_description:
        description ||
        `Orders, pickup and delivery for ${storefront?.name || merchant.business_name}.`,
      support_email: merchant.contact_email,
    };
    if (merchant.phone) businessProfile.support_phone = merchant.phone;

    let { data: link } = await admin
      .from("merchant_stripe_accounts")
      .select("*")
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    // Create the connected account on first start.
    if (!link) {
      if (action !== "start") return json({ error: "Payments setup has not been started." }, 404);
      const account = await stripe.accounts.create({
        type: "express",
        country: merchant.country || "US",
        email: merchant.contact_email,
        business_profile: businessProfile,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { merchant_id: merchant.id, loumilab_owner_id: user.id },
      });

      const insert = await admin
        .from("merchant_stripe_accounts")
        .insert({
          merchant_id: merchant.id,
          stripe_account_id: account.id,
          // Stripe's Account object has no `livemode` field — the platform key's
          // mode is what the account was created under.
          livemode: stripeLivemode,
          payout_status: resolvePayoutStatus(account),
        })
        .select("*")
        .single();
      if (insert.error) return json({ error: insert.error.message }, 400);
      link = insert.data;
    }





    /**
     * Always refresh from Stripe so status is authoritative. Whether the stored
     * account belongs to this key's mode is decided by Stripe itself: an account
     * from the other mode simply does not resolve. A stale stored `livemode`
     * flag must never block a merchant on its own.
     */
    let account;
    try {
      account = await stripe.accounts.retrieve(link.stripe_account_id);
    } catch (retrieveErr) {
      const code = (retrieveErr as { code?: string })?.code;
      const notFound =
        code === "resource_missing" ||
        (retrieveErr as { statusCode?: number })?.statusCode === 404;
      if (notFound) {
        return json(
          {
            error:
              `This payments account cannot be found in ${stripeMode} mode. Contact support to reset payments setup.`,
            mode: stripeMode,
          },
          409,
        );
      }
      throw retrieveErr;
    }

    /**
     * Push the store's details onto Stripe whenever business-profile fields are
     * still outstanding, so onboarding opens with them already answered.
     */
    if (!account.details_submitted) {
      const due = [
        ...(account.requirements?.currently_due ?? []),
        ...(account.requirements?.eventually_due ?? []),
      ];
      if (due.some((field) => field.startsWith("business_profile."))) {
        try {
          account = await stripe.accounts.update(link.stripe_account_id, {
            business_profile: businessProfile,
          });
        } catch (prefillErr) {
          // Prefill is a convenience — never block onboarding on it.
          console.error("stripe-connect prefill failed", prefillErr);
        }
      }
    }



    // The account resolved under the current key, so heal a wrong stored mode.
    if (link.livemode !== stripeLivemode) {
      const healed = await admin
        .from("merchant_stripe_accounts")
        .update({ livemode: stripeLivemode })
        .eq("id", link.id)
        .select("*")
        .single();
      if (healed.data) link = healed.data;
    }

    if (action === "dashboard_link") {
      const loginLink = await stripe.accounts.createLoginLink(link.stripe_account_id);
      return json({ url: loginLink.url, mode: stripeMode });
    }

    const status = resolvePayoutStatus(account);

    const { data: synced } = await admin
      .from("merchant_stripe_accounts")
      .update({
        payout_status: status,
        details_submitted: account.details_submitted ?? false,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        requirements_due: account.requirements?.currently_due ?? [],
        requirements_disabled_reason: account.requirements?.disabled_reason ?? null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", link.id)
      .select("*")
      .single();

    if (action === "status") {
      return json({ merchant, account: synced ?? link, mode: stripeMode });
    }

    const accountLink = await stripe.accountLinks.create({
      account: link.stripe_account_id,
      refresh_url: base,
      return_url: base,
      type: "account_onboarding",
      collection_options: { fields: "eventually_due" },
    });

    return json({ merchant, account: synced ?? link, url: accountLink.url, mode: stripeMode });
  } catch (err) {
    console.error("stripe-connect error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";

    /**
     * Platform-side configuration problems (Connect not activated on the
     * platform account, bad key) are not the merchant's fault — never leak raw
     * Stripe copy, and record the reason so admins can see it.
     */
    const type = (err as { type?: string })?.type;
    const isConnectDisabled =
      /signed up for Connect|dashboard\.stripe\.com\/connect|responsibilities of managing losses|platform-profile|platform profile/i.test(
        message,
      );
    const isAuthError = type === "StripeAuthenticationError";

    if (isConnectDisabled || isAuthError) {
      const code = isConnectDisabled ? "connect_not_enabled" : "stripe_key_invalid";
      try {
        await admin.from("audit_logs").insert({
          actor_role: "system",
          action: "payments.config_error",
          target_type: "stripe_connect",
          new_value: { code, mode: stripeMode, message },
        });
      } catch (logErr) {
        console.error("stripe-connect audit log failed", logErr);
      }
      return json(
        {
          code,
          mode: stripeMode,
          error:
            "Payments aren't fully activated yet. Loumilab is finishing payment provider setup — please try again shortly. Nothing is wrong with your account.",
        },
        503,
      );
    }

    return json({ error: message }, 500);
  }
});
