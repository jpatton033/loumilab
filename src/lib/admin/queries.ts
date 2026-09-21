import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const count = async (table: "contact_submissions" | "kc_articles" | "newsletter_subscribers" | "hero_products", build?: (q: any) => any) => {
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
};

export interface AdminCounts {
  inquiriesTotal: number;
  inquiriesNew: number;
  articlesPublished: number;
  articlesDraft: number;
  subscribers: number;
  heroActive: number;
  articleViews: number;
  /** Merchants whose storefront is published and accepting orders. */
  merchantsLive: number;
  /** Every merchant account that has been created. */
  merchantsTotal: number;
  /** Merchants signed up in the trailing 30 days. */
  merchantsNew30: number;
  /** Merchants signed up in the 30 days before that, for movement. */
  merchantsNewPrevious30: number;
  /** Signed up but not yet live (unpublished store or not accepting orders). */
  merchantsSettingUp: number;
}

export const MERCHANT_WINDOW_DAYS = 30;

/**
 * Live merchant definition used everywhere in the admin portal and in the
 * Daily Brief: a merchant with at least one published storefront that is
 * currently accepting orders. Keep this in sync with the brief's merchants
 * collector (supabase/functions/_shared/ops-brief/collectors/merchants.ts).
 */
export const useAdminCounts = () =>
  useQuery({
    queryKey: ["admin", "counts"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AdminCounts> => {
      const [inquiriesTotal, inquiriesNew, articlesPublished, articlesDraft, subscribers, heroActive] =
        await Promise.all([
          count("contact_submissions"),
          count("contact_submissions", (q) => q.eq("status", "new")),
          count("kc_articles", (q) => q.eq("status", "published")),
          count("kc_articles", (q) => q.eq("status", "draft")),
          count("newsletter_subscribers"),
          count("hero_products", (q) => q.eq("is_active", true)),
        ]);

      const [viewsRes, merchantsRes, storefrontsRes] = await Promise.all([
        supabase.from("kc_articles").select("view_count"),
        supabase.from("merchants").select("id, accepting_orders, created_at"),
        supabase.from("merchant_storefronts").select("merchant_id, is_published"),
      ]);
      if (viewsRes.error) throw viewsRes.error;
      if (merchantsRes.error) throw merchantsRes.error;
      if (storefrontsRes.error) throw storefrontsRes.error;

      const articleViews = (viewsRes.data ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0);

      const merchants = merchantsRes.data ?? [];
      const publishedMerchantIds = new Set(
        (storefrontsRes.data ?? []).filter((s) => s.is_published).map((s) => s.merchant_id),
      );

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const windowStart = now - MERCHANT_WINDOW_DAYS * dayMs;
      const previousStart = now - 2 * MERCHANT_WINDOW_DAYS * dayMs;

      const merchantsLive = merchants.filter(
        (m) => m.accepting_orders && publishedMerchantIds.has(m.id),
      ).length;
      const merchantsNew30 = merchants.filter((m) => new Date(m.created_at).getTime() >= windowStart).length;
      const merchantsNewPrevious30 = merchants.filter((m) => {
        const t = new Date(m.created_at).getTime();
        return t >= previousStart && t < windowStart;
      }).length;

      return {
        inquiriesTotal,
        inquiriesNew,
        articlesPublished,
        articlesDraft,
        subscribers,
        heroActive,
        articleViews,
        merchantsLive,
        merchantsTotal: merchants.length,
        merchantsNew30,
        merchantsNewPrevious30,
        merchantsSettingUp: merchants.length - merchantsLive,
      };
    },
  });

export interface RecentInquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  created_at: string;
}

export const useRecentInquiries = (limit = 6) =>
  useQuery({
    queryKey: ["admin", "recent-inquiries", limit],
    queryFn: async (): Promise<RecentInquiry[]> => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, company, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RecentInquiry[];
    },
  });

export interface RecentArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  updated_at: string;
}

export const useRecentArticles = (limit = 6) =>
  useQuery({
    queryKey: ["admin", "recent-articles", limit],
    queryFn: async (): Promise<RecentArticle[]> => {
      const { data, error } = await supabase
        .from("kc_articles")
        .select("id, title, slug, status, view_count, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RecentArticle[];
    },
  });

export interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

export const useSubscribers = () =>
  useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async (): Promise<Subscriber[]> => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, source, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Subscriber[];
    },
  });
