import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory rate limiting (per-instance, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch("https://smtp.maileroo.com/v1/email/send", {
    method: "POST",
    headers: {
      "X-Mailing-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("MAILEROO_API_KEY");
    if (!apiKey) {
      throw new Error("MAILEROO_API_KEY not configured");
    }

    const { name, email, company, message } = await req.json();

    // Validate required fields and types
    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format and input lengths
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || name.length > 200 || email.length > 320 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Escape HTML to prevent injection in email templates
    const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = company ? escapeHtml(String(company)) : "Not provided";
    const safeMessage = escapeHtml(message);

    const fromAddress = "hello@loumilab.com";

    // 1. Notification to LOUMILAB
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

    // 2. Confirmation to the client
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
      sendEmail(apiKey, fromAddress, email, "We received your message — LOUMILAB", confirmationHtml),
    ]);

    const errors = results.filter(r => r.status === "rejected");
    if (errors.length > 0) {
      console.error("Some emails failed:", errors);
    }

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
