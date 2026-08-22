import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, key: string): Promise<boolean> {
  // Atomic upsert+increment via RPC — prevents TOCTOU race
  const { data, error } = await supabaseAdmin.rpc('check_and_increment_rate_limit', {
    _key: key,
    _max_count: RATE_LIMIT_MAX,
    _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    return false; // fail-open for legitimate traffic
  }
  return data === true; // true => limited
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch("https://smtp.maileroo.com/api/v2/emails", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { address: from },
      to: { address: to },
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Maileroo error (${res.status}):`, text);
    throw new Error(`Maileroo API error: ${res.status}`);
  }

  return res.json();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Use CF-Connecting-IP (verified by Cloudflare) or the rightmost x-forwarded-for
    // value (appended by the last trusted proxy). The leftmost value is client-controlled
    // and can be spoofed to bypass per-IP rate limits.
    const ip = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
      || 'unknown';
    if (await checkRateLimit(supabaseAdmin, `contact_email:${ip}`)) {
      await supabaseAdmin.rpc('cleanup_old_rate_limits').catch(() => {});
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("MAILEROO_API_KEY");
    if (!apiKey) throw new Error("MAILEROO_API_KEY not configured");

    const body = await req.json().catch(() => null);
    const emailInput = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;

    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput) || emailInput.length > 255) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the most recent submission for this email within the last 60s.
    // The DB row is the source of truth — the client cannot smuggle arbitrary
    // content into the email. The per-email rate-limit trigger (3/hour/email)
    // still prevents abuse of this endpoint as a relay.
    const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('contact_submissions')
      .select('name, email, company, message, created_at')
      .ilike('email', emailInput)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Recent submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = escapeHtml(submission.name as string);
    const safeEmail = escapeHtml(submission.email as string);
    const safeCompany = submission.company ? escapeHtml(String(submission.company)) : "Not provided";
    const safeMessage = escapeHtml(submission.message as string);

    const fromAddress = "hello@loumilab.com";

    // --- Shared email design tokens (Loumilab light system) ---
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
    const button = (href: string, label: string) =>
      `<a href="${href}" style="display:inline-block;background-color:${t.charcoal};color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>`;
    const detailRow = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:${t.muted};width:96px;">${label}</td>
        <td style="padding:8px 0;font-size:14px;color:${t.text};">${value}</td>
      </tr>`;
    const messagePanel = (body: string) => `
      <div style="margin:0 0 24px;padding:18px 20px;background-color:${t.soft};border:1px solid ${t.border};border-radius:12px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.muted};">Message</p>
        <p style="margin:0;font-size:15px;line-height:1.65;color:${t.text};white-space:pre-wrap;">${body}</p>
      </div>`;
    const hr = `<hr style="border:none;border-top:1px solid ${t.border};margin:28px 0 0;" />`;

    const notificationHtml = renderShell({
      preview: `New project inquiry from ${submission.name}`,
      heading: "New project inquiry",
      body: `
        <p style="${p}">A new message came in through the Loumilab contact form.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          ${detailRow("Name", safeName)}
          ${detailRow("Email", `<a href="mailto:${safeEmail}" style="color:${t.accent};text-decoration:none;">${safeEmail}</a>`)}
          ${detailRow("Company", safeCompany)}
        </table>
        ${messagePanel(safeMessage)}
        ${button(`mailto:${safeEmail}`, `Reply to ${safeName}`)}
      `,
    });

    const confirmationHtml = renderShell({
      preview: "We received your message — Loumilab will reply within 24 hours",
      heading: `Thanks, ${safeName}`,
      body: `
        <p style="${p}">Your message reached the Loumilab team. We read every inquiry and will get back to you within 24 hours.</p>
        ${messagePanel(safeMessage)}
        ${button("https://loumilab.com", "Visit Loumilab")}
        ${hr}
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${t.muted};">
          Need to add something? Just reply to this email or write to
          <a href="mailto:hello@loumilab.com" style="color:${t.accent};text-decoration:none;">hello@loumilab.com</a>.
        </p>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${t.text};">Best regards,<br /><strong>The Loumilab Team</strong></p>
      `,
    });

    const results = await Promise.allSettled([
      sendEmail(apiKey, fromAddress, "hello@loumilab.com", `New inquiry from ${safeName}`, notificationHtml),
      sendEmail(apiKey, fromAddress, submission.email as string, "We received your message — Loumilab", confirmationHtml),
    ]);


    const errors = results.filter(r => r.status === "rejected");
    if (errors.length > 0) console.error("Some emails failed:", errors);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
