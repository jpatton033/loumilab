import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { uploadKcMedia } from "@/lib/kc/queries";
import { slugify } from "@/lib/kc/types";
import { issueMonthLabel, useAdminIssues, type DotIssue } from "@/lib/thedot/queries";
import { ArrowLeft, ExternalLink, Plus, Trash2, Upload } from "lucide-react";

type Story = { title: string; body: string };
type LinkRow = { label: string; href: string };

interface IssueForm {
  issue_number: string;
  slug: string;
  title: string;
  subtitle: string;
  issue_month: string;
  editors_note: string;
  story_title: string;
  story_body: string;
  short_stories: Story[];
  resource_links: LinkRow[];
  product_update: string;
  closing_thought: string;
  cover_image_url: string;
  status: "draft" | "published";
}

const blankForm = (nextNumber: number): IssueForm => ({
  issue_number: String(nextNumber),
  slug: "",
  title: "",
  subtitle: "",
  issue_month: "",
  editors_note: "",
  story_title: "",
  story_body: "",
  short_stories: [],
  resource_links: [],
  product_update: "",
  closing_thought: "",
  cover_image_url: "",
  status: "draft",
});

const toForm = (issue: DotIssue): IssueForm => ({
  issue_number: String(issue.issue_number),
  slug: issue.slug,
  title: issue.title,
  subtitle: issue.subtitle ?? "",
  issue_month: issue.issue_month ?? "",
  editors_note: issue.editors_note ?? "",
  story_title: issue.story_title ?? "",
  story_body: issue.story_body ?? "",
  short_stories: issue.short_stories ?? [],
  resource_links: issue.resource_links ?? [],
  product_update: issue.product_update ?? "",
  closing_thought: issue.closing_thought ?? "",
  cover_image_url: issue.cover_image_url ?? "",
  status: issue.status,
});

const TheDotEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: issues = [] } = useAdminIssues();

  const existing = useMemo(() => issues.find((i) => i.id === id), [issues, id]);

  const [form, setForm] = useState<IssueForm>(blankForm(1));
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) {
      const next = issues.reduce((max, i) => Math.max(max, i.issue_number), 0) + 1;
      setForm(blankForm(next));
      setReady(true);
      return;
    }
    if (existing) {
      setForm(toForm(existing));
      setReady(true);
    }
  }, [isNew, existing, issues]);

  const set = <K extends keyof IssueForm>(key: K, value: IssueForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (statusOverride?: "draft" | "published") => {
    const status = statusOverride ?? form.status;
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const number = Number.parseInt(form.issue_number, 10);
    if (!Number.isFinite(number) || number < 1) {
      toast({ title: "Issue number must be 1 or higher", variant: "destructive" });
      return;
    }
    const slug = slugify(form.slug || form.title);
    if (!slug) {
      toast({ title: "Slug is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const cleanStories = form.short_stories
      .filter((s) => s.title.trim() || s.body.trim())
      .map((s) => ({ title: s.title.trim(), body: s.body.trim() }));
    const cleanLinks = form.resource_links
      .filter((l) => l.label.trim() && l.href.trim())
      .map((l) => ({ label: l.label.trim(), href: l.href.trim() }));

    const payload = {
      issue_number: number,
      slug,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      issue_month: form.issue_month.trim() || null,
      editors_note: form.editors_note.trim() || null,
      story_title: form.story_title.trim() || null,
      story_body: form.story_body.trim() || null,
      short_stories: cleanStories,
      resource_links: cleanLinks,
      product_update: form.product_update.trim() || null,
      closing_thought: form.closing_thought.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      status,
      published_at:
        status === "published" ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
    };

    const { error, data } = isNew
      ? await supabase.from("dot_issues").insert(payload).select("id").single()
      : await supabase.from("dot_issues").update(payload).eq("id", id!).select("id").single();

    if (error) {
      setSaving(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    setForm((f) => ({ ...f, status, slug }));
    toast({ title: status === "published" ? "Published" : "Saved" });

    // Automatic email to all active subscribers, once per issue.
    const issueId = data?.id ?? id;
    if (status === "published" && issueId && !existing?.emailed_at) {
      const { data: blast, error: blastErr } = await supabase.functions.invoke("dot-issue-blast", {
        body: { issue_id: issueId },
      });
      if (blastErr) {
        const details = blastErr instanceof FunctionsHttpError ? await blastErr.context.text() : blastErr.message;
        toast({ title: "Published, but the email didn't send", description: details.slice(0, 240), variant: "destructive" });
      } else if (blast?.sent !== undefined) {
        toast({ title: `Emailed to ${blast.sent} subscriber${blast.sent === 1 ? "" : "s"}` });
      }
    }

    setSaving(false);
    qc.invalidateQueries({ queryKey: ["dot"] });
    if (isNew && data?.id) navigate(`/admin/the-dot/${data.id}`, { replace: true });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadKcMedia(file, "hero");
      set("cover_image_url", url);
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

  if (!ready) {
    return (
      <AdminShell title="Issue Editor" description="Write an issue of The Dot.">
        <div className="py-10 text-muted-foreground">Loading issue…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Issue Editor" description="Write an issue of The Dot. — A Loumilab Brief.">
      <SEOHead title="The Dot. editor | Loumilab" description="Editorial issue editor." path="/admin/the-dot" noindex />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin/the-dot" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft size={15} /> The Dot.
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {form.slug && (
            <Button variant="ghost" asChild>
              <Link to={`/the-dot/issue/${form.slug}`} target="_blank">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="issue_number">Issue number</Label>
              <Input
                id="issue_number"
                type="number"
                min={1}
                value={form.issue_number}
                onChange={(e) => set("issue_number", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="issue_month">Month label</Label>
              <Input
                id="issue_month"
                value={form.issue_month}
                onChange={(e) => set("issue_month", e.target.value)}
                placeholder="OCTOBER 2026"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">Blank uses today's month.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder={slugify(form.title)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">Reads at /the-dot/issue/{form.slug || slugify(form.title) || "…"}</p>
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea id="subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} rows={2} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="editors_note">Editor's note</Label>
            <Textarea id="editors_note" value={form.editors_note} onChange={(e) => set("editors_note", e.target.value)} rows={4} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="story_title">Main story title</Label>
            <Input id="story_title" value={form.story_title} onChange={(e) => set("story_title", e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="story_body">Main story</Label>
            <Textarea
              id="story_body"
              value={form.story_body}
              onChange={(e) => set("story_body", e.target.value)}
              rows={12}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">Separate paragraphs with a blank line.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <Label>Short stories</Label>
              <Button variant="ghost" size="sm" onClick={() => set("short_stories", [...form.short_stories, { title: "", body: "" }])}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div className="mt-3 space-y-4">
              {form.short_stories.map((story, i) => (
                <div key={i} className="rounded-xl bg-secondary p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Story {i + 1}</span>
                    <button
                      type="button"
                      aria-label="Remove story"
                      onClick={() => set("short_stories", form.short_stories.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input
                    value={story.title}
                    placeholder="Story title"
                    className="mt-2"
                    onChange={(e) => {
                      const next = [...form.short_stories];
                      next[i] = { ...next[i], title: e.target.value };
                      set("short_stories", next);
                    }}
                  />
                  <Textarea
                    value={story.body}
                    placeholder="What it says"
                    rows={3}
                    className="mt-2"
                    onChange={(e) => {
                      const next = [...form.short_stories];
                      next[i] = { ...next[i], body: e.target.value };
                      set("short_stories", next);
                    }}
                  />
                </div>
              ))}
              {form.short_stories.length === 0 && <p className="text-sm text-muted-foreground">No short stories yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <Label>Resource links</Label>
              <Button variant="ghost" size="sm" onClick={() => set("resource_links", [...form.resource_links, { label: "", href: "" }])}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {form.resource_links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) => {
                      const next = [...form.resource_links];
                      next[i] = { ...next[i], label: e.target.value };
                      set("resource_links", next);
                    }}
                  />
                  <Input
                    value={link.href}
                    placeholder="/resources/topic/slug"
                    onChange={(e) => {
                      const next = [...form.resource_links];
                      next[i] = { ...next[i], href: e.target.value };
                      set("resource_links", next);
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove link"
                    onClick={() => set("resource_links", form.resource_links.filter((_, j) => j !== i))}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {form.resource_links.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="product_update">From Loumilab (product update)</Label>
            <Textarea id="product_update" value={form.product_update} onChange={(e) => set("product_update", e.target.value)} rows={3} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="closing_thought">Closing thought</Label>
            <Textarea id="closing_thought" value={form.closing_thought} onChange={(e) => set("closing_thought", e.target.value)} rows={3} className="mt-2" />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as "draft" | "published")}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Only published issues appear in the archive. Drafts preview for admins only.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <Label>Cover image</Label>
            {form.cover_image_url && (
              <img
                src={form.cover_image_url}
                alt="Cover preview"
                className="mt-3 aspect-video w-full rounded-xl border border-border object-cover"
              />
            )}
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-accent/50">
              <Upload size={15} /> {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <Label>Reads as</Label>
            <p className="mt-2 text-xs text-muted-foreground">
              Kicker: <span className="text-foreground">Issue {form.issue_number} · {issueMonthLabel(form.issue_month, null)}</span>
            </p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
};

export default TheDotEditor;
