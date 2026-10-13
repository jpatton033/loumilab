import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MailEditor } from "@/components/admin/mail/MailEditor";
import { builtInTemplates, nonEmptyHtml, plainToHtml, safeResourceUrl, useIssueTemplates, type TemplateContent } from "@/lib/thedot/editorial";
import type { Json } from "@/integrations/supabase/types";
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
const richValue = (issue: DotIssue, text: string | null | undefined) => issue.content_format === "html" ? text ?? "" : plainToHtml(text);

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
  editors_note: richValue(issue, issue.editors_note),
  story_title: issue.story_title ?? "",
  story_body: richValue(issue, issue.story_body),
  short_stories: (issue.short_stories ?? []).map((s) => ({ ...s, body: richValue(issue, s.body) })),
  resource_links: issue.resource_links ?? [],
  product_update: richValue(issue, issue.product_update),
  closing_thought: richValue(issue, issue.closing_thought),
  cover_image_url: issue.cover_image_url ?? "",
  status: issue.status,
});

const TheDotEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: issues = [], isLoading, error: loadError } = useAdminIssues();
  const { data: templates = [], error: templateError, isLoading: templatesLoading } = useIssueTemplates();
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get("template") ?? "standard");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const initialized = useRef("");


  const existing = useMemo(() => issues.find((i) => i.id === id), [issues, id]);

  const [form, setForm] = useState<IssueForm>(blankForm(1));
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dirty = savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    if (isLoading || !id || initialized.current === id) return;
    if (isNew) {
      const next = issues.reduce((max, i) => Math.max(max, i.issue_number), 0) + 1;
      const templateId = searchParams.get("template");
      const template = [...builtInTemplates, ...templates].find((t) => t.id === templateId);
      if (templateId && !template && templatesLoading) return;
      const nextForm = { ...blankForm(next), ...(template?.content ?? {}), status: "draft" as const };
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
    } else if (existing) {
      const nextForm = toForm(existing);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
    } else return;
    initialized.current = id;
    setReady(true);
  }, [id, isNew, existing, issues, isLoading, templatesLoading, templates, searchParams]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor && !anchor.target && !anchor.href.startsWith(`${window.location.href}#`) && !window.confirm("Leave without saving your changes?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", click, true); };
  }, [dirty]);

  const templateContent = (): TemplateContent => ({
    title: form.title, subtitle: form.subtitle, editors_note: form.editors_note,
    story_title: form.story_title, story_body: form.story_body,
    short_stories: form.short_stories, resource_links: form.resource_links,
    product_update: form.product_update, closing_thought: form.closing_thought,
    cover_image_url: form.cover_image_url,
  });
  const applyTemplate = () => {
    const template = [...builtInTemplates, ...templates].find((t) => t.id === selectedTemplate);
    if (!template || !window.confirm("Replace this issue’s writing with the selected template?")) return;
    setForm((current) => ({ ...blankForm(Number(current.issue_number)), ...template.content, issue_number: current.issue_number, slug: current.slug, issue_month: current.issue_month, status: current.status }));
  };
  const saveTemplate = async () => {
    const name = window.prompt("Template name:");
    if (!name?.trim()) return;
    if (name.trim().length > 120) { toast({ title: "Use a name of 120 characters or fewer", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("dot_issue_templates").insert({ name: name.trim(), content: templateContent() as Json });
    setSaving(false);
    if (error) toast({ title: "Template not saved", description: error.message, variant: "destructive" });
    else { qc.invalidateQueries({ queryKey: ["dot", "templates"] }); toast({ title: "Template saved" }); }
  };

  const sendTest = async () => {
    if (!existing) return;
    const { data: u } = await supabase.auth.getUser();
    const to = window.prompt("Send a test of this issue to:", u.user?.email ?? "");
    if (!to) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("dot-issue-blast", {
      body: { issue_id: existing.id, test_to: to.trim() },
    });
    setSaving(false);
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      toast({ title: "Test didn't send", description: details.slice(0, 240), variant: "destructive" });
    } else toast({ title: `Test sent to ${data?.to ?? to}`, description: "Uses the last saved version." });
  };

  const set = <K extends keyof IssueForm>(key: K, value: IssueForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (statusOverride?: "draft" | "published", publish = false) => {
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
    if (!isNew && !id) return;
    if (publish && !existing?.emailed_at && !window.confirm("Publish this issue and email all active subscribers?")) return;
    if (form.resource_links.some((l) => l.href.trim() && !safeResourceUrl(l.href.trim()))) {
      toast({ title: "Use an https:// link or a local page path", variant: "destructive" }); return;
    }
    setSaving(true);

    const cleanStories = form.short_stories
      .filter((s) => s.title.trim() || nonEmptyHtml(s.body))
      .map((s) => ({ title: s.title.trim(), body: nonEmptyHtml(s.body) }));
    const cleanLinks = form.resource_links
      .filter((l) => l.label.trim() && l.href.trim())
      .map((l) => ({ label: l.label.trim(), href: l.href.trim() }));

    const payload = {
      issue_number: number,
      slug,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      issue_month: form.issue_month.trim() || null,
      editors_note: nonEmptyHtml(form.editors_note) || null,
      story_title: form.story_title.trim() || null,
      story_body: nonEmptyHtml(form.story_body) || null,
      short_stories: cleanStories,
      resource_links: cleanLinks,
      product_update: nonEmptyHtml(form.product_update) || null,
      closing_thought: nonEmptyHtml(form.closing_thought) || null,
      cover_image_url: form.cover_image_url.trim() || null,
      status,
      content_format: "html",
      published_at:
        status === "published" ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
    };

    const { error, data } = isNew
      ? await supabase.from("dot_issues").insert(payload).select("id").single()
      : await supabase.from("dot_issues").update(payload).eq("id", id ?? "").select("id").single();

    if (error) {
      setSaving(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    const savedForm = { ...form, status, slug };
    setForm(savedForm);
    setSavedSnapshot(JSON.stringify(savedForm));
    toast({ title: status === "published" ? "Published" : "Saved" });

    // Automatic email to all active subscribers, once per issue.
    const issueId = data?.id ?? id;
    if (publish && status === "published" && issueId && !existing?.emailed_at) {
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

  if (loadError || (!isLoading && !isNew && !existing) || templateError) {
    return <AdminShell title="Issue Editor"><p className="py-10 text-destructive">{loadError?.message ?? templateError?.message ?? "Issue not found"}</p><Button asChild variant="outline"><Link to="/admin/the-dot">Back to issues</Link></Button></AdminShell>;
  }
  if (!ready || isLoading) {
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
          <span className="text-sm text-muted-foreground">{saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</span>
          <span className="text-xs text-muted-foreground">
            {existing?.emailed_at
              ? `Emailed ${new Date(existing.emailed_at).toLocaleDateString()}${existing.emailed_count ? ` to ${existing.emailed_count}` : ""}`
              : "Publishing emails all active subscribers"}
          </span>
          {form.slug && (
            <Button variant="ghost" asChild>
              <Link to={`/the-dot/issue/${form.slug}`} target="_blank">
                Preview <ExternalLink size={15} />
              </Link>
            </Button>
          )}
          {existing && (
            <Button variant="ghost" disabled={saving} onClick={sendTest}>
              Send test
            </Button>
          )}
          <Button variant="outline" disabled={saving} onClick={() => save(existing?.status === "published" ? "published" : "draft")}>
            {existing?.status === "published" ? "Save changes" : "Save draft"}
          </Button>
          <Button disabled={saving} onClick={() => save("published", true)}>
            {saving ? "Saving…" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
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
          <details className="border-t border-border pt-5">
            <summary className="mb-3 cursor-pointer font-medium">Editor's note</summary>
            <MailEditor value={form.editors_note} onChange={(html) => set("editors_note", html)} onUploadImage={(file) => uploadKcMedia(file, "the-dot")} placeholder="Editor’s note…" />
          </details>
          <div>
            <Label htmlFor="story_title">Main story title</Label>
            <Input id="story_title" value={form.story_title} onChange={(e) => set("story_title", e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="story_body">Main story</Label>
            <MailEditor value={form.story_body} onChange={(html) => set("story_body", html)} onUploadImage={(file) => uploadKcMedia(file, "the-dot")} placeholder="Write the main story…" />
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <Label>Short stories</Label>
              <Button variant="ghost" size="sm" onClick={() => set("short_stories", [...form.short_stories, { title: "", body: "" }])}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div className="mt-3 space-y-4">
              {form.short_stories.map((story, i) => (
                <div key={i} className="space-y-3 border-b border-border pb-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Story {i + 1}</span>
                    <Button
                      variant="ghost" size="icon"
                      aria-label="Remove story"
                      onClick={() => set("short_stories", form.short_stories.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 size={14} />
                    </Button>
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
                  <MailEditor value={story.body} placeholder="Write the short story…" onUploadImage={(file) => uploadKcMedia(file, "the-dot")} onChange={(html) => {
                    set("short_stories", form.short_stories.map((row, j) => j === i ? { ...row, body: html } : row));
                  }} />
                </div>
              ))}
              {form.short_stories.length === 0 && <p className="text-sm text-muted-foreground">No short stories yet.</p>}
            </div>
          </div>

          <div className="border-t border-border pt-5">
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
                  <Button
                    variant="ghost" size="icon"
                    aria-label="Remove link"
                    onClick={() => set("resource_links", form.resource_links.filter((_, j) => j !== i))}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {form.resource_links.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
            </div>
          </div>

          <details className="border-t border-border pt-5">
            <summary className="mb-3 cursor-pointer font-medium">From Loumilab (product update)</summary>
            <MailEditor value={form.product_update} onChange={(html) => set("product_update", html)} onUploadImage={(file) => uploadKcMedia(file, "the-dot")} />
          </details>
          <details className="border-t border-border pt-5">
            <summary className="mb-3 cursor-pointer font-medium">Closing thought</summary>
            <MailEditor value={form.closing_thought} onChange={(html) => set("closing_thought", html)} onUploadImage={(file) => uploadKcMedia(file, "the-dot")} />
          </details>
        </div>

        <aside className="space-y-6">
          <div className="space-y-3 border-t border-border pt-5">
            <Label>Writing templates</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger aria-label="Writing template"><SelectValue /></SelectTrigger>
              <SelectContent>{[...builtInTemplates, ...templates].map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={saving} onClick={applyTemplate}>Apply template</Button>
              <Button variant="ghost" size="sm" disabled={saving} onClick={saveTemplate}>Save as template</Button>
            </div>
            <div className="border-t border-border pt-4"><Label>Status</Label><p className="mt-2 text-sm text-muted-foreground">{form.status === "published" ? "Published" : "Draft"}</p></div>
          </div>

          <div className="border-t border-border pt-5">
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

          <div className="border-t border-border pt-5">
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
