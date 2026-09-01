import Stripe from "npm:stripe@17";

const SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

export const stripe = new Stripe(SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * A usable Stripe secret key is `sk_...` (standard) or `rk_...` (restricted).
 * Anything else (e.g. a publishable or meter id) authenticates as 401, so we
 * treat it as "not configured" instead of leaking a raw Stripe auth error.
 */
const KEY_SHAPE = /^(sk|rk)_(test|live)_[A-Za-z0-9]/;
export const stripeConfigured = KEY_SHAPE.test(SECRET_KEY);

/** Mode derived from the key prefix; "unknown" when the key is unusable. */
export const stripeMode: "live" | "test" | "unknown" = !stripeConfigured
  ? "unknown"
  : SECRET_KEY.startsWith("sk_live_") || SECRET_KEY.startsWith("rk_live_")
    ? "live"
    : "test";
export const stripeLivemode = stripeMode === "live";

/** True when a key is present but malformed — actionable config error. */
export const stripeKeyMalformed = SECRET_KEY.length > 0 && !stripeConfigured;


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
