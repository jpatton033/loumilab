import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildBrandedEmail, sanitizeEmailHtml } from "../_shared/admin-mail-frame.ts";
import { htmlToText, sendManagedEmail } from "../_shared/managed-email.ts";

/**
 * Sends a Loumilab-branded admin email.
 *
 * Staff-only: the caller's JWT is verified and their staff role re-checked in
 * the database. Recipients, body size and attachment total are capped here, so
 * the browser can never widen them. One `admin_email_messages` row is written
 * per recipient with its own delivery status.
 */

const MAX_RECIPIENTS = 500;
const MAX_BODY_CHARS = 200_000;
const MAX_ATTACHMENT_TOTAL = 25 * 1024 * 1024;
const MAX_SUBJECT = 300;
const SIGNED_URL_TTL = 60 * 60 * 24 * 30;
const PACE_MS = 120;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (list: unknown): string[] =>
  Array.isArray(list)
    ? [...new Set(list.map((v) => String(v ?? "").trim().toLowerCase()).filter((v) => EMAIL_RE.test(v)))]
    : [];

interface MerchantFacts {
  contactName: string | null;
  businessName: string | null;
}

const personalise = (html: string, email: string, facts?: MerchantFacts) => {
  const fromEmail = email.split("@")[0].split(/[._-]/)[0];
  const derived = fromEmail ? fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1) : "there";
  const first = facts?.contactName?.trim().split(/\s+/)[0] || derived;
  return html
    .replaceAll("{{first_name}}", first)
    .replaceAll("{{contact_name}}", facts?.contactName?.trim() || first)
    .replaceAll("{{business_name}}", facts?.businessName?.trim() || "your business")
    .replaceAll("{{email}}", email);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimError } = await supabase.auth.getClaims(token);
  if (claimError || !claims?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;
  const userEmail = (claims.claims.email as string | undefined) ?? null;

  const { data: isStaff, error: staffError } = await supabase.rpc("is_staff", { _user_id: userId });
  if (staffError) {
    console.error("Staff check failed", staffError.message);
    return json({ error: "Could not verify permissions" }, 500);
  }
  if (!isStaff) return json({ error: "Forbidden" }, 403);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const to = clean(payload.to);
  const cc = clean(payload.cc);
  const bcc = clean(payload.bcc);
  const subject = String(payload.subject ?? "").trim().slice(0, MAX_SUBJECT);
  const rawBody = String(payload.bodyHtml ?? "");
  const displayName = String(payload.displayName ?? "Loumilab").trim().slice(0, 80) || "Loumilab";
  const templateId = (payload.templateId as string | null) ?? null;
  const draftId = (payload.draftId as string | null) ?? null;
  const includeSignature = payload.includeSignature !== false;

  if (!to.length) return json({ error: "Add at least one valid recipient." }, 400);
  if (to.length + cc.length + bcc.length > MAX_RECIPIENTS)
    return json({ error: `No more than ${MAX_RECIPIENTS} recipients per send.` }, 400);
  if (!subject) return json({ error: "Add a subject." }, 400);
  if (rawBody.length > MAX_BODY_CHARS) return json({ error: "Message is too long." }, 400);
  if (!rawBody.replace(/<[^>]*>/g, "").trim()) return json({ error: "Write a message first." }, 400);

  const rawAttachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const totalBytes = rawAttachments.reduce((sum: number, a: any) => sum + Number(a?.size_bytes ?? 0), 0);
  if (totalBytes > MAX_ATTACHMENT_TOTAL) return json({ error: "Attachments exceed 25 MB in total." }, 400);

  // Signed links for each uploaded file (attachments travel as secure links).
  const attachments: { name: string; url: string; size: number; storage_path: string; content_type: string | null }[] = [];
  for (const a of rawAttachments) {
    const path = String((a as any)?.storage_path ?? "");
    if (!path) continue;
    const { data: signed } = await supabase.storage.from("admin-email").createSignedUrl(path, SIGNED_URL_TTL);
    attachments.push({
      name: String((a as any).file_name ?? "file"),
      url: signed?.signedUrl ?? "",
      size: Number((a as any).size_bytes ?? 0),
      storage_path: path,
      content_type: ((a as any).content_type as string | null) ?? null,
    });
  }

  let signatureHtml = "";
  if (includeSignature) {
    const { data: sig } = await supabase.from("admin_email_signatures").select("body_html").eq("user_id", userId).maybeSingle();
    signatureHtml = sanitizeEmailHtml(sig?.body_html ?? "");
  }

  const safeBody = sanitizeEmailHtml(rawBody);

  // Merge-field facts for recipients that are Loumilab Orders merchants.
  const merchantFacts = new Map<string, MerchantFacts>();
  {
    const { data: merchantRows } = await supabase
      .from("merchants")
      .select("contact_email, contact_name, business_name")
      .in("contact_email", to);
    (merchantRows ?? []).forEach((m: Record<string, unknown>) => {
      const key = String(m.contact_email ?? "").trim().toLowerCase();
      if (key) {
        merchantFacts.set(key, {
          contactName: (m.contact_name as string | null) ?? null,
          businessName: (m.business_name as string | null) ?? null,
        });
      }
    });
  }

  const threadId = crypto.randomUUID();
  const results: { email: string; ok: boolean; error?: string }[] = [];
  let sentCount = 0;

  for (const recipient of to) {
    const facts = merchantFacts.get(recipient);
    const html = buildBrandedEmail({
      bodyHtml: personalise(safeBody, recipient, facts),
      signatureHtml,
      attachments,
    });
    const text = htmlToText(html);

    const result = await sendManagedEmail({
      to: recipient,
      subject: personalise(subject, recipient),
      html,
      text,
      displayName,
      label: "admin-mail",
      idempotencyKey: `${threadId}-${recipient}`,
    });

    const status = result.ok ? "sent" : result.suppressed ? "suppressed" : "failed";
    if (result.ok) sentCount += 1;
    results.push({
      email: recipient,
      ok: result.ok,
      error: result.ok ? undefined : result.suppressed ? "Recipient has unsubscribed or bounced before" : result.error,
    });

    const { data: row, error: insertError } = await supabase
      .from("admin_email_messages")
      .insert({
        direction: "outbound",
        thread_id: threadId,
        to_addresses: [recipient],
        cc_addresses: cc,
        bcc_addresses: bcc,
        subject,
        body_html: html,
        body_text: text,
        display_name: displayName,
        status,
        error_text: result.ok ? null : results[results.length - 1].error ?? null,
        template_id: templateId,
        sent_by: userId,
        sent_by_email: userEmail,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertError) console.error("Could not record message", insertError.message);

    if (row?.id && attachments.length) {
      const { error: attachError } = await supabase.from("admin_email_attachments").insert(
        attachments.map((a) => ({
          message_id: row.id,
          file_name: a.name,
          storage_path: a.storage_path,
          size_bytes: a.size,
          content_type: a.content_type,
        })),
      );
      if (attachError) console.error("Could not record attachments", attachError.message);
    }

    if (to.length > 1) await new Promise((r) => setTimeout(r, PACE_MS));
  }

  if (draftId) {
    const { error: draftError } = await supabase.from("admin_email_messages").delete().eq("id", draftId);
    if (draftError) console.error("Could not clear draft", draftError.message);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: userId,
    actor_email: userEmail,
    actor_role: "admin",
    action: "admin_email.sent",
    target_type: "email",
    target_id: threadId,
    new_value: { subject, recipients: to.length, sent: sentCount, failed: to.length - sentCount },
  });
  if (auditError) console.error("Audit write failed", auditError.message);

  return json({ sent: sentCount, failed: to.length - sentCount, results });
});
