import { sendManagedEmail } from "../managed-email.ts";

/** Loumilab's verified sending identity, shared with every app email. */
export const BRIEF_FROM = "no-reply@notify.loumilab.com";

export interface SendResult {
  ok: boolean;
  error?: string;
  /** true when a retry could plausibly succeed (transport/5xx/429). */
  retryable?: boolean;
}

/** Sends one brief through Lovable's managed delivery. Never logs content. */
export async function sendBriefEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const result = await sendManagedEmail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    displayName: "Loumilab Operations",
    label: "ops-brief",
  });
  if (result.ok) return { ok: true };
  if (result.suppressed) return { ok: false, error: "Recipient is unsubscribed or suppressed", retryable: false };
  return { ok: false, error: result.error ?? "Send failed", retryable: result.retryable };
}
