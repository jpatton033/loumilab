import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "../_shared/auth.ts";
import { escapeHtml, sendEmail, shell } from "../_shared/notify.ts";

/** Emails the Loumilab support inbox when a merchant opens a help request. */
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await requireUser(req);
  if (!user) return json({ error: "Sign in required" }, 401);
  const { ticketId } = await req.json().catch(() => ({}));
  if (typeof ticketId !== "string" || !/^[0-9a-f-]{36}$/i.test(ticketId)) return json({ error: "Bad ticket" }, 400);

  const { data: t } = await admin
    .from("support_tickets")
    .select("id, topic, subject, opened_by, merchants(business_name)")
    .eq("id", ticketId)
    .maybeSingle();
  if (!t || t.opened_by !== user.id) return json({ error: "Not found" }, 404);

  const name = (t as { merchants?: { business_name?: string } }).merchants?.business_name ?? "A merchant";
  await sendEmail(
    "hello@loumilab.com",
    `Help request: ${t.subject}`,
    shell(
      "New merchant help request",
      `<p style="font-size:15px;line-height:1.6">${escapeHtml(name)} asked for help with <strong>${escapeHtml(t.topic)}</strong>: ${escapeHtml(t.subject)}</p>
       <p><a href="https://loumilab.com/admin/support/${t.id}">Open in Help Desk</a></p>`,
    ),
    `support-ticket-${t.id}`,
  );
  return json({ ok: true });
});
