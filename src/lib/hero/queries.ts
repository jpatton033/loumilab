import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HeroTreatment = "orders-devices" | "vurtti-dashboard" | "browser-stack" | "app-panels";
export type HeroLayout = "split" | "centered";

export interface HeroProduct {
  id: string;
  slug: string;
  name: string;
  nav_label: string;
  eyebrow: string;
  headline: string;
  description: string;
  category: string | null;
  attribution: string | null;
  logo_text: string | null;
  accent_hsl: string;
  treatment: string;
  layout: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  media_video_url: string | null;
  cta_primary_label: string | null;
  cta_primary_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
}

const SELECT =
  "id, slug, name, nav_label, eyebrow, headline, description, category, attribution, logo_text, accent_hsl, treatment, layout, desktop_image_url, mobile_image_url, media_video_url, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, display_order, is_active, is_featured";

/** Active + featured products for the public homepage showcase. */
export const useHeroProducts = () =>
  useQuery({
    queryKey: ["hero", "products", "public"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HeroProduct[]> => {
      const { data, error } = await supabase
        .from("hero_products")
        .select(SELECT)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroProduct[];
    },
  });

/** Every product, including inactive ones — admin only (RLS enforced). */
export const useAdminHeroProducts = () =>
  useQuery({
    queryKey: ["hero", "products", "admin"],
    queryFn: async (): Promise<HeroProduct[]> => {
      const { data, error } = await supabase
        .from("hero_products")
        .select(SELECT)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroProduct[];
    },
  });

export const uploadHeroMedia = async (file: File) => {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `hero-showcase/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kc-media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("kc-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError) throw signError;
  return data.signedUrl;
};

export const heroSlugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
