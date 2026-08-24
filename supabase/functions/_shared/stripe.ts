import Stripe from "npm:stripe@17";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

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
