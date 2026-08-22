import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminCounts, useRecentArticles, useRecentInquiries } from "@/lib/admin/queries";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";

const Metric = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-hero text-3xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Panel = ({
  title,
  to,
  children,
}: {
  title: string;
  to: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-sm font-semibold">{title}</h2>
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent"
      >
        View all <ArrowUpRight size={13} />
      </Link>
    </div>
    <div className="mt-4 space-y-2">{children}</div>
  </div>
);

const AdminOverview = () => {
  const { data: counts, isLoading } = useAdminCounts();
  const { data: inquiries = [] } = useRecentInquiries();
  const { data: articles = [] } = useRecentArticles();

  return (
    <AdminShell
      title="Overview"
      description="Everything happening across Loumilab right now."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/knowledge">
              <BookOpen size={14} /> Articles
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/hero">
              <Sparkles size={14} /> Hero
            </Link>
          </Button>
        </>
      }
    >
      <SEOHead title="Admin Overview | Loumilab" description="Loumilab admin overview." path="/admin/overview" noindex />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Inquiries" value={isLoading ? "—" : counts!.inquiriesTotal} hint={`${counts?.inquiriesNew ?? 0} unread`} />
        <Metric label="Published articles" value={isLoading ? "—" : counts!.articlesPublished} hint={`${counts?.articlesDraft ?? 0} drafts`} />
        <Metric label="Article views" value={isLoading ? "—" : counts!.articleViews} hint="All-time, Knowledge Center" />
        <Metric label="Newsletter" value={isLoading ? "—" : counts!.subscribers} hint="Subscribers" />
        <Metric label="Hero slides" value={isLoading ? "—" : counts!.heroActive} hint="Active on homepage" />
        <Metric label="Orders" value="Preview" hint="Mock data — not live yet" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent inquiries" to="/admin/inquiries">
          {inquiries.length === 0 && <p className="text-sm text-muted-foreground">No inquiries yet.</p>}
          {inquiries.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {i.company ? `${i.company} · ` : ""}
                  {i.email}
                </p>
              </div>
              <Badge variant={i.status === "new" ? "default" : "outline"} className="capitalize">
                {i.status}
              </Badge>
            </div>
          ))}
        </Panel>

        <Panel title="Recently edited articles" to="/admin/knowledge">
          {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
          {articles.map((a) => (
            <Link
              key={a.id}
              to={`/admin/knowledge/${a.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:border-accent/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.view_count} views · updated {new Date(a.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={a.status === "published" ? "default" : "secondary"} className="capitalize">
                {a.status}
              </Badge>
            </Link>
          ))}
        </Panel>
      </div>
    </AdminShell>
  );
};

export default AdminOverview;
