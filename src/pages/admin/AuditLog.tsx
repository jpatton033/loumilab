import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLog } from "@/lib/admin/audit";

const summarize = (value: unknown) => {
  if (value == null) return "—";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== null);
    if (entries.length === 0) return "—";
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
  }
  return String(value);
};

const AdminAuditLog = () => {
  const { data: entries = [], isLoading } = useAuditLog(200);

  return (
    <AdminShell
      title="Audit Log"
      description="Every pricing, fee, plan and lead change made by the Loumilab team, with actor and timestamp."
    >
      <SEOHead title="Audit Log | Loumilab Admin" description="Loumilab admin audit trail." path="/admin/audit-log" noindex />

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No admin actions recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{entry.actor_email ?? "—"}</TableCell>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell className="max-w-56 text-xs text-muted-foreground">
                    {summarize(entry.old_value)}
                  </TableCell>
                  <TableCell className="max-w-56 text-xs text-muted-foreground">
                    {summarize(entry.new_value)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminAuditLog;
