import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { escapeHtml, sendEmail, shell } from "../_shared/notify.ts";

/**
 * Confirms a merchant's storefront went live. Idempotent per merchant: the send
 * is recorded in merchant_welcome_emails with kind='published', and a mail
 * failure never blocks publishing.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SITE = "https://loumilab.com";

const body = (businessName: string, slug: string) => {
  const url = `${SITE}/orders/store/${slug}`;
  return `
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46">
    <strong>${escapeHtml(businessName)}</strong> is live on Loumilab Orders. Customers can now open your store
    and place orders.
  </p>
  <div style="margin:0 0 22px;padding:16px 18px;border:1px solid #e4e4e7;border-radius:16px;background:#fafafa">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#71717a">
      Your store link
    </p>
    <a href="${url}" style="font-size:15px;font-weight:600;color:#18181b;text-decoration:none;word-break:break-all">
      ${escapeHtml(url)}
    </a>
  </div>
  <p style="margin:0 0 10px;font-size:14px;font-weight:600">Share it anywhere</p>
  <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#3f3f46">
    Put this link in your bio, texts, flyers or a QR code. It stays the same, so it keeps working everywhere you
    share it.
  </p>
  <p style="margin:0 0 24px">
    <a href="${SITE}/orders/dashboard"
       style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600">
      Open your dashboard
    </a>
  </p>
  <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#3f3f46">
    From your dashboard you can manage what you sell, watch orders come in, update pickup and delivery, pause your
    store and check payouts.
  </p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a">
    Questions? Reply to this email or reach us at hello@loumilab.com.
  </p>
`;
};

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

    const { data: storefront } = await admin
      .from("merchant_storefronts")
      .select("slug, status")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (!storefront?.slug) return json({ sent: false, reason: "no_storefront" });
    if (storefront.status !== "published") return json({ sent: false, reason: "not_published" });

    const { data: alreadySent } = await admin
      .from("merchant_welcome_emails")
      .select("merchant_id")
      .eq("merchant_id", merchant.id)
      .eq("kind", "published")
      .maybeSingle();

    if (alreadySent) return json({ sent: false, reason: "already_sent" });

    const to = merchant.contact_email || user.email || "";
    await sendEmail(
      to,
      "Your Loumilab Orders store is live",
      shell("You're live", body(merchant.business_name, storefront.slug)),
    );

    await admin
      .from("merchant_welcome_emails")
      .insert({ merchant_id: merchant.id, kind: "published" });

    return json({ sent: true });
  } catch (err) {
    console.error("orders-store-published error", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
