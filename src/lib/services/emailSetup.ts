import { supabase } from "@/integrations/supabase/client";
export * from "../../../supabase/functions/_shared/emailSetupPricing";
export * from "../../../supabase/functions/_shared/emailSetupBalance";
import { useQuery } from "@tanstack/react-query";

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  new_request: "New Request",
  awaiting_review: "Awaiting Review",
  awaiting_approval: "Awaiting Customer Approval",
  ready_for_setup: "Ready for Setup",
  awaiting_quote: "Awaiting Quote",
  awaiting_payment: "Awaiting Payment",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting Customer Action",
  testing: "Testing & Verification",
  completed: "Completed",
  canceled: "Canceled",
};
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid", pending: "Pending", paid: "Paid", partially_paid: "Partially Paid",
  additional_payment_required: "Additional Payment Required", partially_refunded: "Partially Refunded", failed: "Failed", expired: "Expired", refunded: "Refunded", not_required: "Not required",
};

export const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const DRAFT_KEY = "loumilab.emailSetup.draft";
export const TOKEN_KEY = "loumilab.emailSetup.token";

async function call<T>(fn: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  const payload = data as { error?: string } & T;
  if (payload && typeof payload.error === "string") throw new Error(payload.error);
  if (error) {
    let msg = error.message;
    try { const j = await (error as { context?: Response }).context?.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return payload as T;
}

export const submitEmailSetup = (intake: Record<string, unknown>) =>
  call<{ token: string; request_number: string; needs_review: boolean }>("email-setup", { action: "submit", intake });
export const startEmailSetupCheckout = (token: string) =>
  call<{ url: string }>("email-setup", { action: "checkout", token, origin: window.location.origin });
export const addEmailSetupInfo = (token: string, message: string) =>
  call<{ ok: true }>("email-setup", { action: "add_info", token, message });
export const emailSetupAdmin = (body: Record<string, unknown>) => call<{ ok: true; token?: string }>("email-setup-admin", body);

export const decideEmailSetupChange = (token: string, change_set_id: string, approve: boolean) =>
  call<{ ok: true; due?: number }>("email-setup", { action: "decide_change", token, change_set_id, approve });
export const payEmailSetupBalance = (token: string, change_set_id: string) =>
  call<{ url: string }>("email-setup", { action: "pay_balance", token, change_set_id, origin: window.location.origin });

export interface ProviderPrice {
  key: string; provider: string; plan_name: string; monthly_cents: number; per_user: boolean; billing_note: string;
  monthly_available: boolean; url: string; checked_on: string; sort: number; active: boolean;
}
export const useProviderPrices = () =>
  useQuery({
    queryKey: ["email-provider-prices"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_email_provider_prices");
      if (error) throw error;
      return (data ?? []) as unknown as ProviderPrice[];
    },
  });

export const ADDITIONAL_PROVIDER_COSTS =
  "Loumilab's setup fees do not include domain registration, domain renewals, or email hosting subscriptions. These costs are paid directly to the selected third-party providers and may be billed monthly or annually.";
