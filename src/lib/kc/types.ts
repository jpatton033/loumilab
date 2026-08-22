export type KcStatus = "draft" | "published" | "archived";

export interface KcSection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface KcTag {
  id: string;
  slug: string;
  name: string;
}

export interface KcAttachment {
  id: string;
  article_id: string;
  label: string;
  file_url: string;
  file_type: string | null;
  sort_order: number;
}

export interface KcArticle {
  id: string;
  section_id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  hero_image_url: string | null;
  author: string | null;
  read_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean;
  status: KcStatus;
  published_at: string | null;
  view_count: number;
  document_url: string | null;
  related_link_label: string | null;
  related_link_href: string | null;
  created_at: string;
  updated_at: string;
}

export interface KcArticleWithRelations extends KcArticle {
  kc_sections?: Pick<KcSection, "slug" | "title"> | null;
  kc_article_tags?: { kc_tags: KcTag | null }[] | null;
  kc_attachments?: KcAttachment[] | null;
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const estimateReadMinutes = (body: string) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 220));
