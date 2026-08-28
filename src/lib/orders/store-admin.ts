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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useUpdateStorefront = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<LiveStorefront>) => {
      const { error } = await supabase.from("merchant_storefronts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),

  });
};

export interface ProductInput {
  name: string;
  description?: string;
  /** Zero means "priced per job" — service industries quote individually. */
  price_cents: number;
  category?: string;
  image_url?: string | null;
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "my-products", storefrontId] });
      qc.invalidateQueries({ queryKey: ["orders", "setup"] });
    },
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

export interface OnboardingItem {
  name: string;
  price: string;
  description?: string;
  imageUrl?: string | null;
}

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
  logoUrl?: string | null;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  deliveryFee?: string;
  deliveryMinimum?: string;
  items: OnboardingItem[];
}

export interface OnboardingResult {
  merchantId: string;
  storefrontId: string;
  slug: string;
  /** True when this call registered the merchant account for the first time. */
  registered: boolean;
}

const monogramFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "LO";

const toCents = (value?: string) => Math.max(0, Math.round((Number(value) || 0) * 100));

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
 * Saves onboarding progress: the merchant account, the storefront and the
 * catalog. Safe to call repeatedly — records are created once and then updated.
 *
 * The storefront stays private (status `setup`/`ready`) until the merchant
 * chooses to publish it; the database enforces the same rule.
 */
export const useSaveStoreSetup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OnboardingInput): Promise<OnboardingResult> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Please sign in to save your store.");

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
      let registered = false;
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
        registered = true;
      }

      // Welcome email — best effort, never blocks onboarding.
      if (registered) {
        supabase.functions.invoke("orders-merchant-welcome").catch(() => undefined);
      }

      // 2. Storefront — private until the merchant publishes it.
      const { data: existingStore, error: storeReadError } = await supabase
        .from("merchant_storefronts")
        .select("id, slug")
        .eq("merchant_id", merchantId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (storeReadError) throw storeReadError;

      const slug = await uniqueSlug(input.slug, existingStore?.id as string | undefined);
      // Blank wizard fields must never wipe details the merchant already saved,
      // so empty values are simply left out of the update.
      const trimmed = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

      const storePayload = {
        name: input.businessName.trim(),
        monogram: monogramFor(input.businessName),
        location: trimmed(input.location),
        description: trimmed(input.description),
        hours: trimmed(input.hours),
        pickup_info: trimmed(input.pickupInfo),
        logo_url: input.logoUrl || undefined,
        pickup_enabled: input.pickupEnabled,
        delivery_enabled: input.deliveryEnabled,
        delivery_fee_cents: input.deliveryFee?.trim() ? toCents(input.deliveryFee) : undefined,
        delivery_minimum_cents: input.deliveryMinimum?.trim() ? toCents(input.deliveryMinimum) : undefined,
      };

      


      let resolvedSlug = existingStore?.slug as string | undefined;
      let storefrontId = existingStore?.id as string | undefined;
      if (storefrontId) {
        const { error } = await supabase
          .from("merchant_storefronts")
          .update(storePayload)
          .eq("id", storefrontId);
        if (error) throw error;
      } else {
        // Other merchants' private stores aren't readable, so a slug clash can only
        // surface as a unique violation on insert. Retry with a numeric suffix.
        for (let attempt = 0; attempt < 6 && !storefrontId; attempt++) {
          const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`.slice(0, 48);
          const { data, error } = await supabase
            .from("merchant_storefronts")
            .insert({ ...storePayload, slug: candidate, merchant_id: merchantId, status: "setup" })
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

      // 3. Catalog items — created once, then kept in step with the wizard.
      const items = input.items
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.name.trim().length > 0);

      if (items.length && storefrontId) {
        const { data: existingProducts, error: productReadError } = await supabase
          .from("merchant_products")
          .select("id, name")
          .eq("storefront_id", storefrontId);
        if (productReadError) throw productReadError;

        const byName = new Map(
          (existingProducts ?? []).map((p) => [(p.name as string).toLowerCase(), p.id as string]),
        );

        const inserts: {
          name: string;
          description: string | null;
          price_cents: number;
          image_url: string | null;
          display_order: number;
          merchant_id: string;
          storefront_id: string;
        }[] = [];

        for (const item of items) {
          const payload = {
            name: item.name.trim(),
            description: item.description?.trim() || null,
            price_cents: toCents(item.price),
            image_url: item.imageUrl ?? null,
            display_order: item.index,
          };
          const existingId = byName.get(payload.name.toLowerCase());
          if (existingId) {
            const { error } = await supabase.from("merchant_products").update(payload).eq("id", existingId);
            if (error) throw error;
          } else {
            inserts.push({ ...payload, merchant_id: merchantId, storefront_id: storefrontId });
          }
        }

        if (inserts.length) {
          const { error } = await supabase.from("merchant_products").insert(inserts);
          if (error) throw error;
        }
      }

      return {
        merchantId: merchantId as string,
        storefrontId: storefrontId as string,
        slug: (resolvedSlug ?? slug) as string,
        registered,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};


/* ------------------------------ wizard prefill ---------------------------- */

export interface OnboardingPrefill {
  industrySlug: string;
  purchaseModels: string[];
  planSlug: string | null;
  businessName: string;
  category: string;
  location: string;
  description: string;
  logoUrl: string | null;
  hours: string;
  pickupInfo: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: string;
  items: OnboardingItem[];
}

/**
 * Everything the merchant already saved, shaped for the onboarding wizard so
 * re-entering the flow shows their real store instead of an empty form.
 */
export const useOnboardingPrefill = () =>
  useQuery({
    queryKey: ["orders", "onboarding-prefill"],
    staleTime: 60_000,
    queryFn: async (): Promise<OnboardingPrefill | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id, business_name, business_type, industry_slug, purchase_models, plan_slug")
        .eq("owner_id", auth.user.id)
        .maybeSingle();
      if (!merchant) return null;

      const { data: store } = await supabase
        .from("merchant_storefronts")
        .select(
          "id, name, location, description, logo_url, hours, pickup_info, pickup_enabled, delivery_enabled, delivery_fee_cents",
        )
        .eq("merchant_id", merchant.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();

      let items: OnboardingItem[] = [];
      if (store?.id) {
        const { data: products } = await supabase
          .from("merchant_products")
          .select("name, description, price_cents, image_url")
          .eq("storefront_id", store.id)
          .order("display_order")
          .limit(12);
        items = (products ?? []).map((p) => ({
          name: p.name as string,
          price: (((p.price_cents as number) ?? 0) / 100).toFixed(2),
          description: (p.description as string | null) ?? undefined,
          imageUrl: (p.image_url as string | null) ?? null,
        }));
      }

      return {
        industrySlug: (merchant.industry_slug as string) ?? "food-catering",
        purchaseModels: ((merchant.purchase_models as string[]) ?? []).filter(Boolean),
        planSlug: (merchant.plan_slug as string) ?? null,
        businessName: (store?.name as string) ?? (merchant.business_name as string) ?? "",
        category: (merchant.business_type as string) ?? "",
        location: (store?.location as string) ?? "",
        description: (store?.description as string) ?? "",
        logoUrl: (store?.logo_url as string | null) ?? null,
        hours: (store?.hours as string) ?? "",
        pickupInfo: (store?.pickup_info as string) ?? "",
        pickupEnabled: store?.pickup_enabled ?? true,
        deliveryEnabled: store?.delivery_enabled ?? false,
        deliveryFee: store?.delivery_fee_cents ? (((store.delivery_fee_cents as number) / 100).toFixed(2)) : "",
        items,
      };
    },
  });
