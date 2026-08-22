import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminArticles, useAdminSections, useTags } from "@/lib/kc/queries";
import { slugify, type KcStatus } from "@/lib/kc/types";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2, Pencil } from "lucide-react";

const statusVariant: Record<KcStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

const AdminKnowledgeCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: articles = [], isLoading } = useAdminArticles();
  const { data: sections = [] } = useAdminSections();
  const { data: tags = [] } = useTags();

  const [filter, setFilter] = useState<"all" | KcStatus>("all");
  const [search, setSearch] = useState("");
  const [newSection, setNewSection] = useState({ title: "", description: "", icon: "BookOpen" });
  const [newTag, setNewTag] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter(
      (a) => (filter === "all" || a.status === filter) && (!q || a.title.toLowerCase().includes(q))
    );
  }, [articles, filter, search]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["kc"] });
  };

  const createArticle = async () => {
    if (sections.length === 0) {
      toast({ title: "Add a section first", variant: "destructive" });
      return;
    }
    const stamp = Date.now().toString(36);
    const { data, error } = await supabase
      .from("kc_articles")
      .insert({
        title: "Untitled article",
        slug: `untitled-${stamp}`,
        section_id: sections[0].id,
        body: "## Start here\n\nWrite your article in markdown.",
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create article", description: error?.message, variant: "destructive" });
      return;
    }
    invalidate();
    navigate(`/admin/knowledge/${data.id}`);
  };

  const togglePublish = async (id: string, status: KcStatus) => {
    const next: KcStatus = status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("kc_articles")
      .update({ status: next, published_at: next === "published" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const deleteArticle = async (id: string) => {
    if (!window.confirm("Delete this article permanently?")) return;
    const { error } = await supabase.from("kc_articles").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
    toast({ title: "Article deleted" });
  };

  const addSection = async () => {
    if (!newSection.title.trim()) return;
    const { error } = await supabase.from("kc_sections").insert({
      title: newSection.title.trim(),
      slug: slugify(newSection.title),
      description: newSection.description.trim() || null,
      icon: newSection.icon.trim() || "BookOpen",
      sort_order: sections.length + 1,
    });
    if (error) {
      toast({ title: "Couldn't add section", description: error.message, variant: "destructive" });
      return;
    }
    setNewSection({ title: "", description: "", icon: "BookOpen" });
    invalidate();
  };

  const toggleSectionVisibility = async (id: string, isVisible: boolean) => {
    const { error } = await supabase.from("kc_sections").update({ is_visible: !isVisible }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    const { error } = await supabase.from("kc_tags").insert({ name: newTag.trim(), slug: slugify(newTag) });
    if (error) {
      toast({ title: "Couldn't add tag", description: error.message, variant: "destructive" });
      return;
    }
    setNewTag("");
    invalidate();
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("kc_tags").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  return (
    <AdminShell title="Knowledge Center" description="Articles, sections, and tags for /resources.">
      <SEOHead title="Knowledge Center Admin | Loumilab" description="Manage Knowledge Center content." path="/admin/knowledge" noindex />
      <section className="section-padding pt-12">
        <div className="section-container">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
            <ArrowLeft size={15} /> Admin
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Knowledge Center</h1>
              <p className="mt-2 text-muted-foreground">Manage articles, sections, and tags for /resources.</p>
            </div>
            <Button onClick={createArticle}>
              <Plus size={16} /> New article
            </Button>
          </div>

          <Tabs defaultValue="articles" className="mt-10">
            <TabsList>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="max-w-xs"
                />
                {(["all", "draft", "published", "archived"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
                      filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {isLoading && <p className="text-muted-foreground">Loading…</p>}
                {!isLoading && filtered.length === 0 && (
                  <p className="text-muted-foreground">No articles match this filter.</p>
                )}
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate font-display font-semibold">{a.title}</p>
                        <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {a.kc_sections?.title ?? "No section"} · /{a.slug} · {a.view_count} views
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => togglePublish(a.id, a.status)}>
                        {a.status === "published" ? <EyeOff size={15} /> : <Eye size={15} />}
                        {a.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/knowledge/${a.id}`}>
                          <Pencil size={15} /> Edit
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteArticle(a.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold">Add a section</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
                  <Input
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Input
                    value={newSection.description}
                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                    placeholder="Description"
                  />
                  <Input
                    value={newSection.icon}
                    onChange={(e) => setNewSection({ ...newSection, icon: e.target.value })}
                    placeholder="Lucide icon"
                  />
                  <Button onClick={addSection}>Add</Button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {sections.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold">{s.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">/{s.slug} · icon: {s.icon ?? "—"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleSectionVisibility(s.id, s.is_visible)}>
                      {s.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                      {s.is_visible ? "Hide" : "Show"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tags" className="mt-6">
              <div className="flex max-w-md gap-3">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name" />
                <Button onClick={addTag}>Add</Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    {t.name}
                    <button type="button" onClick={() => deleteTag(t.id)} aria-label={`Delete ${t.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AdminShell>
  );
};

export default AdminKnowledgeCenter;
