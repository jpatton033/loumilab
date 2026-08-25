import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  formatDeliveryTime,
  useBriefDeliveries,
  useBriefJobRuns,
  useBriefReportHtml,
  useBriefReports,
  useBriefSettings,
  useOpsAlerts,
  useResolveAlert,
  useRunBrief,
} from "@/lib/admin/dailyBrief";
import { AlertTriangle, CheckCircle2, Clock, Eye, Mail, Settings2 } from "lucide-react";

const severityTone: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  important: "bg-amber-50 text-amber-700 border-amber-200",
  review: "bg-blue-50 text-blue-700 border-blue-200",
  normal: "bg-muted text-muted-foreground border-border",
};

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const AdminDailyBrief = () => {
  const { data: settings } = useBriefSettings();
  const { data: reports = [], isLoading } = useBriefReports();
  const { data: alerts = [] } = useOpsAlerts();
  const { data: runs = [] } = useBriefJobRuns();
  const resolveAlert = useResolveAlert();
  const runBrief = useRunBrief();

  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const { data: storedHtml } = useBriefReportHtml(openReportId);
  const { data: deliveries = [] } = useBriefDeliveries(openReportId);

  const openAlerts = useMemo(() => alerts.filter((a) => !a.resolved_at), [alerts]);
  const lastReport = reports[0];
  const lastRun = runs[0];

  const preview = async () => {
    try {
      const result = await runBrief.mutateAsync({ mode: "preview" });
      if (result?.html) setPreviewHtml(result.html);
      else toast({ title: "Nothing to preview", description: result?.error ?? "No brief was returned." });
    } catch (err) {
      toast({ title: "Preview failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const sendTest = async () => {
    try {
      const result = await runBrief.mutateAsync({ mode: "test" });
      if (result?.error) {
        toast({ title: "Send failed", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: "Test brief sent",
          description: `${result?.sent ?? 0} delivered${result?.failed ? `, ${result.failed} failed` : ""}.`,
        });
      }
    } catch (err) {
      toast({ title: "Send failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <AdminShell
      title="Daily Operations Brief"
      description="Every generated brief, its delivery record, and the alerts raised between briefs."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={preview} disabled={runBrief.isPending}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button size="sm" onClick={sendTest} disabled={runBrief.isPending}>
            <Mail className="h-4 w-4" /> Send test
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/settings/daily-brief" aria-label="Brief settings">
              <Settings2 className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <SEOHead
        title="Daily Operations Brief | Loumilab Admin"
        description="Loumilab daily operations brief archive."
        path="/admin/reports/daily-brief"
        noindex
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Schedule"
          value={settings ? (settings.enabled ? formatDeliveryTime(settings) : "Paused") : "—"}
          hint={settings ? settings.timezone.replace("_", " ") : undefined}
        />
        <StatCard
          label="Recipients"
          value={settings ? String(settings.recipients.length) : "—"}
          hint={settings?.recipients[0]}
        />
        <StatCard
          label="Last brief"
          value={lastReport ? new Date(lastReport.created_at).toLocaleDateString() : "None yet"}
          hint={lastReport ? `${lastReport.action_count} action items` : undefined}
        />
        <StatCard
          label="Open alerts"
          value={String(openAlerts.length)}
          hint={lastRun ? `Last run: ${lastRun.status}` : undefined}
        />
      </div>

      {openAlerts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-hero text-lg font-semibold tracking-tight">Open alerts</h2>
          <div className="mt-3 space-y-3">
            {openAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        severityTone[alert.severity] ?? severityTone.normal
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <p className="font-medium">{alert.title}</p>
                  </div>
                  {alert.detail && <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>}
                  {alert.recommended_action && (
                    <p className="mt-1 text-xs text-muted-foreground">Next step: {alert.recommended_action}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {new Date(alert.detected_at).toLocaleString()}
                    {alert.affected_system ? ` · ${alert.affected_system}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {alert.link_path && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={alert.link_path}>Open</Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert.mutate(alert.id)}
                    disabled={resolveAlert.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-hero text-lg font-semibold tracking-tight">Brief archive</h2>
        <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No brief has been generated yet. The first one arrives at the scheduled time, or send a test now.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-72 truncate font-medium">{report.subject}</TableCell>
                    <TableCell className="text-right text-sm">
                      {report.critical_count > 0 && (
                        <Badge variant="destructive" className="mr-1">
                          {report.critical_count}
                        </Badge>
                      )}
                      {report.action_count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{report.recipients.join(", ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {report.is_test ? "Test" : report.generated_by}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setOpenReportId(report.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Stored brief, rendered exactly as it was emailed. */}
      <Dialog open={Boolean(openReportId)} onOpenChange={(open) => !open && setOpenReportId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Brief detail</DialogTitle>
          </DialogHeader>
          {deliveries.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {deliveries.map((d) => (
                <span key={d.id} className="rounded-full border border-border px-2 py-0.5">
                  {d.recipient} · {d.status}
                  {d.error ? ` (${d.error})` : ""}
                </span>
              ))}
            </div>
          )}
          <iframe
            title="Daily brief"
            className="h-[70vh] w-full rounded-2xl border border-border bg-white"
            srcDoc={storedHtml ?? "<p style='font-family:sans-serif;padding:24px'>Loading…</p>"}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewHtml)} onOpenChange={(open) => !open && setPreviewHtml(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Brief preview (not sent)</DialogTitle>
          </DialogHeader>
          <iframe
            title="Daily brief preview"
            className="h-[70vh] w-full rounded-2xl border border-border bg-white"
            srcDoc={previewHtml ?? ""}
          />
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminDailyBrief;
