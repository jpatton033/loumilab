import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LiveProduct, LiveStorefront } from "@/lib/orders/storefront";

/**
 * Merchant-owned storefront and catalog management. Row-level security scopes
 * every read and write to the signed-in merchant.
 */

export const useMyStorefront = (merchantId?: string) =>
  useQuery({
    queryKey: ["orders", "my-storefront", merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_storefronts")
        .select("*")
        .eq("merchant_id", merchantId as string)
        .order("created_at")
        .limit(1)
        .maybeSingle()
        .returns<LiveStorefront | null>();
      if (error) throw error;
      return data;
    },
  });

export const useStorefrontProducts = (storefrontId?: string) =>
  useQuery({
    queryKey: ["orders", "my-products", storefrontId],
    enabled: !!storefrontId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_products")
        .select("id, name, description, price_cents, image_url, category, availability, is_active, display_order")
        .eq("storefront_id", storefrontId as string)
        .order("display_order")
        .returns<LiveProduct[]>();
      if (error) throw error;
      return data ?? [];
    },
  });

export const useCreateStorefront = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; slug: string; location?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("merchant_storefronts")
        .insert({
          merchant_id: merchantId as string,
          name: input.name,
          slug: input.slug,
          location: input.location || null,
          description: input.description || null,
          monogram: input.name.slice(0, 2).toUpperCase(),
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my-storefront", merchantId] }),
  });
};

export const useUpdateStorefront = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<LiveStorefront>) => {
      const { error } = await supabase.from("merchant_storefronts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my-storefront", merchantId] }),
  });
};

export interface ProductInput {
  name: string;
  description?: string;
  price_cents: number;
  category?: string;
  availability?: "available" | "sold_out" | "unavailable";
}

export const useSaveProduct = (merchantId?: string, storefrontId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ProductInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from("merchant_products").update(input).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("merchant_products").insert({
        ...input,
        merchant_id: merchantId as string,
        storefront_id: storefrontId as string,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my-products", storefrontId] }),
  });
};

export const useDeleteProduct = (storefrontId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("merchant_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my-products", storefrontId] }),
  });
};

export interface MerchantOrderRow {
  id: string;
  reference: string | null;
  status: string;
  customer_name: string;
  fulfilment: "pickup" | "delivery";
  currency: string;
  total_cents: number;
  platform_fee_cents: number;
  paid_at: string | null;
  created_at: string;
}

/** Real paid + pending orders for this merchant. */
export const useMerchantOrders = (merchantId?: string) =>
  useQuery({
    queryKey: ["orders", "merchant-orders", merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, reference, status, customer_name, fulfilment, currency, total_cents, platform_fee_cents, paid_at, created_at",
        )
        .eq("merchant_id", merchantId as string)
        .order("created_at", { ascending: false })
        .limit(25)
        .returns<MerchantOrderRow[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
