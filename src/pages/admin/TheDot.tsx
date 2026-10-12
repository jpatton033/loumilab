import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminIssues, issueMonthLabel } from "@/lib/thedot/queries";
import { Plus, ExternalLink, PenLine } from "lucide-react";

const pad = (n: number) => String(n).padStart(3, "0");

const AdminTheDot = () => {
  const { data: issues = [], isLoading } = useAdminIssues();

  return (
    <AdminShell title="The Dot." description="Write, publish and archive issues of The Dot. — A Loumilab Brief.">
      <SEOHead title="The Dot. | Loumilab Admin" description="Editorial issue management." path="/admin/the-dot" noindex />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          {issues.length} issue{issues.length === 1 ? "" : "s"} · {issues.filter((i) => i.status === "published").length} published
        </span>
        <Button asChild size="sm">
          <Link to="/admin/the-dot/new">
            <Plus size={15} /> New issue
          </Link>
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : issues.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <p className="font-display text-lg font-semibold">No issues yet</p>
            <p className="mt-2 text-sm">Write the first issue of The Dot.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-display font-semibold">#{pad(issue.issue_number)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{issue.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {issueMonthLabel(issue.issue_month, issue.published_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        issue.status === "published" ? "bg-accent-soft text-accent" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {issue.published_at ? new Date(issue.published_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(issue.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/the-dot/${issue.id}`}>
                          <PenLine size={14} /> Edit
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/the-dot/issue/${issue.slug}`} target="_blank">
                          <ExternalLink size={14} /> View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminTheDot;
