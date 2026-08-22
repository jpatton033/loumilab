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
}

export const useAdminCounts = () =>
  useQuery({
    queryKey: ["admin", "counts"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AdminCounts> => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [inquiriesTotal, inquiriesNew, articlesPublished, articlesDraft, subscribers, heroActive] =
        await Promise.all([
          count("contact_submissions"),
          count("contact_submissions", (q) => q.eq("status", "new")),
          count("kc_articles", (q) => q.eq("status", "published")),
          count("kc_articles", (q) => q.eq("status", "draft")),
          count("newsletter_subscribers"),
          count("hero_products", (q) => q.eq("is_active", true)),
        ]);

      const { data: views, error } = await supabase.from("kc_articles").select("view_count");
      if (error) throw error;
      const articleViews = (views ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0);

      return {
        inquiriesTotal,
        inquiriesNew,
        articlesPublished,
        articlesDraft,
        subscribers,
        heroActive,
        articleViews,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...({} as Record<string, never>),
      } as AdminCounts & { weekAgo?: string };
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
