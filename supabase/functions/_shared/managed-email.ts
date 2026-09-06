import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.1.0";

/**
 * Single outbound path for every Loumilab app email.
 *
 * All mail leaves from the one verified, signed sending domain so inbox
 * providers see a consistent, authenticated sender instead of two different
 * addresses on two different services.
 */
export const SENDER_DOMAIN = "notify.loumilab.com";
export const FROM_DOMAIN = "notify.loumilab.com";
export const REPLY_TO = "hello@loumilab.com";

export interface ManagedEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative; derived from the HTML when omitted. */
  text?: string;
  replyTo?: string;
  /** Shown before the address in the From: header. */
  displayName?: string;
  /** Short label used for delivery logs. */
  label?: string;
  /** Dedupes retries of the same logical send. */
  idempotencyKey?: string;
}

export interface ManagedEmailResult {
  ok: boolean;
  suppressed?: boolean;
  error?: string;
  /** true when a retry could plausibly succeed (rate limit / transport). */
  retryable?: boolean;
}

/** Readable plain-text fallback so filters never see an HTML-only message. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3|li|table)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Sends one email through Lovable's managed delivery. Never throws. */
export async function sendManagedEmail(params: ManagedEmailParams): Promise<ManagedEmailResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY is not configured", retryable: false };
  if (!params.to) return { ok: false, error: "Missing recipient", retryable: false };

  const name = params.displayName ?? "Loumilab";
  try {
    await sendLovableEmail(
      {
        to: params.to,
        from: `"${name}" <no-reply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: params.subject,
        html: params.html,
        text: params.text ?? htmlToText(params.html),
        purpose: "transactional",
        label: params.label ?? "app-email",
        idempotency_key: params.idempotencyKey || crypto.randomUUID(),
        reply_to: params.replyTo ?? REPLY_TO,
      },
      { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
    );
    return { ok: true };
  } catch (err) {
    if (err instanceof EmailAPIError) {
      if (err.code === "recipient_suppressed") return { ok: false, suppressed: true };
      console.error(`Managed email failed [${err.code}]`);
      return {
        ok: false,
        error: `${err.code}`,
        retryable: err.status === 429 || err.status >= 500,
      };
    }
    console.error("Managed email transport error", err instanceof Error ? err.message : err);
    return { ok: false, error: "transport_error", retryable: true };
  }
}
