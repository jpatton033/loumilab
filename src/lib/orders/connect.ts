import { useQuery, useQueryClient } from "@tanstack/react-query";
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

/**
 * Stripe reports outstanding onboarding fields as raw API paths
 * (e.g. `representative.dob.day`). Merchants should never see those.
 */
const REQUIREMENT_LABELS: { match: RegExp; label: string }[] = [
  { match: /^business_profile\.(mcc|product_description|support_)/, label: "Business category and description" },
  { match: /^business_profile\.url/, label: "Business website" },
  { match: /^business_profile\./, label: "Business profile details" },
  { match: /^business_type$/, label: "Business type" },
  { match: /^external_account/, label: "Bank account for payouts" },
  { match: /^tos_acceptance\./, label: "Accept Stripe's terms of service" },
  { match: /^(representative|individual|person_[^.]*)\.dob/, label: "Owner's date of birth" },
  { match: /^(representative|individual|person_[^.]*)\.(first_name|last_name|name)/, label: "Owner's full name" },
  { match: /^(representative|individual|person_[^.]*)\.email/, label: "Owner's email address" },
  { match: /^(representative|individual|person_[^.]*)\.phone/, label: "Owner's phone number" },
  { match: /^(representative|individual|person_[^.]*)\.address/, label: "Owner's home address" },
  { match: /^(representative|individual|person_[^.]*)\.(id_number|ssn|verification)/, label: "Identity verification" },
  { match: /^(representative|individual|person_[^.]*)\./, label: "Owner details" },
  { match: /^company\.(tax_id|vat_id)/, label: "Business tax ID" },
  { match: /^company\.address/, label: "Business address" },
  { match: /^company\./, label: "Company details" },
  { match: /^owners?/, label: "Ownership information" },
];

function humanizeRequirement(field: string): string {
  const match = REQUIREMENT_LABELS.find((entry) => entry.match.test(field));
  if (match) return match.label;
  const tail = field.split(".").pop() ?? field;
  const words = tail.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** De-duplicated, plain-English list of what Stripe still needs. */
export function friendlyRequirements(fields: string[] | null | undefined): string[] {
  if (!fields?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const field of fields) {
    const label = humanizeRequirement(field);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

/**
 * Fields Loumilab fills in from the store set-up (business profile, category,
 * website, business type) versus the ones only the merchant can provide.
 */
const PLATFORM_PROVIDED = /^(business_profile\.|business_type$)/;

export function splitRequirements(fields: string[] | null | undefined): {
  provided: string[];
  merchant: string[];
} {
  const provided = friendlyRequirements((fields ?? []).filter((f) => PLATFORM_PROVIDED.test(f)));
  const merchant = friendlyRequirements((fields ?? []).filter((f) => !PLATFORM_PROVIDED.test(f)));
  return { provided, merchant };
}



type ConnectAction = "start" | "status" | "dashboard_link";


export async function callConnect(
  action: ConnectAction,
  body: Record<string, unknown> = {}
): Promise<ConnectResponse> {
  const returnUrl =
    action === "start"
      ? `${window.location.origin}/orders/dashboard?payments=return`
      : `${window.location.origin}/orders/dashboard`;
  const { data, error } = await supabase.functions.invoke<ConnectResponse>("stripe-connect", {
    body: { action, returnUrl, ...body },
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

/** Shared cache key so every panel reads one payments answer. */
export const PAYOUTS_QUERY_KEY = ["orders", "payouts"] as const;

/**
 * Single source of truth for payments status. It re-syncs from Stripe on the
 * server, so the setup checklist and the payments card can never disagree.
 */
export const usePayoutStatus = () =>
  useQuery({
    queryKey: PAYOUTS_QUERY_KEY,
    queryFn: async (): Promise<ConnectResponse> => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { code: "signed_out" };
      return fetchConnectStatus();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

/** Refresh payments status and everything derived from it. */
export const useRefreshPayouts = () => {
  const qc = useQueryClient();
  return async () => {
    await qc.invalidateQueries({ queryKey: PAYOUTS_QUERY_KEY });
    await qc.invalidateQueries({ queryKey: ["orders", "setup"] });
  };
};

