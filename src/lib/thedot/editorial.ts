import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const plainToHtml = (text: string | null | undefined) => {
  if (!text?.trim()) return "";
  const blocks = text.trim().split(/\n{2,}/);
  return (blocks.length > 1 ? blocks : text.trim().split(/\n/)).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${escapeText(p).replace(/\n/g, "<br>")}</p>`).join("");
};
export const nonEmptyHtml = (html: string) => /<img\b|<hr\b/i.test(html) || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() ? html.trim() : "";

export interface TemplateContent {
  title?: string;
  subtitle?: string;
  editors_note?: string;
  story_title?: string;
  story_body?: string;
  short_stories?: { title: string; body: string }[];
  resource_links?: { label: string; href: string }[];
  product_update?: string;
  closing_thought?: string;
  cover_image_url?: string;
}
export interface IssueTemplate { id: string; name: string; content: TemplateContent }
export const builtInTemplates: IssueTemplate[] = [
  { id: "blank", name: "Blank issue", content: {} },
  { id: "standard", name: "Standard brief", content: { short_stories: [{ title: "", body: "" }], resource_links: [{ label: "", href: "" }] } },
];
export const useIssueTemplates = () => useQuery({
  queryKey: ["dot", "templates"],
  queryFn: async (): Promise<IssueTemplate[]> => {
    const { data, error } = await supabase.from("dot_issue_templates").select("id,name,content").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({ ...row, content: row.content as TemplateContent }));
  },
});
export const safeResourceUrl = (href: string) => /^https?:\/\//i.test(href) || (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\"));