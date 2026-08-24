import Stripe from "npm:stripe@17";

const SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

export const stripe = new Stripe(SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

/** "live" when the configured secret key is a live-mode key, otherwise "test". */
export const stripeMode: "live" | "test" = SECRET_KEY.includes("_live_") ? "live" : "test";
export const stripeLivemode = stripeMode === "live";
export const stripeConfigured = SECRET_KEY.length > 0;

/** Origins allowed as Stripe onboarding return/refresh targets. */
const ALLOWED_ORIGINS = [
  "https://loumilab.com",
  "https://www.loumilab.com",
  "https://loumilab.lovable.app",
  "http://localhost:8080",
];

export function resolveReturnBase(returnUrl: string | undefined, requestOrigin: string): string {
  const isAllowed = (origin: string) =>
    ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);

  if (returnUrl) {
    try {
      const url = new URL(returnUrl);
      if (isAllowed(url.origin)) return url.toString();
    } catch {
      // fall through to origin-based default
    }
  }
  if (requestOrigin && isAllowed(requestOrigin)) return `${requestOrigin}/orders/dashboard`;
  return "https://loumilab.com/orders/dashboard";
}

export type PayoutStatus =
  | "not_started"
  | "onboarding"
  | "pending_verification"
  | "restricted"
  | "payout_enabled"
  | "disabled";

export function resolvePayoutStatus(account: {
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  requirements?: {
    currently_due?: string[];
    past_due?: string[];
    disabled_reason?: string | null;
  } | null;
}): PayoutStatus {
  const req = account.requirements ?? {};
  if (req.disabled_reason) return "disabled";
  if (account.payouts_enabled && account.charges_enabled) return "payout_enabled";
  if (!account.details_submitted) {
    const started = (req.currently_due?.length ?? 0) > 0;
    return started ? "onboarding" : "not_started";
  }
  if ((req.past_due?.length ?? 0) > 0) return "restricted";
  return "pending_verification";
}
