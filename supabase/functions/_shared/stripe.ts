import Stripe from "npm:stripe@17";

/** Pasted keys often carry stray whitespace or wrapping quotes — strip both. */
const SECRET_KEY = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim().replace(/^["']|["']$/g, "");

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

/** A publishable key was saved by mistake — front-end only, never valid here. */
export const stripePublishableKeySaved = SECRET_KEY.startsWith("pk_");

/**
 * The key's type marker only (text before the first underscore, capped short),
 * so an admin can tell which value was pasted. Never exposes key material.
 */
const KEY_PREFIX = SECRET_KEY.includes("_")
  ? SECRET_KEY.slice(0, Math.min(SECRET_KEY.indexOf("_"), 8))
  : "";

/**
 * Plain-English description of an unusable key, safe to return to admins.
 * Never includes any part of the key value itself.
 */
export const stripeKeyProblem: string | null = stripeConfigured
  ? null
  : SECRET_KEY.length === 0
    ? "No Stripe key is saved for this project yet."
    : stripePublishableKeySaved
      ? "A publishable key (pk_…) is saved as the payment key. Publishable keys only work in the browser — save the Secret key (sk_live_… or sk_test_…) instead."
      : `The saved payment key is not a Stripe secret key (it begins with "${KEY_PREFIX || "an unrecognised value"}"). Save the Secret key from Stripe's API keys page — it starts with sk_live_ or sk_test_.`;



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
  const reason = req.disabled_reason ?? null;

  if (account.payouts_enabled && account.charges_enabled) return "payout_enabled";

  // An account that has never submitted its details is simply mid-onboarding —
  // Stripe still reports `requirements.past_due` as the disabled reason, which
  // must not be surfaced as a hard "Disabled" state.
  if (!account.details_submitted) {
    const started = (req.currently_due?.length ?? 0) > 0 || Boolean(reason);
    return started ? "onboarding" : "not_started";
  }

  // Details submitted: only non-requirements reasons are genuinely disabling.
  if (reason && !/^requirements?\./.test(reason)) return "disabled";
  if (reason || (req.past_due?.length ?? 0) > 0 || (req.currently_due?.length ?? 0) > 0) {
    return "restricted";
  }
  return "pending_verification";
}

