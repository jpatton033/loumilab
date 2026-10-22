import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin/audit";
import type { FeeTiers } from "../../../supabase/functions/_shared/progressiveFee";

export * from "../../../supabase/functions/_shared/progressiveFee";

export const FEE_PLANS = [
  { slug: "launch", name: "Launch", price: "$0/month" },
  { slug: "starter", name: "Starter", price: "$19/month" },
  { slug: "business", name: "Business", price: "$49/month" },
] as const;

/** Approved tiers, used for previews when nothing is live yet. */
export const DEFAULT_TIERS: FeeTiers = {
  thresholds: [250000, 500000, 1000000],
  rates: { launch: [500, 450, 400, 350], starter: [390, 340, 290, 240], business: [290, 240, 190, 140] },
};

export const pct = (bps: number) => `${(bps / 100).toFixed(1)}%`;
export const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 });

/** Human labels for each tier band, e.g. "$2,500.01 – $5,000". */
export const tierLabels = (t: FeeTiers) =>
  [0, ...t.thresholds].map((from, i) => {
    const to = t.thresholds[i];
    if (i === 0) return `$0 – ${usd(to)}`;
    return to === undefined ? `Above ${usd(from)}` : `${usd(from + 1)} – ${usd(to)}`;
  });

export interface PublicSchedule {
  version: number;
  tiers: FeeTiers;
  effective_at: string;
}

export function useFeeSchedule() {
  return useQuery({
    queryKey: ["fee-schedule-public"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_fee_schedule");
      if (error) throw error;
      return (data ?? { active: null, upcoming: null }) as unknown as { active: PublicSchedule | null; upcoming: PublicSchedule | null };
    },
  });
}

export interface FeeProgress {
  plan_slug: string;
  flat_bps: number;
  period_start: string;
  volume_cents: number;
  fees_cents: number;
  schedule: { version: number; tiers: FeeTiers } | null;
}

export function useMerchantFeeProgress(enabled = true) {
  return useQuery({
    queryKey: ["merchant-fee-progress"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("merchant_fee_progress");
      if (error) throw error;
      return (data ?? null) as unknown as FeeProgress | null;
    },
  });
}

export interface FeeScheduleRow {
  id: string;
  version: number;
  status: "draft" | "active" | "retired";
  tiers: FeeTiers;
  effective_at: string | null;
  notes: string | null;
  activated_at: string | null;
  created_at: string;
}

export function useAdminFeeSchedules() {
  return useQuery({
    queryKey: ["admin-fee-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_fee_schedules")
        .select("id, version, status, tiers, effective_at, notes, activated_at, created_at")
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FeeScheduleRow[];
    },
  });
}

export function useAdminFeeSummary() {
  return useQuery({
    queryKey: ["admin-fee-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_fee_summary");
      if (error) throw error;
      return data as unknown as { merchants: number; volume_cents: number; fees_cents: number; progressive_orders: number; flat_equivalent_cents: number };
    },
  });
}

/** Draft create/update, activate (with effective date) and retire. All audited. */
export function useFeeScheduleActions() {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin-fee-schedules"] });
    qc.invalidateQueries({ queryKey: ["fee-schedule-public"] });
  };
  const saveDraft = useMutation({
    mutationFn: async (p: { id?: string; tiers: FeeTiers; notes: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const q = p.id
        ? supabase.from("orders_fee_schedules").update({ tiers: p.tiers as never, notes: p.notes }).eq("id", p.id).select("id, version").single()
        : supabase.from("orders_fee_schedules").insert({ tiers: p.tiers as never, notes: p.notes, created_by: u.user?.id }).select("id, version").single();
      const { data, error } = await q;
      if (error) throw error;
      await logAudit({ action: "fee_schedule.save_draft", targetType: "orders_fee_schedule", targetId: data.id, newValue: p.tiers as never });
      return data;
    },
    onSuccess: done,
  });
  const activate = useMutation({
    mutationFn: async (p: { id: string; effectiveAt: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("orders_fee_schedules")
        .update({ status: "active", effective_at: p.effectiveAt, activated_at: new Date().toISOString(), activated_by: u.user?.id })
        .eq("id", p.id);
      if (error) throw error;
      await logAudit({ action: "fee_schedule.activate", targetType: "orders_fee_schedule", targetId: p.id, newValue: { effective_at: p.effectiveAt } });
    },
    onSuccess: done,
  });
  const retire = useMutation({
    mutationFn: async (p: { id: string; reason: string }) => {
      const { error } = await supabase.from("orders_fee_schedules").update({ status: "retired" }).eq("id", p.id);
      if (error) throw error;
      await logAudit({ action: "fee_schedule.retire", targetType: "orders_fee_schedule", targetId: p.id, reason: p.reason });
    },
    onSuccess: done,
  });
  return { saveDraft, activate, retire };
}
