import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin/audit";

/**
 * Platform-fee promotions. Campaigns live in orders_promotions (staff only);
 * each merchant's snapshotted terms live in merchant_promotions. Fees are
 * enforced server-side in supabase/functions/_shared/fees.ts — nothing here
 * changes what a merchant is charged.
 */

export type PromoStatus = "draft" | "active" | "paused" | "archived";
export type PromoTrigger = "signup" | "publish" | "first_paid_order";
export type PromoEligibility = "new" | "existing" | "selected";
export type PromoSurface = "homepage" | "builder" | "onboarding";

export interface Promotion {
  id: string;
  name: string;
  description: string;
  message: string;
  terms: string;
  fee_bps: number;
  duration_days: number;
  starts_at: string;
  signup_deadline: string | null;
  start_trigger: PromoTrigger;
  eligibility: PromoEligibility;
  selected_merchant_ids: string[];
  show_homepage: boolean;
  show_builder: boolean;
  show_onboarding: boolean;
  status: PromoStatus;
  created_at: string;
}

export interface MerchantPromotion {
  id: string;
  merchant_id: string;
  promotion_id: string;
  status: "qualified" | "active" | "expired" | "ended";
  qualified_at: string;
  activated_at: string | null;
  expires_at: string | null;
  duration_days: number;
  start_trigger: PromoTrigger;
  promo_fee_bps: number;
  normal_fee_bps: number;
  eligible_volume_cents: number;
  fees_waived_cents: number;
  ended_reason: string | null;
}

export interface PublicPromotion {
  id: string;
  name: string;
  message: string;
  description: string;
  terms: string;
  fee_bps: number;
  duration_days: number;
  signup_deadline: string;
  start_trigger: PromoTrigger;
}

export const TRIGGER_LABELS: Record<PromoTrigger, string> = {
  signup: "When the account is created",
  publish: "When the store is first published",
  first_paid_order: "At the first paid order",
};
export const ELIGIBILITY_LABELS: Record<PromoEligibility, string> = {
  new: "New merchants",
  existing: "Existing merchants",
  selected: "Chosen merchants",
};

/** Days left (rounded up) on an active merchant promotion; 0 once over. */
export const promoDaysLeft = (expiresAt: string | null, now: Date = new Date()) => {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
};

/** Live from the merchant's point of view: active and not past its end time. */
export const isMerchantPromoLive = (mp: Pick<MerchantPromotion, "status" | "expires_at"> | null | undefined, now = new Date()) =>
  Boolean(mp && mp.status === "active" && promoDaysLeft(mp.expires_at, now) > 0);

/** Eastern-time deadline label, e.g. "Nov 30, 2026, 11:59 PM ET". */
export const formatDeadline = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso)) + " ET";

export const bpsToPct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 2 : 0)}%`;

// ---------- Public ----------
export const useActivePromotion = (surface: PromoSurface) =>
  useQuery({
    queryKey: ["promo", "active", surface],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_promotion", { _surface: surface });
      if (error) return null;
      return (data as unknown as PublicPromotion | null) ?? null;
    },
  });

// ---------- Merchant ----------
export const useMyMerchantPromotion = (merchantId?: string) =>
  useQuery({
    queryKey: ["promo", "mine", merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      const { data } = await supabase
        .from("merchant_promotions")
        .select("*")
        .eq("merchant_id", merchantId!)
        .maybeSingle();
      return (data as MerchantPromotion | null) ?? null;
    },
  });

// ---------- Admin ----------
export const useAdminPromotions = () =>
  useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: async () => {
      const [promos, parts, merchants, orders] = await Promise.all([
        supabase.from("orders_promotions").select("*").order("created_at", { ascending: false }),
        supabase.from("merchant_promotions").select("*"),
        supabase.from("merchants").select("id, business_name"),
        supabase.from("orders").select("merchant_id, paid_at").not("paid_at", "is", null).order("paid_at", { ascending: false }).limit(1000),
      ]);
      if (promos.error) throw promos.error;
      if (parts.error) throw parts.error;
      const lastPaid = new Map<string, string>();
      (orders.data ?? []).forEach((o) => {
        if (o.paid_at && !lastPaid.has(o.merchant_id)) lastPaid.set(o.merchant_id, o.paid_at);
      });
      return {
        promotions: (promos.data ?? []) as Promotion[],
        participants: (parts.data ?? []) as MerchantPromotion[],
        merchantNames: new Map((merchants.data ?? []).map((m) => [m.id, m.business_name as string])),
        lastPaid,
      };
    },
  });

export interface PromoStats {
  qualified: number;
  activated: number;
  current: number;
  expired: number;
  volumeCents: number;
  waivedCents: number;
  retained: number;
}

export const promoStats = (
  participants: MerchantPromotion[],
  lastPaid: Map<string, string>,
  now = new Date(),
): PromoStats => {
  const over = participants.filter((p) => p.status === "expired" || p.status === "ended" || (p.status === "active" && !isMerchantPromoLive(p, now)));
  return {
    qualified: participants.length,
    activated: participants.filter((p) => p.activated_at).length,
    current: participants.filter((p) => isMerchantPromoLive(p, now)).length,
    expired: over.length,
    volumeCents: participants.reduce((s, p) => s + Number(p.eligible_volume_cents), 0),
    waivedCents: participants.reduce((s, p) => s + Number(p.fees_waived_cents), 0),
    retained: over.filter((p) => {
      const last = lastPaid.get(p.merchant_id);
      return last && p.expires_at && new Date(last) > new Date(p.expires_at);
    }).length,
  };
};

export type PromotionInput = Omit<Promotion, "id" | "created_at" | "status"> & { status?: PromoStatus };

export const useSavePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, previous }: { id?: string; input: PromotionInput; previous?: Promotion }) => {
      if (id) {
        const { error } = await supabase.from("orders_promotions").update(input).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "promotion.updated", targetType: "promotion", targetId: id, oldValue: previous, newValue: input });
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("orders_promotions")
          .insert({ ...input, status: "draft", created_by: auth.user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        await logAudit({ action: "promotion.created", targetType: "promotion", targetId: data.id, newValue: input });
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "promotions"] }),
  });
};

export const useSetPromotionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ promo, status }: { promo: Promotion; status: PromoStatus }) => {
      if (status === "active" && !promo.signup_deadline) throw new Error("Add a signup deadline before turning this on.");
      const { error } = await supabase.from("orders_promotions").update({ status }).eq("id", promo.id);
      if (error) throw error;
      await logAudit({ action: `promotion.${status}`, targetType: "promotion", targetId: promo.id, oldValue: { status: promo.status }, newValue: { status } });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "promotions"] });
      void qc.invalidateQueries({ queryKey: ["promo"] });
    },
  });
};

export const useEndMerchantPromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mp, reason }: { mp: MerchantPromotion; reason: string }) => {
      const { error } = await supabase
        .from("merchant_promotions")
        .update({ status: "ended", ended_reason: reason || "Ended by admin", expires_at: new Date().toISOString() })
        .eq("id", mp.id);
      if (error) throw error;
      await logAudit({ action: "promotion.merchant_ended", targetType: "merchant", targetId: mp.merchant_id, oldValue: mp, reason });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "promotions"] }),
  });
};
