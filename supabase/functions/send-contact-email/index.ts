import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const apiKey = Deno.env.get("MAILEROO_API_KEY");
    if (!apiKey) {
      throw new Error("MAILEROO_API_KEY not configured");
    }

    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromAddress = "hello@loumilab.com";

    // 1. Notification to LOUMILAB
    const notificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td><td style="padding: 8px 0;">${company || "Not provided"}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; color: #333;">Message:</h3>
          <p style="margin: 0; white-space: pre-wrap; color: #444;">${message}</p>
        </div>
      </div>
    `;

    // 2. Confirmation to the client
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Thank you, ${name}!</h2>
        <p style="color: #555; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; color: #333;">Your message:</h3>
          <p style="margin: 0; white-space: pre-wrap; color: #444;">${message}</p>
        </div>
        <p style="margin-top: 24px; color: #555;">Best regards,<br><strong>LOUMILAB Team</strong></p>
      </div>
    `;

    const results = await Promise.allSettled([
      sendEmail(apiKey, fromAddress, "hello@loumilab.com", `New inquiry from ${name}`, notificationHtml),
      sendEmail(apiKey, fromAddress, email, "We received your message — LOUMILAB", confirmationHtml),
    ]);

    const errors = results.filter(r => r.status === "rejected");
    if (errors.length > 0) {
      console.error("Some emails failed:", errors);
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length - errors.length, failed: errors.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
