import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadKcMedia, useAdminSections, useTags } from "@/lib/kc/queries";
import { estimateReadMinutes, slugify, type KcArticleWithRelations, type KcStatus } from "@/lib/kc/types";
import { ArrowLeft, ExternalLink, Trash2, Upload } from "lucide-react";

const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: sections = [] } = useAdminSections();
  const { data: allTags = [] } = useTags();

  const { data: article, isLoading } = useQuery({
    queryKey: ["kc", "admin", "article", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kc_articles")
        .select("*, kc_sections(slug, title), kc_article_tags(kc_tags(id, slug, name)), kc_attachments(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as KcArticleWithRelations | null;
    },
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    section_id: "",
    summary: "",
    body: "",
    author: "",
    hero_image_url: "",
    seo_title: "",
    seo_description: "",
    document_url: "",
    related_link_label: "",
    related_link_href: "",
    is_featured: false,
    status: "draft" as KcStatus,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!article) return;
    setForm({
      title: article.title,
      slug: article.slug,
      section_id: article.section_id,
      summary: article.summary ?? "",
      body: article.body,
      author: article.author ?? "",
      hero_image_url: article.hero_image_url ?? "",
      seo_title: article.seo_title ?? "",
      seo_description: article.seo_description ?? "",
      document_url: article.document_url ?? "",
      related_link_label: article.related_link_label ?? "",
      related_link_href: article.related_link_href ?? "",
      is_featured: article.is_featured,
      status: article.status,
    });
    setSelectedTags((article.kc_article_tags ?? []).map((t) => t.kc_tags?.id).filter(Boolean) as string[]);
  }, [article]);

  const save = async (statusOverride?: KcStatus) => {
    if (!id) return;
    const status = statusOverride ?? form.status;
    if (!form.title.trim() || !form.section_id) {
      toast({ title: "Title and section are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = slugify(form.slug || form.title);
    const { error } = await supabase
      .from("kc_articles")
      .update({
        title: form.title.trim(),
        slug,
        section_id: form.section_id,
        summary: form.summary.trim() || null,
        body: form.body,
        author: form.author.trim() || null,
        hero_image_url: form.hero_image_url.trim() || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        document_url: form.document_url.trim() || null,
        related_link_label: form.related_link_label.trim() || null,
        related_link_href: form.related_link_href.trim() || null,
        is_featured: form.is_featured,
        read_minutes: estimateReadMinutes(form.body),
        status,
        published_at:
          status === "published" ? article?.published_at ?? new Date().toISOString() : article?.published_at ?? null,
      })
      .eq("id", id);

    if (error) {
      setSaving(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("kc_article_tags").delete().eq("article_id", id);
    if (selectedTags.length > 0) {
      await supabase.from("kc_article_tags").insert(selectedTags.map((tag_id) => ({ article_id: id, tag_id })));
    }

    setForm((f) => ({ ...f, status, slug }));
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["kc"] });
    toast({ title: status === "published" ? "Published" : "Saved" });
  };

  const handleUpload = async (file: File, target: "hero" | "attachment") => {
    setUploading(true);
    try {
      const url = await uploadKcMedia(file, target === "hero" ? "hero" : "files");
      if (target === "hero") {
        setForm((f) => ({ ...f, hero_image_url: url }));
      } else if (id) {
        const { error } = await supabase.from("kc_attachments").insert({
          article_id: id,
          label: file.name,
          file_url: url,
          file_type: file.type || null,
          sort_order: (article?.kc_attachments?.length ?? 0) + 1,
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["kc", "admin", "article", id] });
      }
      toast({ title: "Upload complete" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    const { error } = await supabase.from("kc_attachments").delete().eq("id", attachmentId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["kc", "admin", "article", id] });
  };

  if (isLoading) {
    return (
      <AdminShell title="Article Editor" description="Write and publish Knowledge Center articles.">
        <div className="py-10 text-muted-foreground">Loading article…</div>
      </AdminShell>
    );
  }

  if (!article) {
    return (
      <AdminShell title="Article Editor" description="Write and publish Knowledge Center articles.">
        <div className="py-10">
          <p className="text-muted-foreground">Article not found.</p>
          <Button className="mt-6" onClick={() => navigate("/admin/knowledge")}>
            Back to Knowledge Center
          </Button>
        </div>
      </AdminShell>
    );
  }

  const sectionSlug = sections.find((s) => s.id === form.section_id)?.slug ?? "";

  return (
    <AdminShell title="Article Editor" description="Write and publish Knowledge Center articles.">
      <SEOHead title="Edit article | Loumilab" description="Knowledge Center article editor." path="/admin/knowledge" noindex />
      <section>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/admin/knowledge" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
              <ArrowLeft size={15} /> Knowledge Center
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {sectionSlug && (
                <Button variant="ghost" asChild>
                  <Link to={`/resources/${sectionSlug}/${form.slug}`} target="_blank">
                    Preview <ExternalLink size={15} />
                  </Link>
                </Button>
              )}
              <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
                Save draft
              </Button>
              <Button disabled={saving} onClick={() => save("published")}>
                {saving ? "Saving…" : "Publish"}
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={slugify(form.title)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="body">Body (markdown)</Label>
                <Textarea
                  id="body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={26}
                  className="mt-2 font-mono text-sm"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimated read time: {estimateReadMinutes(form.body)} min. Use ## for section headings — they build
                  the on-page table of contents.
                </p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Label>Section</Label>
                <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-5">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Label htmlFor="featured">Featured</Label>
                  <Switch
                    id="featured"
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <Label>Tags</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allTags.map((t) => {
                    const active = selectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setSelectedTags(active ? selectedTags.filter((x) => x !== t.id) : [...selectedTags, t.id])
                        }
                        className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                          active ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <Label>Hero image</Label>
                {form.hero_image_url && (
                  <img
                    src={form.hero_image_url}
                    alt="Hero preview"
                    className="mt-3 aspect-video w-full rounded-xl border border-border object-cover"
                  />
                )}
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-accent/50">
                  <Upload size={15} /> {uploading ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "hero")}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <Label>Attachments</Label>
                <div className="mt-3 space-y-2">
                  {(article.kc_attachments ?? []).map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-xs">
                      <span className="truncate">{f.label}</span>
                      <button type="button" onClick={() => removeAttachment(f.id)} aria-label="Remove attachment">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-accent/50">
                  <Upload size={15} /> Upload file
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "attachment")}
                  />
                </label>
                <div className="mt-5">
                  <Label htmlFor="document_url">Document app link</Label>
                  <Input
                    id="document_url"
                    value={form.document_url}
                    onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                    placeholder="https://…"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <Label>Related Loumilab link</Label>
                <Input
                  value={form.related_link_label}
                  onChange={(e) => setForm({ ...form, related_link_label: e.target.value })}
                  placeholder="Label"
                  className="mt-2"
                />
                <Input
                  value={form.related_link_href}
                  onChange={(e) => setForm({ ...form, related_link_href: e.target.value })}
                  placeholder="/orders"
                  className="mt-2"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <Label htmlFor="seo_title">SEO title</Label>
                <Input
                  id="seo_title"
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className="mt-2"
                />
                <div className="mt-4">
                  <Label htmlFor="seo_description">SEO description</Label>
                  <Textarea
                    id="seo_description"
                    value={form.seo_description}
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </AdminShell>
  );
};

export default ArticleEditor;
