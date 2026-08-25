const MAILEROO_ENDPOINT = "https://smtp.maileroo.com/api/v2/emails";

/** Loumilab's verified sending identity, shared with the contact emails. */
export const BRIEF_FROM = "no-reply@loumilab.com";

export interface SendResult {
  ok: boolean;
  error?: string;
  /** true when a retry could plausibly succeed (transport/5xx/429). */
  retryable?: boolean;
}

/** Sends one email through Maileroo. Never logs recipients' message content. */
export async function sendBriefEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = Deno.env.get("MAILEROO_API_KEY");
  if (!apiKey) return { ok: false, error: "MAILEROO_API_KEY not configured", retryable: false };

  try {
    const res = await fetch(MAILEROO_ENDPOINT, {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: BRIEF_FROM, display_name: "Loumilab Operations" },
        to: { address: params.to },
        subject: params.subject,
        html: params.html,
        plain: params.text,
      }),
    });

    if (res.ok) return { ok: true };

    const body = (await res.text()).slice(0, 300);
    console.error(`Maileroo error ${res.status} for brief delivery`);
    return {
      ok: false,
      error: `Maileroo ${res.status}: ${body}`,
      retryable: res.status === 429 || res.status >= 500,
    };
  } catch (err) {
    return { ok: false, error: `Transport error: ${(err as Error).message}`.slice(0, 300), retryable: true };
  }
}
