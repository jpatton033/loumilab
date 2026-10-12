import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Emails a published issue of The Dot. to every active subscriber via Resend.
 * Admin-only. Each issue is claimed atomically (emailed_at) so it is sent once.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "The Dot. by Loumilab <newsletter@loumilab.com>";
const SITE = "https://loumilab.com";
const UUID_RE = /^[0-9a-f-]{36}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const paras = (s: string | null) =>
  (s ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#3f3f46">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

// deno-lint-ignore no-explicit-any
const buildHtml = (issue: any, unsubUrl: string) => {
  const url = `${SITE}/the-dot/issue/${issue.slug}`;
  const firstPara = (issue.story_body ?? "").split(/\n{2,}/).slice(0, 2).join("\n\n");
  return `<!doctype html><html><body style="margin:0;background:#f7f7f8;font-family:'Space Grotesk',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:32px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:24px;padding:40px">
<tr><td>
<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#18181b">The Dot<span style="color:#1d6ff2">.</span></p>
<p style="margin:0 0 28px;font-size:13px;color:#71717a">A Loumilab Brief · Issue ${String(issue.issue_number).padStart(3, "0")}${issue.issue_month ? ` · ${esc(issue.issue_month)}` : ""}</p>
${issue.cover_image_url ? `<img src="${esc(issue.cover_image_url)}" alt="" width="520" style="width:100%;border-radius:16px;margin:0 0 24px">` : ""}
<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#18181b">${esc(issue.title)}</h1>
${issue.subtitle ? `<p style="margin:0 0 24px;font-size:18px;line-height:1.5;color:#52525b">${esc(issue.subtitle)}</p>` : ""}
${paras(issue.editors_note)}
${issue.story_title ? `<h2 style="margin:24px 0 12px;font-size:20px;color:#18181b">${esc(issue.story_title)}</h2>` : ""}
${paras(firstPara)}
<p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#1d6ff2;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Read the full issue</a></p>
${issue.closing_thought ? `<p style="margin:24px 0 0;font-style:italic;color:#52525b">${esc(issue.closing_thought)}</p>` : ""}
</td></tr></table>
<p style="max-width:600px;margin:20px auto 0;font-size:12px;line-height:1.6;color:#a1a1aa">You're receiving this because you subscribed to The Dot. at loumilab.com.<br>
Loumilab · hello@loumilab.com · <a href="${unsubUrl}" style="color:#71717a">Unsubscribe</a></p>
</td></tr></table></body></html>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [appRole, superRole] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    admin.from("admin_roles").select("role").eq("user_id", userId).eq("role", "super_admin").maybeSingle(),
  ]);
  if (!appRole.data && !superRole.data) return json({ error: "Forbidden" }, 403);

  let issueId = "";
  try {
    issueId = String((await req.json())?.issue_id ?? "");
  } catch { /* fallthrough */ }
  if (!UUID_RE.test(issueId)) return json({ error: "issue_id is required" }, 400);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) return json({ error: "Email service is not configured" }, 500);

  // Atomic claim: only one caller can move emailed_at from NULL.
  const { data: issue, error: claimIssueErr } = await admin
    .from("dot_issues")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", issueId)
    .eq("status", "published")
    .is("emailed_at", null)
    .select("*")
    .maybeSingle();
  if (claimIssueErr) return json({ error: claimIssueErr.message }, 500);
  if (!issue) return json({ skipped: true, reason: "already_sent_or_not_published" });

  const { data: subs, error: subErr } = await admin
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .in("status", ["subscribed", "active"]);
  if (subErr) {
    await admin.from("dot_issues").update({ emailed_at: null }).eq("id", issueId);
    return json({ error: subErr.message }, 500);
  }

  const subject = `The Dot. ${String(issue.issue_number).padStart(3, "0")} — ${issue.title}`;
  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < (subs ?? []).length; i += 100) {
    const chunk = subs!.slice(i, i + 100).map((s) => {
      const unsub = `${SITE}/the-dot/unsubscribe?token=${s.unsubscribe_token}`;
      return {
        from: FROM,
        to: [s.email],
        reply_to: "hello@loumilab.com",
        subject,
        html: buildHtml(issue, unsub),
        headers: { "List-Unsubscribe": `<${unsub}>` },
      };
    });
    const res = await fetch(`${GATEWAY_URL}/emails/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
    else {
      const body = await res.text();
      console.error(`Resend batch failed [${res.status}]: ${body}`);
      failures.push(`[${res.status}] ${body}`.slice(0, 400));
    }
  }

  if (sent === 0 && failures.length) {
    // Nothing went out: release the claim so a retry is possible.
    await admin.from("dot_issues").update({ emailed_at: null }).eq("id", issueId);
    return json({ error: "Email delivery failed", details: failures[0] }, 502);
  }
  await admin.from("dot_issues").update({ emailed_count: sent }).eq("id", issueId);
  return json({ sent, total: subs?.length ?? 0, failures });
});
