import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin/audit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  "new",
  "contacted",
  "discovery",
  "proposal",
  "approved",
  "in_development",
  "completed",
  "declined",
] as const;
type LeadStatus = (typeof STATUSES)[number];



interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  orders_account_email: string | null;
  storefront_url: string | null;
  business_type: string | null;
  build_goal: string | null;
  project_description: string | null;
  desired_features: string | null;
  existing_website: string | null;
  existing_software: string | null
  budget_range: string | null;
  launch_timeframe: string | null;
  integrations_required: string | null;
  location_count: string | null;
  monthly_order_volume: string | null;
  additional_notes: string | null;
  attachment_paths: string[] | null;
  status: LeadStatus;
  internal_notes: string | null;
  created_at: string;
}

const useLeads = () =>
  useQuery({
    queryKey: ["admin", "custom-project-leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("custom_project_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });

const AdminCustomProjects = () => {
  const { data: leads = [], isLoading } = useLeads();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesQuery =
        !q ||
        [lead.business_name, lead.contact_name, lead.email, lead.build_goal]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [leads, search, statusFilter]);

  const update = useMutation({
    mutationFn: async ({ lead, patch }: { lead: Lead; patch: Partial<Lead> }) => {
      const { error } = await supabase.from("custom_project_leads").update(patch).eq("id", lead.id);
      if (error) throw error;
      await logAudit({
        action: "custom_project_lead.updated",
        targetType: "custom_project_lead",
        targetId: lead.id,
        oldValue: { status: lead.status },
        newValue: patch,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "custom-project-leads"] });
      toast.success("Lead updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from("custom-project-files").createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Could not open that file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const exportCsv = () => {
    const header = ["Created", "Business", "Contact", "Email", "Phone", "Goal", "Budget", "Timeframe", "Status"];
    const rows = visible.map((l) => [
      new Date(l.created_at).toISOString(),
      l.business_name,
      l.contact_name,
      l.email,
      l.phone ?? "",
      l.build_goal ?? "",
      l.budget_range ?? "",
      l.launch_timeframe ?? "",
      l.status,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `loumilab-custom-projects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const select = (lead: Lead) => {
    setSelected(lead);
    setNotes(lead.internal_notes ?? "");
  };

  return (
    <AdminShell
      title="Custom Projects"
      description="Custom build requests from the Orders pricing page and consultation links."
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={visible.length === 0}>
          <Download size={14} /> Export CSV
        </Button>
      }
    >
      <SEOHead title="Custom Projects | Loumilab Admin" description="Custom project leads." path="/admin/custom-projects" noindex />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search business, contact, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No custom project requests yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>What they want</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => select(lead)}>
                  <TableCell className="font-medium">{lead.business_name}</TableCell>
                  <TableCell>
                    <p>{lead.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">{lead.build_goal}</TableCell>
                  <TableCell className="text-sm">{lead.budget_range ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status === "new" ? "default" : "outline"}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selected?.business_name}</SheetTitle>
          </SheetHeader>

          {selected && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-3">
                <Row label="Contact" value={`${selected.contact_name} · ${selected.email}`} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Orders account" value={selected.orders_account_email} />
                <Row label="Storefront" value={selected.storefront_url} />
                <Row label="Business type" value={selected.business_type} />
                <Row label="Locations" value={selected.location_count} />
                <Row label="Monthly order volume" value={selected.monthly_order_volume} />
              </div>

              <div className="space-y-4 rounded-2xl border border-border p-4">
                <Block label="Wants built" value={selected.build_goal} />
                <Block label="Description" value={selected.project_description} />
                <Block label="Desired features" value={selected.desired_features} />
                <Block label="Existing website" value={selected.existing_website} />
                <Block label="Existing software" value={selected.existing_software} />
                <Block label="Integrations" value={selected.integrations_required} />
                <Block label="Budget" value={selected.budget_range} />
                <Block label="Timeframe" value={selected.launch_timeframe} />
                <Block label="Additional notes" value={selected.additional_notes} />
              </div>

              {selected.attachment_paths && selected.attachment_paths.length > 0 && (
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Attachments
                  </p>
                  <div className="mt-2 space-y-2">
                    {selected.attachment_paths.map((path) => (
                      <Button
                        key={path}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => openAttachment(path)}
                      >
                        {path.split("/").pop()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={(v) => {
                    update.mutate({ lead: selected, patch: { status: v as LeadStatus } });
                    setSelected({ ...selected, status: v as LeadStatus });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Internal notes</Label>
                <Textarea className="mt-2 min-h-28" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => update.mutate({ lead: selected, patch: { internal_notes: notes } })}
                  disabled={update.isPending}
                >
                  Save notes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
};

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  ) : null;

const Block = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
    </div>
  ) : null;

export default AdminCustomProjects;
