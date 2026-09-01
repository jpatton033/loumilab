import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Super Admin view of Stripe linkage for Orders plans. All Stripe calls happen
 * server-side in the `orders-plans-stripe` function — the browser only reads
 * status and requests provisioning.
 */

export type PlanLinkState = "not_applicable" | "not_linked" | "linked" | "stale";

/** "unknown" when the backend has no usable Stripe secret key. */
export type StripeMode = "live" | "test" | "unknown";


export interface PlanLinkStatus {
  plan_id: string;
  slug: string;
  state: PlanLinkState;
  mode: StripeMode;

  product_id: string | null;
  monthly_price_id: string | null;
  annual_price_id: string | null;
  monthly_ok: boolean;
  annual_ok: boolean;
  annual_required: boolean;
  detail: string;
}

const call = async <T>(body: unknown): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("orders-plans-stripe", { body });
  const payload = data as ({ error?: string } & T) | null;
  if (payload && typeof payload.error === "string") throw new Error(payload.error);
  if (error) throw new Error(error.message);
  return payload as T;
};

export const usePlanStripeStatus = () =>
  useQuery({
    queryKey: ["orders", "plans", "stripe-status"],
    staleTime: 60_000,
    retry: false,
    queryFn: () => call<{ mode: StripeMode; plans: PlanLinkStatus[] }>({ action: "status" }),
  });

export const useLinkPlanToStripe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => call<{ plan: PlanLinkStatus }>({ action: "link", plan_id: planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "plans", "stripe-status"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "plans"] });
    },
  });
};

export const PLAN_LINK_LABELS: Record<PlanLinkState, string> = {
  not_applicable: "—",
  not_linked: "Not linked yet",
  linked: "Linked",
  stale: "Price out of date",
};
