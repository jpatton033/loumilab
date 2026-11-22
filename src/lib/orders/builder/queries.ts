import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { validateDesign, type Design } from "./schema";

export interface DesignRow {
  storefront_id: string;
  merchant_id: string;
  template_key: string;
  draft: Design | Record<string, never>;
  published: Design | null;
  published_version: number;
  published_at: string | null;
  updated_at: string;
}

export interface DesignVersion { version: number; created_at: string }

export const useStorefrontDesign = (storefrontId?: string | null) =>
  useQuery({
    queryKey: ["orders", "design", storefrontId],
    enabled: !!storefrontId,
    queryFn: async (): Promise<DesignRow | null> => {
      const { data, error } = await supabase.from("storefront_designs").select("*").eq("storefront_id", storefrontId as string).maybeSingle();
      if (error) throw error;
      return (data as unknown as DesignRow) ?? null;
    },
  });

export const useDesignVersions = (storefrontId?: string | null) =>
  useQuery({
    queryKey: ["orders", "design-versions", storefrontId],
    enabled: !!storefrontId,
    queryFn: async (): Promise<DesignVersion[]> => {
      const { data, error } = await supabase.from("storefront_design_versions").select("version, created_at")
        .eq("storefront_id", storefrontId as string).order("version", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

/** Saves the draft only; the live site is untouched until Publish. */
export const saveDraft = async (storefrontId: string, merchantId: string, design: Design, exists: boolean) => {
  const payload = { draft: design as unknown as Json, template_key: design.template };
  const { error } = exists
    ? await supabase.from("storefront_designs").update(payload).eq("storefront_id", storefrontId)
    : await supabase.from("storefront_designs").insert({ storefront_id: storefrontId, merchant_id: merchantId, ...payload });
  if (error) throw error;
};

export const usePublishDesign = (storefrontId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("publish_storefront_design", { _storefront: storefrontId as string });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useRestoreDesign = (storefrontId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) => {
      const { data, error } = await supabase.rpc("restore_storefront_design", { _storefront: storefrontId as string, _version: version });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

/** Published design for a public store, or null to use the classic template. */
export const usePublishedDesign = (slug?: string) =>
  useQuery({
    queryKey: ["orders", "public-design", slug],
    enabled: !!slug,
    staleTime: 60_000,
    queryFn: async (): Promise<Design | null> => {
      const { data, error } = await supabase.rpc("get_public_storefront_design", { _slug: slug as string });
      if (error || !data) return null;
      const parsed = validateDesign(data);
      return parsed.success ? parsed.data : null;
    },
  });

/** Template chosen during setup, before the merchant has a store. */
const PENDING_KEY = "loumilab.orders.pendingTemplate";
export const setPendingTemplate = (key: string) => { try { localStorage.setItem(PENDING_KEY, key); } catch { /* ignore */ } };
export const getPendingTemplate = () => { try { return localStorage.getItem(PENDING_KEY); } catch { return null; } };
export const clearPendingTemplate = () => { try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ } };
