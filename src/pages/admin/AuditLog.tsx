import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { data: entries = [], isLoading } = useAuditLog(500);
  const [target, setTarget] = useState("");
  const [actor, setActor] = useState("");
  const [supportOnly, setSupportOnly] = useState(false);

  const shown = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!supportOnly || e.action.startsWith("support.")) &&
          (!target.trim() || (e.target_id ?? "").includes(target.trim())) &&
          (!actor.trim() || (e.actor_email ?? "").toLowerCase().includes(actor.trim().toLowerCase())),
      ),
    [entries, target, actor, supportOnly],
  );

  return (
    <AdminShell
      title="Audit Log"
      description="Every pricing, fee, plan, lead and support action made by the Loumilab team, with actor and timestamp."
    >
      <SEOHead title="Audit Log | Loumilab Admin" description="Loumilab admin audit trail." path="/admin/audit-log" noindex />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Staff email" className="max-w-xs" />
        <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Merchant ID" className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={supportOnly} onCheckedChange={(v) => setSupportOnly(v === true)} /> Support actions only
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No matching actions.</p>
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
              {shown.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.actor_email ?? "—"}
                    {entry.actor_role && <div className="text-xs text-muted-foreground">{entry.actor_role}</div>}
                  </TableCell>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell className="max-w-56 text-xs text-muted-foreground">{summarize(entry.old_value)}</TableCell>
                  <TableCell className="max-w-56 text-xs text-muted-foreground">{summarize(entry.new_value)}</TableCell>
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
