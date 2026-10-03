import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import audFood from "@/assets/orders/aud-food.jpg";
import audPopup from "@/assets/orders/aud-popup.jpg";
import audLocal from "@/assets/orders/aud-local.jpg";
import audSide from "@/assets/orders/aud-side.jpg";
import dishAlfredo from "@/assets/orders/dish-alfredo.jpg";
import dishMac from "@/assets/orders/dish-mac.jpg";
import dishWings from "@/assets/orders/dish-wings.jpg";

/**
 * Loumilab Local — free discovery listings. A listing may stand alone or sit on top of an Orders storefront.
 * Listing data lives in `merchant_local_profiles`; everything else is read from
 * the store itself through the public `search_local_businesses` RPC, which only
 * returns safe fields (never a street address).
 */

export const LOCAL_CATEGORIES = [
  { id: "home-chef", label: "Home chefs", image: audFood },
  { id: "bakery", label: "Bakers", image: audLocal },
  { id: "meal-prep", label: "Meal prep", image: dishAlfredo },
  { id: "catering", label: "Caterers", image: audSide },
  { id: "food-truck", label: "Food trucks", image: dishWings },
  { id: "pop-up", label: "Pop-ups", image: audPopup },
  { id: "desserts", label: "Desserts", image: audLocal },
  { id: "specialty", label: "Specialty foods", image: dishMac },
  { id: "plate-sales", label: "Plate sales", image: dishMac },
] as const;

export const categoryLabel = (id?: string | null) =>
  LOCAL_CATEGORIES.find((c) => c.id === id)?.label ?? null;

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

export interface LocalBusiness {
  slug: string;
  /** Orders storefront slug — null for Local-only businesses. */
  store_slug: string | null;
  name: string;
  logo_url: string | null;
  image_url: string | null;
  description: string | null;
  category: string | null;
  cuisines: string[] | null;
  area: string | null;
  pickup: boolean;
  delivery: boolean;
  accepting: boolean;
  is_featured: boolean;
  distance_miles: number | null;
  ownership_status?: "claimed" | "unclaimed";
}

export interface LocalSearch {
  q?: string;
  place?: string;
  radius?: number;
  category?: string;
  pickup?: boolean;
  delivery?: boolean;
  accepting?: boolean;
}

const runSearch = async (s: LocalSearch & { featuredOnly?: boolean; limit?: number }) => {
  const { data, error } = await supabase.rpc("search_local_businesses" as never, {
    _q: s.q?.trim() || null,
    _place: s.place?.trim() || null,
    _radius_miles: s.radius ?? 25,
    _category: s.category || null,
    _pickup: !!s.pickup,
    _delivery: !!s.delivery,
    _accepting: !!s.accepting,
    _featured_only: !!s.featuredOnly,
    _limit: s.limit ?? 48,
  } as never);
  if (error) throw error;
  return (data ?? []) as unknown as LocalBusiness[];
};

export const useLocalSearch = (s: LocalSearch) =>
  useQuery({ queryKey: ["local-search", s], queryFn: () => runSearch(s), staleTime: 30_000 });

export const useLocalFeatured = () =>
  useQuery({ queryKey: ["local-featured"], queryFn: () => runSearch({ featuredOnly: true, limit: 6 }), staleTime: 60_000 });

export interface LocalProfile {
  merchant_id: string;
  is_listed: boolean;
  category: string | null;
  cuisines: string[];
  tagline: string | null;
  service_area_label: string | null;
  featured_image_url: string | null;
  postal_code: string | null;
  slug?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  gallery_urls?: string[];
  offers_pickup?: boolean | null;
  offers_delivery?: boolean | null;
  website_url?: string | null;
  social_links?: Partial<Record<SocialKey, string>>;
  public_phone?: string | null;
  public_email?: string | null;
  city?: string | null;
  region?: string | null;
}

export const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "x"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export const SOCIAL_LABELS: Record<SocialKey, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", x: "X" };

export interface LocalBusinessDetail extends LocalBusiness {
  gallery_urls: string[];
  website_url: string | null;
  social_links: Partial<Record<SocialKey, string>>;
  public_phone: string | null;
  public_email: string | null;
  last_checked_at?: string | null;
  hours_text?: string | null;
}

export const useLocalBusiness = (slug?: string) =>
  useQuery({
    queryKey: ["local-business", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_local_business" as never, { _slug: slug } as never);
      if (error) throw error;
      const row = ((data ?? []) as unknown as LocalBusinessDetail[])[0];
      return row ? { ...row, is_featured: false, distance_miles: null } : null;
    },
  });

/** Creates a Local-only merchant account (no store, no plan, no payments). */
export const useCreateLocalMerchant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { businessName: string; email: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in first.");
      const { data, error } = await supabase
        .from("merchants")
        .insert({ owner_id: u.user.id, business_name: input.businessName.trim(), contact_email: input.email.trim(), plan_slug: "launch", accepting_orders: false } as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my-merchant"] }),
  });
};

const table = () => supabase.from("merchant_local_profiles" as never) as any;

export const useLocalProfile = (merchantId?: string | null) =>
  useQuery({
    queryKey: ["local-profile", merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data, error } = await table().select("*").eq("merchant_id", merchantId).maybeSingle();
      if (error) throw error;
      return (data ?? null) as LocalProfile | null;
    },
  });

export const useSaveLocalProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: LocalProfile) => {
      const { error } = await table().upsert(p, { onConflict: "merchant_id" });
      if (error) throw error;
    },
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ["local-profile", p.merchant_id] });
      qc.invalidateQueries({ queryKey: ["local-search"] });
      qc.invalidateQueries({ queryKey: ["local-business"] });
    },
  });
};

/** Staff-only: featured flag is protected by a database trigger. */
export const useSetLocalFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ merchantId, featured, rank }: { merchantId: string; featured: boolean; rank?: number }) => {
      const { error } = await table()
        .upsert({ merchant_id: merchantId, is_featured: featured, featured_rank: rank ?? 0 }, { onConflict: "merchant_id" });
      if (error) throw error;
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        action: "local.featured_updated",
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        target_id: merchantId,
        new_value: { featured, rank: rank ?? 0 },
      } as never);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-featured"] });
      qc.invalidateQueries({ queryKey: ["local-admin"] });
    },
  });
};

export const useLocalAdminFlags = () =>
  useQuery({
    queryKey: ["local-admin"],
    queryFn: async () => {
      const { data, error } = await table().select("merchant_id,is_listed,is_featured,featured_rank");
      if (error) throw error;
      return new Map(
        ((data ?? []) as { merchant_id: string; is_listed: boolean; is_featured: boolean; featured_rank: number }[]).map(
          (r) => [r.merchant_id, r],
        ),
      );
    },
  });
