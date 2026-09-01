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
  formatFeeBps,
  formatMoneyCents,
  useAllPlans,
  usePlanFeeChanges,
  type OrdersPlan,
} from "@/lib/orders/plans";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  PLAN_LINK_LABELS,
  useLinkPlanToStripe,
  usePlanStripeStatus,
  type PlanLinkStatus,
} from "@/lib/orders/planStripe";

interface Draft {
  name: string;
  positioning: string;
  description: string;
  price_label: string;
  monthly_price: string;
  annual_price: string;
  annual_billing_active: boolean;
  annual_note: string;
  platform_fee_pct: string;
  fee_label: string;
  features: string;
  badge: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  is_public: boolean;
  is_active: boolean;
  display_order: string;
  fee_reason: string;
}

const toDraft = (plan: OrdersPlan): Draft => ({
  name: plan.name,
  positioning: plan.positioning,
  description: plan.description,
  price_label: plan.price_label ?? "",
  monthly_price: plan.monthly_price_cents == null ? "" : String(plan.monthly_price_cents / 100),
  annual_price: plan.annual_price_cents == null ? "" : String(plan.annual_price_cents / 100),
  annual_billing_active: plan.annual_billing_active,
  annual_note: plan.annual_note ?? "",
  platform_fee_pct: plan.platform_fee_bps == null ? "" : String(plan.platform_fee_bps / 100),
  fee_label: plan.fee_label ?? "",
  features: plan.features.join("\n"),
  badge: plan.badge ?? "",
  cta_label: plan.cta_label,
  cta_href: plan.cta_href ?? "",
  cta_secondary_label: plan.cta_secondary_label ?? "",
  cta_secondary_href: plan.cta_secondary_href ?? "",
  is_public: plan.is_public,
  is_active: plan.is_active,
  display_order: String(plan.display_order),
  fee_reason: "",
});

const cents = (value: string) => (value.trim() === "" ? null : Math.round(Number(value) * 100));
const bps = (value: string) => (value.trim() === "" ? null : Math.round(Number(value) * 100));

/** Stripe linkage state for one plan, with a provisioning action for admins. */
const StripeCell = ({
  plan,
  status,
  loading,
  unavailable,
  linking,
  onLink,
}: {
  plan: OrdersPlan;
  status?: PlanLinkStatus;
  loading: boolean;
  unavailable: boolean;
  linking: boolean;
  onLink: () => void;
}) => {
  if (!plan.requires_subscription || !plan.monthly_price_cents) return <span>—</span>;
  if (loading && !status) return <span>Checking…</span>;

  const state = status?.state ?? (plan.stripe_price_monthly_id ? "linked" : "not_linked");
  const linked = state === "linked";
  const intervals = status?.annual_required ? "monthly + annual" : "monthly";

  return (
    <div className="space-y-1.5">
      <Badge variant={linked ? "default" : state === "stale" ? "destructive" : "outline"}>
        {linked ? `Linked (${intervals})` : PLAN_LINK_LABELS[state]}
      </Badge>
      {unavailable && <p>Stripe could not be reached — showing saved IDs only.</p>}
      {status?.detail && !unavailable && <p>{status.detail}</p>}
      {!linked && (
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" disabled={linking} onClick={onLink}>
          {linking ? <Loader2 className="animate-spin" size={12} /> : "Link to Stripe"}
        </Button>
      )}
    </div>
  );
};

