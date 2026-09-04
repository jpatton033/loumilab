const API_KEY = Deno.env.get("MAILEROO_API_KEY") ?? "";
const FROM = "no-reply@loumilab.com";

const escapeHtml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const money = (cents: number, currency = "usd") =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });

/** Branded Loumilab email shell — charcoal header, light footer. */
export function shell(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e4e7">
    <tr><td style="background:#18181b;padding:22px 28px;color:#ffffff;font-size:14px;letter-spacing:.14em;text-transform:uppercase">LOUMILAB ORDERS</td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:600">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="background:#fafafa;padding:18px 28px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7">
      Payments securely powered by Stripe · loumilab.com
    </td></tr>
  </table></body></html>`;
}

/** Best-effort send: a failed notification must never fail a payment webhook. */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!API_KEY || !to) return;
  try {
    const res = await fetch("https://smtp.maileroo.com/api/v2/emails", {
      method: "POST",
      headers: { "X-Api-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: FROM, display_name: "Loumilab" },
        to: { address: to },
        reply_to: { address: "hello@loumilab.com" },
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("Maileroo error", res.status, await res.text());
  } catch (err) {
    console.error("Maileroo send failed", err instanceof Error ? err.message : err);
  }
}

export const row = (label: string, value: string, bold = false) =>
  `<tr><td style="padding:6px 0;color:#71717a;font-size:14px">${escapeHtml(label)}</td>
   <td style="padding:6px 0;text-align:right;font-size:14px;${bold ? "font-weight:600" : ""}">${escapeHtml(value)}</td></tr>`;

export { escapeHtml };
