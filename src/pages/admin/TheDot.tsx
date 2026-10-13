import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminIssues, issueMonthLabel } from "@/lib/thedot/queries";
import { builtInTemplates, useIssueTemplates } from "@/lib/thedot/editorial";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, PenLine, Trash2, Mail, Search, Users, FileText } from "lucide-react";

const AdminTheDot = () => {
  const { data: issues = [], isLoading, error, refetch } = useAdminIssues();
  const { data: templates = [], error: templateError, isLoading: templatesLoading } = useIssueTemplates();
  const [view, setView] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const filtered = issues.filter((i) => (view === "all" || i.status === view) && `${i.title} ${i.issue_number} ${i.issue_month ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const editTemplate = async (id: string, currentName: string) => {
    const name = window.prompt("Template name:", currentName)?.trim();
    if (!name || name === currentName) return;
    if (name.length > 120) { toast({ title: "Use a shorter template name", variant: "destructive" }); return; }
    setBusy(id);
    const { error } = await supabase.from("dot_issue_templates").update({ name }).eq("id", id);
    setBusy(null);
    if (error) toast({ title: "Rename failed", description: error.message, variant: "destructive" });
    else qc.invalidateQueries({ queryKey: ["dot", "templates"] });
  };
  const deleteTemplate = async (id: string) => {
    if (!window.confirm("Delete this writing template? Issues created from it will not be changed.")) return;
    setBusy(id);
    const { error } = await supabase.from("dot_issue_templates").delete().eq("id", id);
    setBusy(null);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else qc.invalidateQueries({ queryKey: ["dot", "templates"] });
  };
  const sendTest = async (id: string) => {
    const { data } = await supabase.auth.getUser();
    const to = window.prompt("Send a test of the saved issue to:", data.user?.email ?? "")?.trim();
    if (!to) return;
    setBusy(id);
    const { error } = await supabase.functions.invoke("dot-issue-blast", { body: { issue_id: id, test_to: to } });
    setBusy(null);
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      toast({ title: "Test did not send", description: details.slice(0, 240), variant: "destructive" });
    } else toast({ title: `Test sent to ${to}` });
  };

  return <AdminShell title="The Dot." description="A Loumilab Brief">
    <SEOHead title="The Dot. | Loumilab Admin" description="Editorial issue management." path="/admin/the-dot" noindex />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground"><FileText size={18} />{issues.length} issues · {issues.filter((i) => i.status === "draft").length} drafts</div>
      <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" asChild><Link to="/admin/newsletter"><Users size={15} /> Subscribers</Link></Button><Button size="sm" asChild><Link to="/admin/the-dot/new"><Plus size={15} /> New issue</Link></Button></div>
    </div>
    <Tabs value={view} onValueChange={setView} className="mt-6">
      <TabsList className="h-auto max-w-full flex-wrap"><TabsTrigger value="all">All issues</TabsTrigger><TabsTrigger value="draft">Drafts</TabsTrigger><TabsTrigger value="published">Published</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>
    </Tabs>
    <div className="relative mt-5 max-w-md"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input aria-label="Search issues or templates" placeholder={view === "templates" ? "Search templates…" : "Search issues…"} className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    {(error || templateError) && <div className="mt-5 text-sm text-destructive">{error?.message ?? templateError?.message}<Button variant="ghost" onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ["dot", "templates"] }); }}>Retry</Button></div>}
    {view === "templates" ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templatesLoading && <p className="text-sm text-muted-foreground">Loading templates…</p>}
      {[...builtInTemplates, ...templates].filter((t) => t.name.toLowerCase().includes(query.toLowerCase())).map((t) => <div key={t.id} className="flex min-w-0 flex-col gap-5 rounded-lg border border-border bg-card p-5">
        <div><FileText size={20} className="mb-3 text-accent" /><h2 className="break-words font-semibold">{t.name}</h2><p className="mt-1 text-xs text-muted-foreground">{builtInTemplates.some((b) => b.id === t.id) ? "Built-in" : "Saved template"}</p></div>
        <div className="mt-auto flex flex-wrap items-center gap-1"><Button variant="outline" size="sm" asChild><Link to={`/admin/the-dot/new?template=${t.id}`}><Plus size={14} /> Use template</Link></Button>
          {!builtInTemplates.some((b) => b.id === t.id) && <><Button variant="ghost" size="icon" title="Rename template" aria-label={`Rename ${t.name}`} disabled={busy === t.id} onClick={() => editTemplate(t.id, t.name)}><PenLine size={15} /></Button><Button variant="ghost" size="icon" title="Delete template" aria-label={`Delete ${t.name}`} disabled={busy === t.id} onClick={() => deleteTemplate(t.id)}><Trash2 size={15} /></Button></>}
        </div>
      </div>)}
      {!templatesLoading && ![...builtInTemplates, ...templates].some((t) => t.name.toLowerCase().includes(query.toLowerCase())) && <p className="py-8 text-sm text-muted-foreground">No matching templates</p>}
    </div> : <div className="mt-6 border-y border-border">
      {isLoading ? <p className="py-12 text-center text-muted-foreground">Loading issues…</p> : !filtered.length ? <div className="py-14 text-center"><FileText className="mx-auto mb-3 text-muted-foreground" /><p className="font-medium">{query ? "No matching issues" : "No issues in this view"}</p></div> : <Table>
        <TableHeader><TableRow><TableHead>Issue</TableHead><TableHead className="min-w-[220px]">Title</TableHead><TableHead>Status</TableHead><TableHead className="min-w-[170px]">Email record</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map((i) => <TableRow key={i.id}>
          <TableCell className="font-semibold">{String(i.issue_number).padStart(3, "0")}</TableCell>
          <TableCell><Link to={`/admin/the-dot/${i.id}`} className="font-medium hover:text-accent">{i.title}</Link><p className="mt-1 text-xs text-muted-foreground">{issueMonthLabel(i.issue_month, i.published_at)}</p></TableCell>
          <TableCell><span className={`rounded-full px-2.5 py-1 text-xs ${i.status === "published" ? "bg-accent-soft text-accent" : "bg-secondary text-muted-foreground"}`}>{i.status === "published" ? "Published" : "Draft"}</span></TableCell>
          <TableCell className="text-xs text-muted-foreground">{i.emailed_at ? <>{new Date(i.emailed_at).toLocaleDateString()}<p className="mt-1">{i.emailed_count ?? 0} recipients recorded</p></> : "Not emailed"}</TableCell>
          <TableCell><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" asChild><Link to={`/admin/the-dot/${i.id}`}><PenLine size={14} /> Edit</Link></Button><Button variant="ghost" size="icon" title="Send test" aria-label={`Send test of issue ${i.issue_number}`} disabled={busy === i.id} onClick={() => sendTest(i.id)}><Mail size={15} /></Button><Button variant="ghost" size="icon" title="View issue" aria-label={`View issue ${i.issue_number}`} asChild><Link to={`/the-dot/issue/${i.slug}`} target="_blank"><ExternalLink size={15} /></Link></Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table>}
    </div>}
  </AdminShell>;
};
export default AdminTheDot;