const AdminPlans = () => {
  const { data: plans = [], isLoading } = useAllPlans();
  const { data: feeChanges = [] } = usePlanFeeChanges();
  const { data: stripeStatus, isLoading: statusLoading, error: statusError } = usePlanStripeStatus();
  const linkPlan = useLinkPlanToStripe();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OrdersPlan | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(editing ? toDraft(editing) : null);
  }, [editing]);

  const save = async () => {
    if (!editing || !draft) return;
    setSaving(true);
    try {
      const newFeeBps = bps(draft.platform_fee_pct);
      const feeChanged = newFeeBps !== editing.platform_fee_bps;

      const payload = {
        name: draft.name.trim(),
        positioning: draft.positioning.trim(),
        description: draft.description.trim(),
        price_label: draft.price_label.trim() || null,
        monthly_price_cents: cents(draft.monthly_price),
        annual_price_cents: cents(draft.annual_price),
        annual_billing_active: draft.annual_billing_active,
        annual_note: draft.annual_note.trim() || null,
        platform_fee_bps: newFeeBps,
        fee_label: draft.fee_label.trim() || null,
        features: draft.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        badge: draft.badge.trim() || null,
        cta_label: draft.cta_label.trim() || "Get started",
        cta_href: draft.cta_href.trim() || null,
        cta_secondary_label: draft.cta_secondary_label.trim() || null,
        cta_secondary_href: draft.cta_secondary_href.trim() || null,
        is_public: draft.is_public,
        is_active: draft.is_active,
        display_order: Number(draft.display_order) || 0,
      };

      const { error } = await supabase.from("orders_plans").update(payload).eq("id", editing.id);
      if (error) throw error;

      if (feeChanged && newFeeBps != null) {
        const { data: user } = await supabase.auth.getUser();
        const { error: feeError } = await supabase.from("orders_plan_fee_changes").insert({
          plan_id: editing.id,
          old_fee_bps: editing.platform_fee_bps,
          new_fee_bps: newFeeBps,
          reason: draft.fee_reason.trim() || null,
          created_by: user.user?.id ?? null,
        });
        if (feeError) throw feeError;
      }

      await logAudit({
        action: feeChanged ? "plan.fee_changed" : "plan.updated",
        targetType: "orders_plan",
        targetId: editing.id,
        oldValue: {
          platform_fee_bps: editing.platform_fee_bps,
          monthly_price_cents: editing.monthly_price_cents,
          annual_price_cents: editing.annual_price_cents,
          annual_billing_active: editing.annual_billing_active,
          is_public: editing.is_public,
          is_active: editing.is_active,
        },
        newValue: {
          platform_fee_bps: payload.platform_fee_bps,
          monthly_price_cents: payload.monthly_price_cents,
          annual_price_cents: payload.annual_price_cents,
          annual_billing_active: payload.annual_billing_active,
          is_public: payload.is_public,
          is_active: payload.is_active,
        },
        reason: draft.fee_reason.trim() || undefined,
      });

      // A changed amount makes the existing Stripe price stale — re-provision it
      // straight away so checkout never charges an outdated price.
      const priceChanged =
        payload.monthly_price_cents !== editing.monthly_price_cents ||
        payload.annual_price_cents !== editing.annual_price_cents ||
        payload.annual_billing_active !== editing.annual_billing_active;
      if (priceChanged && editing.requires_subscription && payload.monthly_price_cents) {
        try {
          await linkPlan.mutateAsync(editing.id);
        } catch {
          toast.warning("Plan saved, but Stripe pricing needs relinking.");
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`${payload.name} saved`);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the plan.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof Draft) => ({
    value: String(draft?.[key] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => (d ? { ...d, [key]: e.target.value } : d)),
  });

  return (
    <AdminShell
      title="Plans & Fees"
      description="Pricing, platform fees, annual billing and entitlements for Loumilab Orders. Changes apply immediately and are recorded in the audit log."
    >
      <SEOHead title="Plans & Fees | Loumilab Admin" description="Loumilab Orders plan management." path="/admin/plans" noindex />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Stripe pricing objects are provisioned from this table.</span>
        {stripeStatus && (
          <Badge variant="outline">{stripeStatus.mode === "live" ? "Stripe live mode" : "Stripe test mode"}</Badge>
        )}
        {statusError && <span>Stripe status is unavailable right now.</span>}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Annual</TableHead>
                <TableHead>Platform fee</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.positioning}</p>
                  </TableCell>
                  <TableCell>{formatMoneyCents(plan.monthly_price_cents)}</TableCell>
                  <TableCell>
                    {plan.annual_billing_active ? formatMoneyCents(plan.annual_price_cents) : "Off"}
                  </TableCell>
                  <TableCell className="font-medium">{formatFeeBps(plan.platform_fee_bps)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={plan.is_active ? "default" : "outline"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {!plan.is_public && <Badge variant="outline">Private</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <StripeCell
                      plan={plan}
                      status={stripeStatus?.plans.find((s) => s.plan_id === plan.id)}
                      loading={statusLoading}
                      unavailable={!!statusError}
                      linking={linkPlan.isPending && linkingId === plan.id}
                      onLink={() => {
                        setLinkingId(plan.id);
                        linkPlan.mutate(plan.id, {
                          onSuccess: (res) => {
                            toast.success(
                              `${plan.name} linked to Stripe (${res.plan.mode === "live" ? "live" : "test"} mode)`,
                            );
                            void logAudit({
                              action: "plan.stripe_linked",
                              targetType: "orders_plan",
                              targetId: plan.id,
                              newValue: {
                                monthly_price_id: res.plan.monthly_price_id,
                                annual_price_id: res.plan.annual_price_id,
                                mode: res.plan.mode,
                              },
                            }).catch(() => undefined);
                          },
                          onError: (err) =>
                            toast.error(err instanceof Error ? err.message : "Could not link this plan to Stripe."),
                          onSettled: () => setLinkingId(null),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(plan)} aria-label={`Edit ${plan.name}`}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-sm font-semibold">Platform fee history</h2>
        {feeChanges.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No fee changes recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {feeChanges.map((change) => {
              const plan = plans.find((p) => p.id === change.plan_id);
              return (
                <li
                  key={change.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm"
                >
                  <span className="font-medium">{plan?.name ?? "Plan"}</span>
                  <span className="text-muted-foreground">
                    {change.old_fee_bps == null ? "—" : formatFeeBps(change.old_fee_bps)} →{" "}
                    <span className="font-medium text-foreground">{formatFeeBps(change.new_fee_bps)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{change.reason ?? "No reason recorded"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(change.created_at).toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Stripe product and price IDs are attached when the Stripe Connect integration is enabled. Until then, paid plan
        checkout is unavailable rather than simulated.
      </p>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input className="mt-2" {...field("name")} />
                </div>
                <div>
                  <Label>Positioning</Label>
                  <Input className="mt-2" {...field("positioning")} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea className="mt-2" {...field("description")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Monthly price ($)</Label>
                  <Input className="mt-2" inputMode="decimal" {...field("monthly_price")} />
                </div>
                <div>
                  <Label>Annual price ($)</Label>
                  <Input className="mt-2" inputMode="decimal" {...field("annual_price")} />
                </div>
                <div>
                  <Label>Platform fee (%)</Label>
                  <Input className="mt-2" inputMode="decimal" {...field("platform_fee_pct")} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Annual billing active</p>
                  <p className="text-xs text-muted-foreground">Shows the annual option on the public pricing table.</p>
                </div>
                <Switch
                  checked={draft.annual_billing_active}
                  onCheckedChange={(v) => setDraft((d) => (d ? { ...d, annual_billing_active: v } : d))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fee label</Label>
                  <Input className="mt-2" {...field("fee_label")} />
                </div>
                <div>
                  <Label>Annual note</Label>
                  <Input className="mt-2" {...field("annual_note")} />
                </div>
                <div>
                  <Label>Price label (non-numeric plans)</Label>
                  <Input className="mt-2" {...field("price_label")} />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input className="mt-2" {...field("badge")} />
                </div>
                <div>
                  <Label>Primary CTA label</Label>
                  <Input className="mt-2" {...field("cta_label")} />
                </div>
                <div>
                  <Label>Primary CTA link</Label>
                  <Input className="mt-2" {...field("cta_href")} />
                </div>
                <div>
                  <Label>Secondary CTA label</Label>
                  <Input className="mt-2" {...field("cta_secondary_label")} />
                </div>
                <div>
                  <Label>Secondary CTA link</Label>
                  <Input className="mt-2" {...field("cta_secondary_href")} />
                </div>
              </div>

              <div>
                <Label>Features (one per line)</Label>
                <Textarea className="mt-2 min-h-40" {...field("features")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <p className="text-sm font-medium">Public</p>
                  <Switch
                    checked={draft.is_public}
                    onCheckedChange={(v) => setDraft((d) => (d ? { ...d, is_public: v } : d))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <p className="text-sm font-medium">Active</p>
                  <Switch
                    checked={draft.is_active}
                    onCheckedChange={(v) => setDraft((d) => (d ? { ...d, is_active: v } : d))}
                  />
                </div>
                <div>
                  <Label>Display order</Label>
                  <Input className="mt-2" inputMode="numeric" {...field("display_order")} />
                </div>
                <div>
                  <Label>Reason for change</Label>
                  <Input className="mt-2" placeholder="Recorded in the audit log" {...field("fee_reason")} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminPlans;
