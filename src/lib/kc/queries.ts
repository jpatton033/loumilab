import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KcArticleWithRelations, KcSection, KcTag } from "./types";

const ARTICLE_LIST_SELECT =
  "id, section_id, slug, title, summary, hero_image_url, author, read_minutes, is_featured, status, published_at, view_count, created_at, updated_at, kc_sections(slug, title), kc_article_tags(kc_tags(id, slug, name))";

const ARTICLE_FULL_SELECT = `*, kc_sections(slug, title), kc_article_tags(kc_tags(id, slug, name)), kc_attachments(id, article_id, label, file_url, file_type, sort_order)`;

/* ---------------- public reads ---------------- */

export const useSections = () =>
  useQuery({
    queryKey: ["kc", "sections"],
    queryFn: async (): Promise<KcSection[]> => {
      const { data, error } = await supabase
        .from("kc_sections")
        .select("id, slug, title, description, icon, sort_order, is_visible")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KcSection[];
    },
  });

export const useSectionCounts = () =>
  useQuery({
    queryKey: ["kc", "section-counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc("kc_section_counts");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((row: { section_slug: string; published_count: number }) => {
        map[row.section_slug] = Number(row.published_count);
      });
      return map;
    },
  });

export const useTags = () =>
  useQuery({
    queryKey: ["kc", "tags"],
    queryFn: async (): Promise<KcTag[]> => {
      const { data, error } = await supabase.from("kc_tags").select("id, slug, name").order("name");
      if (error) throw error;
      return (data ?? []) as KcTag[];
    },
  });

interface ArticleListOptions {
  sectionSlug?: string;
  limit?: number;
  orderBy?: "published_at" | "view_count";
}

export const usePublishedArticles = ({ sectionSlug, limit = 60, orderBy = "published_at" }: ArticleListOptions = {}) =>
  useQuery({
    queryKey: ["kc", "articles", sectionSlug ?? "all", orderBy, limit],
    queryFn: async (): Promise<KcArticleWithRelations[]> => {
      let query = supabase
        .from("kc_articles")
        .select(ARTICLE_LIST_SELECT)
        .eq("status", "published")
        .order(orderBy, { ascending: false, nullsFirst: false })
        .limit(limit);

      if (sectionSlug) {
        const { data: section, error: sectionError } = await supabase
          .from("kc_sections")
          .select("id")
          .eq("slug", sectionSlug)
          .maybeSingle();
        if (sectionError) throw sectionError;
        if (!section) return [];
        query = query.eq("section_id", section.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as KcArticleWithRelations[];
    },
  });

export const useSection = (slug?: string) =>
  useQuery({
    queryKey: ["kc", "section", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<KcSection | null> => {
      const { data, error } = await supabase
        .from("kc_sections")
        .select("id, slug, title, description, icon, sort_order, is_visible")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as KcSection | null;
    },
  });

export const useArticle = (slug?: string) =>
  useQuery({
    queryKey: ["kc", "article", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<KcArticleWithRelations | null> => {
      const { data, error } = await supabase
        .from("kc_articles")
        .select(ARTICLE_FULL_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as KcArticleWithRelations | null;
    },
  });

/* ---------------- mutations / rpc ---------------- */

const VIEWER_KEY = "loumilab_kc_viewer";

const viewerHash = () => {
  try {
    let id = localStorage.getItem(VIEWER_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VIEWER_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

export const recordArticleView = async (slug: string) => {
  await supabase.rpc("kc_increment_view", { _slug: slug, _viewer_hash: viewerHash() });
};

export const subscribeToNewsletter = async (email: string, source = "resources") => {
  const { error } = await supabase.rpc("newsletter_subscribe", { _email: email, _source: source });
  if (error) throw error;
};

/* ---------------- admin reads ---------------- */

export const useAdminArticles = () =>
  useQuery({
    queryKey: ["kc", "admin", "articles"],
    queryFn: async (): Promise<KcArticleWithRelations[]> => {
      const { data, error } = await supabase
        .from("kc_articles")
        .select(ARTICLE_LIST_SELECT)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KcArticleWithRelations[];
    },
  });

export const useAdminSections = () =>
  useQuery({
    queryKey: ["kc", "admin", "sections"],
    queryFn: async (): Promise<KcSection[]> => {
      const { data, error } = await supabase
        .from("kc_sections")
        .select("id, slug, title, description, icon, sort_order, is_visible")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as KcSection[];
    },
  });

export const uploadKcMedia = async (file: File, folder = "media") => {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kc-media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("kc-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError) throw signError;
  return data.signedUrl;
};
