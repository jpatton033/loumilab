import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin/audit";
import {
  MODULE_LABELS,
  useAllIndustries,
  type ModuleKey,
  type OrdersIndustry,
} from "@/lib/orders/industries";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  name: string;
  group_label: string;
  description: string;
  is_food: boolean;
  is_active: boolean;
  display_order: string;
  modules: ModuleKey[];
  workflow: string;
  catalog: string;
  catalogItem: string;
  transaction: string;
  transactions: string;
  schedule: string;
  location: string;
  customer: string;
  cta: string;
}

const toDraft = (industry: OrdersIndustry): Draft => ({
  name: industry.name,
  group_label: industry.group_label,
  description: industry.description ?? "",
  is_food: industry.is_food,
  is_active: industry.is_active,
  display_order: String(industry.display_order),
  modules: industry.modules,
  workflow: industry.workflow.join(", "),
  catalog: industry.terminology.catalog ?? "",
  catalogItem: industry.terminology.catalogItem ?? "",
  transaction: industry.terminology.transaction ?? "",
  transactions: industry.terminology.transactions ?? "",
  schedule: industry.terminology.schedule ?? "",
  location: industry.terminology.location ?? "",
  customer: industry.terminology.customer ?? "",
  cta: industry.terminology.cta ?? "",
});

const ALL_MODULES = Object.keys(MODULE_LABELS) as ModuleKey[];

const clean = (value: string) => (value.trim() === "" ? undefined : value.trim());

const AdminIndustries = () => {
  const { data: industries = [], isLoading } = useAllIndustries();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OrdersIndustry | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(editing ? toDraft(editing) : null);
  }, [editing]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["orders", "industries"] });

  const toggleActive = async (industry: OrdersIndustry) => {
    const { error } = await supabase
      .from("orders_industries")
      .update({ is_active: !industry.is_active })
      .eq("id", industry.id);
    if (error) {
      toast.error("Couldn't update the industry", { description: error.message });
      return;
    }
    await logAudit({
      action: industry.is_active ? "industry.deactivated" : "industry.activated",
      target_type: "orders_industry",
      target_id: industry.id,
      new_value: { is_active: !industry.is_active },
    });
    refresh();
    toast.success(industry.is_active ? "Industry hidden" : "Industry live");
  };

  const save = async () => {
    if (!editing || !draft) return;
    setSaving(true);
    try {
      const terminology = {
        catalog: clean(draft.catalog),
        catalogItem: clean(draft.catalogItem),
        transaction: clean(draft.transaction),
        transactions: clean(draft.transactions),
        schedule: clean(draft.schedule),
        location: clean(draft.location),
        customer: clean(draft.customer),
        cta: clean(draft.cta),
      };
      const payload = {
        name: draft.name.trim(),
        group_label: draft.group_label.trim(),
        description: clean(draft.description) ?? null,
        is_food: draft.is_food,
        is_active: draft.is_active,
        display_order: Number(draft.display_order) || 0,
        modules: draft.modules,
        workflow: draft.workflow
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        terminology: Object.fromEntries(Object.entries(terminology).filter(([, v]) => v !== undefined)),
      };

      const { error } = await supabase.from("orders_industries").update(payload).eq("id", editing.id);
      if (error) throw error;

      await logAudit({
        action: "industry.updated",
        target_type: "orders_industry",
        target_id: editing.id,
        old_value: { name: editing.name, modules: editing.modules, terminology: editing.terminology },
        new_value: payload,
      });

      refresh();
      toast.success("Industry updated");
      setEditing(null);
    } catch (err) {
      toast.error("Couldn't save the industry", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const setDraftField = (patch: Partial<Draft>) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <AdminShell title="Industries" description="Control which business types Loumilab Orders supports, and how each one is worded.">
      <SEOHead title="Industries — Loumilab Admin" description="Manage Loumilab Orders industries." path="/admin/industries" noindex />

      <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Industry</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Live</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Loading industries…
                </TableCell>
              </TableRow>
            )}
            {industries.map((industry) => (
              <TableRow key={industry.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{industry.name}</span>
                    {industry.is_food && <Badge variant="secondary">Food</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{industry.slug}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{industry.group_label}</TableCell>
                <TableCell className="max-w-[260px] text-xs text-muted-foreground">
                  {industry.modules.map((m) => MODULE_LABELS[m] ?? m).join(", ")}
                </TableCell>
                <TableCell className="text-sm">{industry.display_order}</TableCell>
                <TableCell className="text-right">
                  <Switch checked={industry.is_active} onCheckedChange={() => toggleActive(industry)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Edit industry" onClick={() => setEditing(industry)}>
                    <Pencil size={15} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="i-name">Name</Label>
                  <Input id="i-name" value={draft.name} onChange={(e) => setDraftField({ name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-group">Group</Label>
                  <Input id="i-group" value={draft.group_label} onChange={(e) => setDraftField({ group_label: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="i-desc">Description</Label>
                <Textarea id="i-desc" rows={2} value={draft.description} onChange={(e) => setDraftField({ description: e.target.value })} />
              </div>

              <div>
                <Label>Modules</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALL_MODULES.map((key) => {
                    const on = draft.modules.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setDraftField({
                            modules: on ? draft.modules.filter((m) => m !== key) : [...draft.modules, key],
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          on ? "border-transparent bg-foreground text-background" : "border-border text-muted-foreground"
                        }`}
                      >
                        {MODULE_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="i-workflow">Workflow stages (comma separated)</Label>
                <Input id="i-workflow" value={draft.workflow} onChange={(e) => setDraftField({ workflow: e.target.value })} />
              </div>

              <div>
                <Label>Terminology</Label>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["catalog", "Catalog"],
                      ["catalogItem", "Catalog item"],
                      ["transaction", "Transaction (singular)"],
                      ["transactions", "Transactions (plural)"],
                      ["schedule", "Schedule"],
                      ["location", "Location"],
                      ["customer", "Customer"],
                      ["cta", "Storefront CTA"],
                    ] as [keyof Draft, string][]
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`i-${field}`}>{label}</Label>
                      <Input
                        id={`i-${field}`}
                        value={draft[field] as string}
                        onChange={(e) => setDraftField({ [field]: e.target.value } as Partial<Draft>)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="i-order">Display order</Label>
                  <Input id="i-order" value={draft.display_order} onChange={(e) => setDraftField({ display_order: e.target.value })} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <Label htmlFor="i-food">Food-first</Label>
                  <Switch id="i-food" checked={draft.is_food} onCheckedChange={(v) => setDraftField({ is_food: v })} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <Label htmlFor="i-active">Live</Label>
                  <Switch id="i-active" checked={draft.is_active} onCheckedChange={(v) => setDraftField({ is_active: v })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save industry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminIndustries;
