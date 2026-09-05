import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { escapeHtml, sendEmail, shell } from "../_shared/notify.ts";

/**
 * Sends the one-time Loumilab Orders welcome email after a merchant registers.
 * Idempotent: the send is recorded on the merchant row so a repeated call is a
 * no-op, and a mail failure never blocks onboarding.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SITE = "https://loumilab.com";

const body = (businessName: string, slug: string | null) => `
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46">
    Welcome to Loumilab Orders. Your merchant account for
    <strong>${escapeHtml(businessName)}</strong> is registered and ready to set up.
  </p>
  ${
    slug
      ? `<div style="margin:0 0 22px;padding:16px 18px;border:1px solid #e4e4e7;border-radius:16px;background:#fafafa">
           <p style="margin:0 0 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#71717a">
             Your store link
           </p>
           <a href="${SITE}/orders/store/${slug}" style="font-size:15px;font-weight:600;color:#18181b;text-decoration:none;word-break:break-all">
             ${escapeHtml(`${SITE}/orders/store/${slug}`)}
           </a>
           <p style="margin:8px 0 0;font-size:12px;color:#71717a">
             Reserved for you and not visible to customers yet.
           </p>
         </div>`
      : ""
  }
  <p style="margin:0 0 10px;font-size:14px;font-weight:600">Your next steps</p>
  <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#3f3f46">
    <li>Finish your store details and add what you sell.</li>
    <li>Connect payments so you can accept orders and receive payouts.</li>
    <li>Preview your storefront, then publish when you're ready.</li>
  </ol>
  <p style="margin:0 0 24px">
    <a href="${SITE}/orders/dashboard"
       style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600">
      Continue setup
    </a>
  </p>
  <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#3f3f46">
    Your dashboard is where you manage what you sell, take orders, set pickup and delivery, and track payouts.
  </p>
  <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#71717a">
    Your storefront stays private until setup is complete and you choose to publish it —
    nothing is visible to customers before then.
  </p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a">
    Need a hand? Reply to this email or reach us at hello@loumilab.com.
  </p>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: merchant, error } = await admin
      .from("merchants")
      .select("id, business_name, contact_email")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!merchant) return json({ error: "No merchant account yet." }, 404);

    const { data: alreadySent } = await admin
      .from("merchant_welcome_emails")
      .select("merchant_id")
      .eq("merchant_id", merchant.id)
      .eq("kind", "welcome")
      .maybeSingle();

    if (alreadySent) return json({ sent: false, reason: "already_sent" });

    const { data: storefront } = await admin
      .from("merchant_storefronts")
      .select("slug")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    const to = merchant.contact_email || user.email || "";
    await sendEmail(
      to,
      "Welcome to Loumilab Orders",
      shell("You're registered", body(merchant.business_name, storefront?.slug ?? null)),
    );

    await admin.from("merchant_welcome_emails").insert({ merchant_id: merchant.id, kind: "welcome" });

    return json({ sent: true });
  } catch (err) {
    console.error("orders-merchant-welcome error", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
