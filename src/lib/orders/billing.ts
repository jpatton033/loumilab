import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Merchant-side billing and payouts. Plan changes always go through Stripe
 * Checkout / the billing portal — the browser never writes subscription state.
 */

export interface MerchantSubscription {
  plan_slug: string;
  interval: string;
  status: string;
  platform_fee_bps: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const call = async <T>(body: unknown, fn = "orders-billing"): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(typeof message === "string" ? message : error.message);
  }
  const payload = data as { error?: string } & T;
  if (payload && typeof payload.error === "string") throw new Error(payload.error);
  return payload as T;
};

export const useBillingStatus = (enabled = true) =>
  useQuery({
    queryKey: ["orders", "billing", "status"],
    enabled,
    queryFn: async () =>
      call<{ subscription: MerchantSubscription | null; merchant: { plan_slug: string } }>({
        action: "status",
      }),
  });

export const subscribeToPlan = (planSlug: string, interval: "month" | "year") =>
  call<{ url: string }>({
    action: "subscribe",
    plan_slug: planSlug,
    interval,
    returnUrl: window.location.origin,
  });

export const openBillingPortal = () =>
  call<{ url: string }>({ action: "portal", returnUrl: window.location.origin });

export interface PayoutsSnapshot {
  payout_status: string;
  available_cents: number;
  pending_cents: number;
  currency: string;
  /** Plain-English payout schedule, e.g. "Daily, 2 days after the sale". */
  payout_schedule: string | null;
  /** ISO date of the next expected payout, when Stripe reports one. */
  next_payout_at: string | null;
  payouts: {
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    arrival_date: number | null;
    created: number;
    failure_message: string | null;
  }[];
}

/**
 * Stripe balance and payout history. Its cache slot is deliberately separate
 * from the payments *status* query in `connect.ts` — sharing one made the two
 * overwrite each other and blanked the balance for verified merchants.
 */
export const usePayouts = (enabled = true) =>
  useQuery({
    queryKey: ["orders", "payout-balance"],
    enabled,
    retry: false,
    queryFn: async () => call<PayoutsSnapshot>({}, "orders-payouts"),
  });

