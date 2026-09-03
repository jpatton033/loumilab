import { supabase } from "@/integrations/supabase/client";

export type PayoutStatus =
  | "not_started"
  | "onboarding"
  | "pending_verification"
  | "restricted"
  | "payout_enabled"
  | "disabled";

export type MerchantRecord = {
  id: string;
  business_name: string;
  contact_email: string;
  country: string;
  accepting_orders: boolean;
  plan_slug: string;
};

export type ConnectedAccount = {
  id: string;
  stripe_account_id: string;
  livemode: boolean;
  payout_status: PayoutStatus;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_due: string[];
  requirements_disabled_reason: string | null;
  last_synced_at: string | null;
};

export type ConnectResponse = {
  mode?: "live" | "test";
  merchant?: MerchantRecord;
  account?: ConnectedAccount;
  url?: string;
  error?: string;
  /** Machine-readable reason, e.g. "connect_not_enabled" for platform config issues. */
  code?: string;
};

const NETWORK_FALLBACK =
  "We couldn't reach the payments service. Please try again in a moment — if it keeps failing, contact support.";

export const PAYOUT_STEPS: { status: PayoutStatus; label: string }[] = [
  { status: "not_started", label: "Not started" },
  { status: "onboarding", label: "In progress" },
  { status: "pending_verification", label: "Verifying" },
  { status: "payout_enabled", label: "Payout enabled" },
];

export const PAYOUT_LABELS: Record<PayoutStatus, string> = {
  not_started: "Not started",
  onboarding: "In progress",
  pending_verification: "Pending verification",
  restricted: "Action required",
  payout_enabled: "Payout enabled",
  disabled: "Disabled",
};

export const PAYOUT_DESCRIPTIONS: Record<PayoutStatus, string> = {
  not_started: "Set up payments to start accepting orders and receiving payouts.",
  onboarding: "Your details are incomplete. Continue setup to finish verification.",
  pending_verification: "Your information is being reviewed. This usually takes a few minutes.",
  restricted: "Additional information is required before payouts can resume.",
  payout_enabled: "You're verified. Payments and payouts are active.",
  disabled: "Payouts are currently disabled. Review the requirements to restore them.",
};

type ConnectAction = "start" | "status" | "dashboard_link";

export async function callConnect(
  action: ConnectAction,
  body: Record<string, unknown> = {}
): Promise<ConnectResponse> {
  const { data, error } = await supabase.functions.invoke<ConnectResponse>("stripe-connect", {
    body: { action, returnUrl: `${window.location.origin}/orders/dashboard`, ...body },
  });
  if (error) {
    // Non-2xx responses carry the function's JSON body — surface the real reason.
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === "function") {
      try {
        const payload = (await response.clone().json()) as ConnectResponse;
        if (payload?.error) return payload;
      } catch {
        // fall through to the network fallback
      }
    }
    return { error: NETWORK_FALLBACK };
  }
  if (data?.error) return data;
  return data ?? {};
}

export async function fetchConnectStatus(): Promise<ConnectResponse> {
  return callConnect("status");
}
