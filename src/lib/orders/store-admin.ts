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

/* ---------------------------- onboarding wizard --------------------------- */

export interface OnboardingInput {
  businessName: string;
  slug: string;
  industrySlug: string;
  purchaseModels: string[];
  planSlug: string | null;
  category?: string;
  location?: string;
  description?: string;
  hours?: string;
  pickupInfo?: string;
  items: { name: string; price: string }[];
}

export interface OnboardingResult {
  merchantId: string;
  storefrontId: string;
  slug: string;
}

const monogramFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "LO";

/** Finds a storefront slug that isn't taken yet, ignoring the merchant's own store. */
const uniqueSlug = async (base: string, ownStorefrontId?: string) => {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`.slice(0, 48);
    const { data, error } = await supabase
      .from("merchant_storefronts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.id === ownStorefrontId) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 48);
};

/**
 * Creates (or updates) the real merchant account, storefront and catalog from the
 * onboarding wizard. The storefront is saved as a draft — it is published
 * automatically once Stripe payouts are enabled for the merchant.
 */
export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OnboardingInput): Promise<OnboardingResult> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Please sign in to publish your store.");

      // 1. Merchant account (one per owner).
      const { data: existingMerchant, error: merchantReadError } = await supabase
        .from("merchants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (merchantReadError) throw merchantReadError;

      const merchantPayload = {
        business_name: input.businessName.trim(),
        contact_email: user.email ?? "",
        industry_slug: input.industrySlug,
        purchase_models: input.purchaseModels,
        plan_slug: input.planSlug ?? "starter",
        business_type: input.category?.trim() || null,
      };

      let merchantId = existingMerchant?.id as string | undefined;
      if (merchantId) {
        const { error } = await supabase.from("merchants").update(merchantPayload).eq("id", merchantId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("merchants")
          .insert({ ...merchantPayload, owner_id: user.id, accepting_orders: false })
          .select("id")
          .single();
        if (error) throw error;
        merchantId = data.id as string;
      }

      // 2. Storefront (draft until payouts are enabled).
      const { data: existingStore, error: storeReadError } = await supabase
        .from("merchant_storefronts")
        .select("id, slug")
        .eq("merchant_id", merchantId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (storeReadError) throw storeReadError;

      const slug = await uniqueSlug(input.slug, existingStore?.id as string | undefined);
      const storePayload = {
        name: input.businessName.trim(),
        slug,
        location: input.location?.trim() || null,
        description: input.description?.trim() || null,
        monogram: monogramFor(input.businessName),
        hours: input.hours?.trim() || null,
        pickup_info: input.pickupInfo?.trim() || null,
      };

      let resolvedSlug = slug;
      let storefrontId = existingStore?.id as string | undefined;
      if (storefrontId) {
        const { error } = await supabase
          .from("merchant_storefronts")
          .update(storePayload)
          .eq("id", storefrontId);
        if (error) throw error;
      } else {
        // Other merchants' draft stores aren't readable, so a slug clash can only
        // surface as a unique-violation on insert. Retry with a numeric suffix.
        for (let attempt = 0; attempt < 6 && !storefrontId; attempt++) {
          const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`.slice(0, 48);
          const { data, error } = await supabase
            .from("merchant_storefronts")
            .insert({ ...storePayload, slug: candidate, merchant_id: merchantId, is_published: false })
            .select("id")
            .single();
          if (error) {
            if (error.code === "23505" && attempt < 5) continue;
            throw error;
          }
          storefrontId = data.id as string;
          resolvedSlug = candidate;
        }
      }


      // 3. Catalog items.
      const items = input.items
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.name.trim().length > 0);

      if (items.length) {
        const { data: existingProducts, error: productReadError } = await supabase
          .from("merchant_products")
          .select("name")
          .eq("storefront_id", storefrontId);
        if (productReadError) throw productReadError;

        const taken = new Set((existingProducts ?? []).map((p) => (p.name as string).toLowerCase()));
        const rows = items
          .filter((item) => !taken.has(item.name.trim().toLowerCase()))
          .map((item) => ({
            merchant_id: merchantId as string,
            storefront_id: storefrontId as string,
            name: item.name.trim(),
            price_cents: Math.max(0, Math.round((Number(item.price) || 0) * 100)),
            display_order: item.index,
          }));

        if (rows.length) {
          const { error } = await supabase.from("merchant_products").insert(rows);
          if (error) throw error;
        }
      }

      return { merchantId: merchantId as string, storefrontId: storefrontId as string, slug };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
