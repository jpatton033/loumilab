import { admin } from "./auth.ts";
import { escapeHtml, money } from "./notify.ts";
import { sendManagedEmail } from "./managed-email.ts";
import { PACKAGE_LABELS, PROVIDER_LABELS, type EmailPackage, type EmailProvider } from "./emailSetupPricing.ts";

export const TEAM_INBOX = "hello@loumilab.com";
export const SITE = "https://loumilab.com";

export const sha256Hex = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

export const newToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");

export const statusUrl = (token: string, base = SITE) => `${base}/services/business-email/status/${token}`;

// deno-lint-ignore no-explicit-any
export type Req = Record<string, any>;

/** Claims a notification kind for a request once; false if already sent. */
async function claim(requestId: string, kind: string) {
  const { error } = await admin.from("email_setup_notifications").insert({ request_id: requestId, kind });
  if (error) {
    if (error.code !== "23505") console.error("notification claim failed", error.message);
    return false;
  }
  return true;
}

export async function logEvent(requestId: string, kind: string, detail: string | null, visible = false) {
  await admin.from("email_setup_events").insert({ request_id: requestId, kind, detail, visible_to_customer: visible });
}

function frame(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e4e4e7">
  <tr><td style="background:#18181b;padding:22px 28px;color:#fff;font-size:14px;letter-spacing:.14em">LOUMILAB</td></tr>
  <tr><td style="padding:28px;font-size:15px;line-height:1.6"><h1 style="margin:0 0 14px;font-size:20px;font-weight:600">${escapeHtml(title)}</h1>${body}</td></tr>
  <tr><td style="background:#fafafa;padding:18px 28px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7">Business Email &amp; Domain Setup · loumilab.com · hello@loumilab.com</td></tr>
  </table></body></html>`;
}

const p = (t: string) => `<p style="margin:0 0 12px">${t}</p>`;
const btn = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="background:#18181b;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a></p>`;

function lines(r: Req) {
  const rows = ((r.price_lines ?? []) as { label: string; cents: number }[])
    .map((l) => `<tr><td style="padding:4px 0;color:#52525b">${escapeHtml(l.label)}</td><td style="text-align:right">${money(l.cents)}</td></tr>`).join("");
  const total = r.paid_cents ?? r.quote_cents ?? r.total_cents;
  return `<table width="100%" style="font-size:14px;margin:8px 0 16px">${rows}<tr><td style="padding-top:8px;font-weight:600;border-top:1px solid #e4e4e7">Total paid to Loumilab</td><td style="text-align:right;font-weight:600;border-top:1px solid #e4e4e7;padding-top:8px">${money(total)}</td></tr></table>`;
}

const pkg = (r: Req) => PACKAGE_LABELS[r.package as EmailPackage] ?? r.package;
const prov = (r: Req) => PROVIDER_LABELS[r.provider as EmailProvider] ?? r.provider;
const hi = (r: Req) => p(`Hi ${escapeHtml(String(r.full_name).split(" ")[0])},`);

async function send(r: Req, kind: string, to: string, subject: string, html: string) {
  if (!(await claim(r.id, kind))) return;
  const res = await sendManagedEmail({ to, subject, html, label: `email-setup-${kind}`, idempotencyKey: `email-setup-${r.id}-${kind}`, displayName: "Loumilab" });
  if (!res.ok && !res.suppressed) console.error("email setup mail not sent", kind, res.error);
  await logEvent(r.id, "email", `${kind} → ${to === TEAM_INBOX ? "Loumilab" : "customer"}`);
}

const teamSummary = (r: Req, extra = "") =>
  frame(`${r.request_number} · ${r.business_name}`, `${extra}${p(`<b>${escapeHtml(pkg(r))}</b> · ${escapeHtml(prov(r))} · ${r.mailboxes} mailbox(es), ${r.extra_devices} extra device(s)`)}${p(`${escapeHtml(r.full_name)} · ${escapeHtml(r.contact_email)}`)}${btn(`${SITE}/admin/email-setup`, "Open in Admin")}`);

export const Mail = {
  async received(r: Req, token: string) {
    await send(r, "customer_review_received", r.contact_email, `We received your request ${r.request_number}`, frame("We're reviewing your request",
      hi(r) + p(`Thanks for telling us about <b>${escapeHtml(r.business_name)}</b>. Your request needs a quick review before we can give you a price, so no payment has been taken.`) +
      p("We'll email you a quote. Once you approve it, you can pay securely and we'll begin.") + btn(statusUrl(token), "View your request")));
    await send(r, "team_quote_request", TEAM_INBOX, `Quote request ${r.request_number} — ${r.business_name}`,
      teamSummary(r, p(`<b>Review needed:</b> ${escapeHtml((r.review_reasons ?? []).join("; "))}`)));
  },
  async paid(r: Req, token: string | null) {
    const link = token ? btn(statusUrl(token), "View your request") : "";
    await send(r, "customer_paid", r.contact_email, `Payment confirmed — ${r.request_number}`, frame("Payment confirmed",
      hi(r) + p(`Thank you. Your payment for <b>${escapeHtml(pkg(r))}</b> for <b>${escapeHtml(r.business_name)}</b> is confirmed. Request number: <b>${r.request_number}</b>.`) + lines(r) +
      p("<b>What happens next:</b> we'll contact you to schedule the setup. There's no fixed completion time, as setup depends on access to your domain and email provider.") +
      p(`<b>To prepare:</b> have a sign-in ready for your domain registrar (where you bought your domain) and, if you have one, your ${escapeHtml(prov(r))} account. Please never email us passwords or codes — we'll ask you to add us as a helper through the provider's own sharing options.`) +
      p("Domain registration, renewals and email subscriptions are paid to those providers directly.") + link));
    await send(r, "team_paid", TEAM_INBOX, `Paid: ${r.request_number} — ${r.business_name}`, teamSummary(r, p(`<b>Paid ${money(r.paid_cents ?? r.total_cents)}.</b> Ready for setup.`)));
  },
  async paymentProblem(r: Req, what: string) {
    await send(r, `team_payment_${what}_${Date.now()}`, TEAM_INBOX, `Payment ${what}: ${r.request_number}`, teamSummary(r, p(`A checkout ${what}. No payment was recorded.`)));
  },
  async quote(r: Req, token: string) {
    await send(r, `customer_quote_${r.quote_cents}`, r.contact_email, `Your quote — ${r.request_number}`, frame("Your quote is ready",
      hi(r) + p(`We've reviewed your request for <b>${escapeHtml(r.business_name)}</b>. Loumilab's setup price is <b>${money(r.quote_cents)}</b>.`) +
      (r.quote_note ? p(escapeHtml(r.quote_note)) : "") + p("Third-party domain and email subscription fees are separate.") + btn(statusUrl(token), "Review and pay")));
  },
  async started(r: Req) {
    await send(r, "customer_started", r.contact_email, `We've started your setup — ${r.request_number}`, frame("Setup has started",
      hi(r) + p(`We've begun configuring ${escapeHtml(prov(r))} for <b>${escapeHtml(r.business_name)}</b>. We'll reach out if we need anything from you.`)));
  },
  async action(r: Req, message: string) {
    await send(r, `customer_action_${Date.now()}`, r.contact_email, `Action needed — ${r.request_number}`, frame("We need something from you",
      hi(r) + p(escapeHtml(message).replace(/\n/g, "<br>")) + p("Please never send passwords or verification codes by email. Reply to this message or use your request page.")));
  },
  async completed(r: Req) {
    await send(r, "customer_completed", r.contact_email, `Your business email is ready — ${r.request_number}`, frame("Your setup is complete",
      hi(r) + p(`Your business email${r.primary_address ? ` <b>${escapeHtml(r.primary_address)}</b>` : ""} is set up on <b>${escapeHtml(prov(r))}</b>.`) +
      p(`<b>Signing in:</b> use your provider's sign-in page (${escapeHtml(prov(r))}) with the account you created. Keep your multi-factor authentication method safe.`) +
      p("<b>Your accounts:</b> you own your domain and email accounts. Manage users, billing and settings in your provider's admin page.") +
      p("<b>Renewals:</b> your domain and email subscription renew with those providers. Keep a payment method current there so your email keeps working.") +
      p("<b>Support:</b> for 7 days we'll correct any configuration issue caused by our setup. Just reply to this email or write to hello@loumilab.com.")));
  },
  async customerInfo(r: Req) {
    await send(r, `team_info_${Date.now()}`, TEAM_INBOX, `New info from customer: ${r.request_number}`, teamSummary(r, p("The customer added information to their request.")));
  },
};
