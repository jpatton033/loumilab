import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubscribers } from "@/lib/admin/queries";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Mail, XCircle } from "lucide-react";

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const AdminNewsletter = () => {
  const { data: subscribers = [], isLoading } = useSubscribers();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter(
      (s) =>
        !q ||
        s.email.toLowerCase().includes(q) ||
        (s.source ?? "").includes(q) ||
        s.status.includes(q) ||
        (s.interests ?? []).some((i) => i.toLowerCase().includes(q)),
    );
  }, [subscribers, search]);

  const exportCsv = () => {
    const rows = [
      ["email", "source", "status", "interests", "subscribed_at"],
      ...filtered.map((s) => [s.email, s.source ?? "", s.status, (s.interests ?? []).join("; "), s.created_at]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `loumilab-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unsubscribe = async (id: string) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "subscribers"] });
    toast({ title: "Marked as unsubscribed" });
  };

  const active = filtered.filter((s) => s.status === "subscribed");

  return (
    <AdminShell
      title="Newsletter"
      description="Subscribers to The Dot. and the newsletter, captured across the site."
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
          placeholder="Search email, source, status, or interest…"
          className="max-w-xs"
        />
        <span className="text-xs text-muted-foreground">
          {active.length} active of {subscribers.length} subscribers
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
                <TableHead>Interests</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                    {(s.interests ?? []).length > 0 ? s.interests.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.source ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.status === "subscribed" ? "bg-accent-soft text-accent" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "subscribed" && (
                      <Button variant="ghost" size="sm" onClick={() => unsubscribe(s.id)}>
                        <XCircle size={14} /> Unsubscribe
                      </Button>
                    )}
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
