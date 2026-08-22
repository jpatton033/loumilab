import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubscribers } from "@/lib/admin/queries";
import { Download, Mail } from "lucide-react";

const AdminNewsletter = () => {
  const { data: subscribers = [], isLoading } = useSubscribers();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((s) => !q || s.email.toLowerCase().includes(q) || (s.source ?? "").includes(q));
  }, [subscribers, search]);

  const exportCsv = () => {
    const rows = [["email", "source", "subscribed_at"], ...filtered.map((s) => [s.email, s.source ?? "", s.created_at])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `loumilab-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell
      title="Newsletter"
      description="Subscribers captured from the Knowledge Center and resources pages."
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download size={14} /> Export CSV
        </Button>
      }
    >
      <SEOHead title="Newsletter | Loumilab Admin" description="Newsletter subscribers." path="/admin/newsletter" noindex />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or source…"
          className="max-w-xs"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {subscribers.length} subscribers
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <Mail size={30} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No subscribers yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-muted-foreground">{s.source ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
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

export default AdminNewsletter;
