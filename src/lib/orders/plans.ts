import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loumilab Orders plans live in the database (`orders_plans`) so pricing,
 * platform fees, annual billing, features and CTAs are Super Admin editable
 * without a deploy. Nothing here is authoritative for money movement — the
 * server recalculates fees from this table on every transaction.
 */
export interface OrdersPlan {
  id: string;
  slug: string;
  name: string;
  positioning: string;
  description: string;
  price_label: string | null;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  annual_billing_active: boolean;
  annual_note: string | null;
  platform_fee_bps: number | null;
  fee_label: string | null;
  features: string[];
  entitlements: Record<string, unknown>;
  badge: string | null;
  cta_label: string;
  cta_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  requires_subscription: boolean;
  is_public: boolean;
  is_active: boolean;
  display_order: number;
  effective_from: string;
  stripe_product_id: string | null;
  stripe_price_monthly_id: string | null;
  stripe_price_annual_id: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_COLUMNS =
  "id, slug, name, positioning, description, price_label, monthly_price_cents, annual_price_cents, annual_billing_active, annual_note, platform_fee_bps, fee_label, features, entitlements, badge, cta_label, cta_href, cta_secondary_label, cta_secondary_href, requires_subscription, is_public, is_active, display_order, effective_from, stripe_product_id, stripe_price_monthly_id, stripe_price_annual_id, created_at, updated_at";

const normalize = (rows: unknown[]): OrdersPlan[] =>
  (rows ?? []).map((r) => {
    const row = r as OrdersPlan;
    return {
      ...row,
      features: row.features ?? [],
      entitlements: (row.entitlements ?? {}) as Record<string, unknown>,
    };
  });

/** Plans shown on the public pricing table. */
export const usePublicPlans = () =>
  useQuery({
    queryKey: ["orders", "plans", "public"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<OrdersPlan[]> => {
      const { data, error } = await supabase
        .from("orders_plans")
        .select(PLAN_COLUMNS)
        .eq("is_public", true)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return normalize(data ?? []);
    },
  });

/** Every plan, including private/inactive ones — admin only via RLS. */
export const useAllPlans = () =>
  useQuery({
    queryKey: ["orders", "plans", "all"],
    queryFn: async (): Promise<OrdersPlan[]> => {
      const { data, error } = await supabase.from("orders_plans").select(PLAN_COLUMNS).order("display_order");
      if (error) throw error;
      return normalize(data ?? []);
    },
  });

export interface PlanFeeChange {
  id: string;
  plan_id: string;
  old_fee_bps: number | null;
  new_fee_bps: number;
  effective_from: string;
  reason: string | null;
  created_at: string;
}

export const usePlanFeeChanges = (limit = 25) =>
  useQuery({
    queryKey: ["orders", "plan-fee-changes", limit],
    queryFn: async (): Promise<PlanFeeChange[]> => {
      const { data, error } = await supabase
        .from("orders_plan_fee_changes")
        .select("id, plan_id, old_fee_bps, new_fee_bps, effective_from, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as PlanFeeChange[];
    },
  });

/* ------------------------------- formatting ------------------------------- */

export const formatMoneyCents = (cents: number | null | undefined) => {
  if (cents == null) return "—";
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toFixed(0) : dollars.toFixed(2)}`;
};

/** 390 bps -> "3.9%" */
export const formatFeeBps = (bps: number | null | undefined) => {
  if (bps == null) return "Custom";
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(2).replace(/0$/, "")}%`;
};

export const planPriceLabel = (plan: OrdersPlan, annual: boolean) => {
  if (plan.monthly_price_cents == null) return plan.price_label ?? "Custom";
  if (annual && plan.annual_billing_active && plan.annual_price_cents != null) {
    return formatMoneyCents(Math.round(plan.annual_price_cents / 12));
  }
  return formatMoneyCents(plan.monthly_price_cents);
};

export const planPeriodLabel = (plan: OrdersPlan, annual: boolean) => {
  if (plan.monthly_price_cents == null) return "";
  if (plan.monthly_price_cents === 0) return "to start";
  return annual && plan.annual_billing_active ? "per month, billed annually" : "per month";
};

/** Approximate saving when switching a plan to annual billing. */
export const annualSavingLabel = (plan: OrdersPlan) => {
  if (!plan.annual_billing_active || plan.annual_price_cents == null || !plan.monthly_price_cents) return null;
  const saving = plan.monthly_price_cents * 12 - plan.annual_price_cents;
  if (saving <= 0) return null;
  return `Save ${formatMoneyCents(saving)} a year`;
};
