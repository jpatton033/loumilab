import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DOT_TOPICS = [
  "Business & Growth",
  "Technology & AI",
  "Web & Digital",
  "Security & Privacy",
  "Orders & Commerce",
] as const;

export interface DotShortStory {
  title: string;
  body: string;
}

export interface DotResourceLink {
  label: string;
  href: string;
}

export interface DotIssue {
  id: string;
  issue_number: number;
  slug: string;
  title: string;
  subtitle: string | null;
  issue_month: string | null;
  editors_note: string | null;
  story_title: string | null;
  story_body: string | null;
  short_stories: DotShortStory[] | null;
  resource_links: DotResourceLink[] | null;
  product_update: string | null;
  closing_thought: string | null;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  emailed_at?: string | null;
  emailed_count?: number;
}

const ISSUE_SELECT =
  "id, issue_number, slug, title, subtitle, issue_month, editors_note, story_title, story_body, short_stories, resource_links, product_update, closing_thought, cover_image_url, status, published_at, updated_at";
const ADMIN_ISSUE_SELECT = `${ISSUE_SELECT}, emailed_at, emailed_count`;

const asIssues = (data: unknown) => {
  const rows = (data ?? []) as DotIssue[];
  return rows.map((r) => ({
    ...r,
    short_stories: Array.isArray(r.short_stories) ? r.short_stories : [],
    resource_links: Array.isArray(r.resource_links) ? r.resource_links : [],
  }));
};

export const useLatestIssue = () =>
  useQuery({
    queryKey: ["dot", "latest"],
    queryFn: async (): Promise<DotIssue | null> => {
      const { data, error } = await supabase
        .from("dot_issues")
        .select(ISSUE_SELECT)
        .eq("status", "published")
        .order("issue_number", { ascending: false })
        .limit(1);
      if (error) throw error;
      return asIssues(data)[0] ?? null;
    },
  });

export const usePublishedIssues = (limit = 50) =>
  useQuery({
    queryKey: ["dot", "issues", limit],
    queryFn: async (): Promise<DotIssue[]> => {
      const { data, error } = await supabase
        .from("dot_issues")
        .select(ISSUE_SELECT)
        .eq("status", "published")
        .order("issue_number", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return asIssues(data);
    },
  });

/** Published issues for anyone; drafts resolve too because admins bypass via policy. */
export const useDotIssue = (slug?: string) =>
  useQuery({
    queryKey: ["dot", "issue", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<DotIssue | null> => {
      const { data, error } = await supabase
        .from("dot_issues")
        .select(ISSUE_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return asIssues(data ? [data] : [])[0] ?? null;
    },
  });

export const useAdminIssues = () =>
  useQuery({
    queryKey: ["dot", "admin", "issues"],
    queryFn: async (): Promise<DotIssue[]> => {
      const { data, error } = await supabase
        .from("dot_issues")
        .select(ADMIN_ISSUE_SELECT)
        .order("issue_number", { ascending: false });
      if (error) throw error;
      return asIssues(data);
    },
  });

/* ---------------- subscriber actions ---------------- */

export interface SubscribeResult {
  created?: boolean;
  already?: boolean;
}

export const subscribeToTheDot = async (email: string, source: string): Promise<SubscribeResult> => {
  const { data, error } = await supabase.rpc("newsletter_subscribe", { _email: email, _source: source });
  if (error) throw error;
  return (data ?? {}) as SubscribeResult;
};

export const saveDotInterests = async (email: string, interests: string[]) => {
  const { data, error } = await supabase.rpc("newsletter_set_interests", { _email: email, _interests: interests });
  if (error) throw error;
  return Boolean(data);
};

export const unsubscribeDot = async (token: string) => {
  const { data, error } = await supabase.rpc("newsletter_unsubscribe", { _token: token });
  if (error) throw error;
  return Boolean(data);
};

export const issueMonthLabel = (value: string | null | undefined, fallbackDate?: string | null) => {
  if (value) return value.toUpperCase();
  const from = fallbackDate ? new Date(fallbackDate) : new Date();
  return from.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
};
