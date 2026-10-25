import { supabase } from "@/integrations/supabase/client";
export * from "../../../supabase/functions/_shared/emailSetupPricing";

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  new_request: "New Request",
  awaiting_quote: "Awaiting Quote",
  awaiting_payment: "Awaiting Payment",
  paid_awaiting_setup: "Paid — Awaiting Setup",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting Customer Action",
  testing: "Testing & Verification",
  completed: "Completed",
  canceled: "Canceled",
};
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid", pending: "Pending", paid: "Paid", failed: "Failed", expired: "Expired", refunded: "Refunded", not_required: "Not required",
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
