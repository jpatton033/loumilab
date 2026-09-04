import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

const escapeHtml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
) {
  const res = await fetch("https://smtp.maileroo.com/api/v2/emails", {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      // Automatic mail always leaves from the unattended Loumilab address.
      from: { address: from, display_name: "Loumilab" },
      to: { address: to },
      ...(replyTo ? { reply_to: { address: replyTo } } : {}),
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`Maileroo error (${res.status}):`, await res.text());
    throw new Error(`Maileroo API error: ${res.status}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip = req.headers.get("cf-connecting-ip")
      || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
      || "unknown";

    const { data: limited } = await supabaseAdmin.rpc("check_and_increment_rate_limit", {
      _key: `custom_project_email:${ip}`,
      _max_count: RATE_LIMIT_MAX,
      _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (limited === true) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MAILEROO_API_KEY");
    if (!apiKey) throw new Error("MAILEROO_API_KEY not configured");

    const body = await req.json().catch(() => null);
    const leadId = typeof body?.leadId === "string" && UUID_RE.test(body.leadId) ? body.leadId : null;
    if (!leadId) {
      return new Response(JSON.stringify({ error: "Missing or invalid leadId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The DB row is the source of truth — the client cannot smuggle content into the email.
    // Only leads created in the last 5 minutes qualify, so this cannot be used to re-send old leads.
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: lead, error } = await supabaseAdmin
      .from("custom_project_leads")
      .select(
        "business_name, contact_name, email, phone, build_goal, project_description, desired_features, budget_range, launch_timeframe, integrations_required, attachment_paths, created_at",
      )
      .eq("id", leadId)
      .gte("created_at", cutoff)
      .maybeSingle();

    if (error || !lead) {
      return new Response(JSON.stringify({ error: "Recent lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const t = {
      charcoal: "#18181b",
      text: "#1c1c20",
      muted: "#63636e",
      accent: "#0d7ff2",
      border: "#e6e7eb",
      soft: "#f6f7f9",
      bg: "#ffffff",
      font: "Arial, Helvetica, sans-serif",
    };

    const renderShell = ({ preview, heading, body }: { preview: string; heading: string; body: string }) => `
      <!DOCTYPE html>
      <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
      <body style="margin:0;padding:40px 0;background-color:${t.bg};font-family:${t.font};">
        <div style="display:none;font-size:1px;color:${t.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preview)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border-collapse:separate;background-color:${t.bg};border:1px solid ${t.border};border-radius:14px;overflow:hidden;">
              <tr><td style="background-color:${t.charcoal};padding:28px 32px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.24em;font-family:${t.font};">LOUMILAB<span style="color:${t.accent};">.</span></p>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Design. Build. Innovate. Secure.</p>
              </td></tr>
              <tr><td style="padding:36px 32px;">
                <h1 style="margin:0 0 18px;font-size:22px;font-weight:600;color:${t.text};">${heading}</h1>
                ${body}
              </td></tr>
              <tr><td style="padding:20px 32px;background-color:${t.soft};border-top:1px solid ${t.border};text-align:center;">
                <p style="margin:0;font-size:11px;color:${t.muted};letter-spacing:0.04em;">&copy; Loumilab &middot; <a href="https://loumilab.com" style="color:${t.muted};text-decoration:none;">loumilab.com</a></p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;

    const p = `margin:0 0 20px;font-size:15px;line-height:1.6;color:${t.muted};`;
    const detailRow = (label: string, value?: string | null) =>
      value
        ? `<tr><td style="padding:8px 0;font-size:13px;color:${t.muted};width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;color:${t.text};">${escapeHtml(String(value))}</td></tr>`
        : "";
    const panel = (label: string, value?: string | null) =>
      value
        ? `<div style="margin:0 0 16px;padding:18px 20px;background-color:${t.soft};border:1px solid ${t.border};border-radius:12px;">
             <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted};">${label}</p>
             <p style="margin:0;font-size:15px;line-height:1.65;color:${t.text};white-space:pre-wrap;">${escapeHtml(String(value))}</p>
           </div>`
        : "";
    const button = (href: string, label: string) =>
      `<a href="${href}" style="display:inline-block;background-color:${t.charcoal};color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>`;

    const safeEmail = escapeHtml(lead.email as string);
    const safeContact = escapeHtml(lead.contact_name as string);
    const safeBusiness = escapeHtml(lead.business_name as string);
    const attachmentCount = (lead.attachment_paths as string[] | null)?.length ?? 0;

    const notificationHtml = renderShell({
      preview: `Custom project request from ${lead.business_name}`,
      heading: "New custom project request",
      body: `
        <p style="${p}">A business asked Loumilab to build something custom.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          ${detailRow("Business", safeBusiness)}
          ${detailRow("Contact", safeContact)}
          ${detailRow("Email", `<a href="mailto:${safeEmail}" style="color:${t.accent};text-decoration:none;">${safeEmail}</a>`)}
          ${detailRow("Phone", lead.phone as string | null)}
          ${detailRow("Budget", lead.budget_range as string | null)}
          ${detailRow("Timeframe", lead.launch_timeframe as string | null)}
          ${detailRow("Attachments", attachmentCount ? String(attachmentCount) : null)}
        </table>
        ${panel("Wants built", lead.build_goal as string | null)}
        ${panel("Project description", lead.project_description as string | null)}
        ${panel("Desired features", lead.desired_features as string | null)}
        ${panel("Integrations", lead.integrations_required as string | null)}
        ${button("https://loumilab.com/admin/custom-projects", "Open in Super Admin")}
      `,
    });

    const confirmationHtml = renderShell({
      preview: "We received your custom project request",
      heading: `Thanks, ${safeContact}`,
      body: `
        <p style="${p}">Your custom project request reached the Loumilab team. We review every request and will reach out to schedule a discovery conversation.</p>
        ${panel("What you asked for", lead.build_goal as string | null)}
        ${button("https://loumilab.com/orders", "Explore Loumilab Orders")}
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${t.muted};">
          Need to add anything? Reply to this email or write to
          <a href="mailto:hello@loumilab.com" style="color:${t.accent};text-decoration:none;">hello@loumilab.com</a>.
        </p>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${t.text};">Best regards,<br /><strong>The Loumilab Team</strong></p>
      `,
    });

    const fromAddress = "no-reply@loumilab.com";
    const results = await Promise.allSettled([
      sendEmail(
        apiKey,
        fromAddress,
        "hello@loumilab.com",
        `Custom project request — ${safeBusiness}`,
        notificationHtml,
        lead.email as string,
      ),
      sendEmail(
        apiKey,
        fromAddress,
        lead.email as string,
        "We received your custom project request — Loumilab",
        confirmationHtml,
        "hello@loumilab.com",
      ),
    ]);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) console.error("Some emails failed:", failures);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in send-custom-project-lead:", err);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
