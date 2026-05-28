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
    const submissionId = body?.submission_id;

    if (!submissionId || typeof submissionId !== 'string' || !UUID_RE.test(submissionId)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid submission_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the verified record from the DB — this is the source of truth.
    // Prevents using this endpoint as an open email relay: attackers cannot
    // send confirmations to arbitrary addresses without first creating a row
    // (which is itself rate-limited by the trigger to 3/hour/email).
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('contact_submissions')
      .select('name, email, company, message, created_at')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send for very recent submissions (defense in depth — prevents
    // replay-style abuse of old submission IDs).
    const ageMs = Date.now() - new Date(submission.created_at as string).getTime();
    if (ageMs > 5 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: "Submission expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = escapeHtml(submission.name as string);
    const safeEmail = escapeHtml(submission.email as string);
    const safeCompany = submission.company ? escapeHtml(String(submission.company)) : "Not provided";
    const safeMessage = escapeHtml(submission.message as string);

    const fromAddress = "hello@loumilab.com";

    const notificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${safeName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td><td style="padding: 8px 0;">${safeCompany}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; color: #333;">Message:</h3>
          <p style="margin: 0; white-space: pre-wrap; color: #444;">${safeMessage}</p>
        </div>
      </div>
    `;

    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Thank you, ${safeName}!</h2>
        <p style="color: #555; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; color: #333;">Your message:</h3>
          <p style="margin: 0; white-space: pre-wrap; color: #444;">${safeMessage}</p>
        </div>
        <p style="margin-top: 24px; color: #555;">Best regards,<br><strong>LOUMILAB Team</strong></p>
      </div>
    `;

    const results = await Promise.allSettled([
      sendEmail(apiKey, fromAddress, "hello@loumilab.com", `New inquiry from ${safeName}`, notificationHtml),
      sendEmail(apiKey, fromAddress, submission.email as string, "We received your message — LOUMILAB", confirmationHtml),
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
