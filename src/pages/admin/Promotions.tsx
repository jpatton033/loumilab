import { useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { PromoBannerView } from "@/components/orders/PromoBanner";
import {
  bpsToPct,
  ELIGIBILITY_LABELS,
  formatDeadline,
  isMerchantPromoLive,
  promoDaysLeft,
  promoStats,
  TRIGGER_LABELS,
  useAdminPromotions,
  useEndMerchantPromotion,
  useSavePromotion,
  useSetPromotionStatus,
  type MerchantPromotion,
  type Promotion,
  type PromotionInput,
  type PromoEligibility,
  type PromoTrigger,
} from "@/lib/orders/promotions";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Convert a YYYY-MM-DD in New York time to an ISO instant (start or end of that day). */
const etDayToIso = (day: string, endOfDay: boolean) => {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(new Date(guess))
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const offsetHours = Number(parts.replace("GMT", "") || 0);
  return new Date(guess - offsetHours * 3_600_000).toISOString();
};
const isoToEtDay = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso)) : "";

const blank: PromotionInput = {
  name: "",
  description: "",
  message: "",
  terms: "",
  fee_bps: 0,
  duration_days: 14,
  starts_at: new Date().toISOString(),
  signup_deadline: null,
  start_trigger: "publish",
  eligibility: "new",
  selected_merchant_ids: [],
  show_homepage: true,
  show_builder: true,
  show_onboarding: true,
};

const statusVariant = (s: Promotion["status"]) => (s === "active" ? "default" : "outline");

const Promotions = () => {
  const { data, isLoading } = useAdminPromotions();
  const save = useSavePromotion();
  const setStatus = useSetPromotionStatus();
  const endEarly = useEndMerchantPromotion();
  const { toast } = useToast();

  const [editing, setEditing] = useState<{ id?: string; input: PromotionInput; previous?: Promotion } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ending, setEnding] = useState<MerchantPromotion | null>(null);
  const [endReason, setEndReason] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const promotions = (data?.promotions ?? []).filter((p) => showArchived || p.status !== "archived");
  const selected = data?.promotions.find((p) => p.id === selectedId) ?? promotions[0];
  const participants = useMemo(
    () => (data?.participants ?? []).filter((p) => p.promotion_id === selected?.id),
    [data, selected],
  );
  const stats = promoStats(participants, data?.lastPaid ?? new Map());

  const fail = (e: unknown) =>
    toast({ title: "Couldn't save", description: e instanceof Error ? e.message : String(e), variant: "destructive" });

  const toggle = (p: Promotion, on: boolean) =>
    setStatus.mutate(
      { promo: p, status: on ? "active" : "paused" },
      { onSuccess: () => toast({ title: on ? "Promotion is live" : "Promotion paused" }), onError: fail },
    );

  const submit = () => {
    if (!editing) return;
    const i = editing.input;
    if (!i.name.trim()) return fail(new Error("Give the campaign a name."));
    if (i.signup_deadline && new Date(i.signup_deadline) <= new Date(i.starts_at))
      return fail(new Error("The deadline must be after the start date."));
    save.mutate(editing, {
      onSuccess: () => {
        toast({ title: "Promotion saved" });
        setEditing(null);
      },
      onError: fail,
    });
  };

  const set = <K extends keyof PromotionInput>(k: K, v: PromotionInput[K]) =>
    setEditing((e) => (e ? { ...e, input: { ...e.input, [k]: v } } : e));

  const merchantOptions = [...(data?.merchantNames ?? new Map()).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <AdminShell
      title="Promotions"
      description="Platform-fee offers for Loumilab Orders. Only Loumilab's fee changes — Stripe fees, taxes, tips and subscriptions are never affected. Every change is recorded in the audit log."
    >
      <SEOHead title="Promotions | Loumilab Admin" description="Loumilab Orders promotions." path="/admin/promotions" noindex />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} /> Show archived
        </label>
        <Button onClick={() => setEditing({ input: { ...blank, starts_at: new Date().toISOString() } })}>New promotion</Button>
      </div>

      <div className="rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {promotions.map((p) => (
              <TableRow key={p.id} className={selected?.id === p.id ? "bg-muted/40" : ""} onClick={() => setSelectedId(p.id)}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm">{bpsToPct(p.fee_bps)} fee · {p.duration_days} days</TableCell>
                <TableCell className="text-sm">{p.signup_deadline ? formatDeadline(p.signup_deadline) : "Not set"}</TableCell>
                <TableCell><Badge variant={statusVariant(p.status)} className="capitalize">{p.status}</Badge></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    aria-label={`Turn ${p.name} on or off`}
                    checked={p.status === "active"}
                    disabled={p.status === "archived" || setStatus.isPending}
                    onCheckedChange={(on) => toggle(p, on)}
                  />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const { id, created_at, status, ...input } = p;
                      void created_at; void status;
                      setEditing({ id, input, previous: p });
                    }}>Edit</Button>
                    {p.status !== "archived" ? (
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm("Archive this campaign? It stops accepting merchants. Merchants who already qualified keep their benefit.")) {
                          setStatus.mutate({ promo: p, status: "archived" }, { onError: fail });
                        }
                      }}>Archive</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ promo: p, status: "paused" }, { onError: fail })}>Restore</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !promotions.length && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No promotions yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-muted-foreground">
              {ELIGIBILITY_LABELS[selected.eligibility]} · starts {TRIGGER_LABELS[selected.start_trigger].toLowerCase()}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {[
              ["Qualified", stats.qualified],
              ["Started", stats.activated],
              ["On promo now", stats.current],
              ["Finished", stats.expired],
              ["Promo sales", money(stats.volumeCents)],
              ["Fees waived", money(stats.waivedCents)],
              ["Still selling after", stats.retained],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-3xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Banner preview</p>
            <PromoBannerView
              promo={{
                ...selected,
                signup_deadline: selected.signup_deadline ?? new Date().toISOString(),
              }}
            />
            {selected.eligibility !== "new" && (
              <p className="mt-2 text-xs text-muted-foreground">Only new-merchant campaigns show on public pages.</p>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qualified</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Waived</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((mp) => {
                  const live = isMerchantPromoLive(mp);
                  return (
                    <TableRow key={mp.id}>
                      <TableCell>{data?.merchantNames.get(mp.merchant_id) ?? "Merchant"}</TableCell>
                      <TableCell className="capitalize">
                        {live ? `Active · ${promoDaysLeft(mp.expires_at)}d left` : mp.status === "active" ? "expired" : mp.status}
                      </TableCell>
                      <TableCell className="text-sm">{new Date(mp.qualified_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{mp.expires_at ? formatDeadline(mp.expires_at) : "Not started"}</TableCell>
                      <TableCell className="text-sm">{bpsToPct(mp.promo_fee_bps)} (normally {bpsToPct(mp.normal_fee_bps)})</TableCell>
                      <TableCell className="text-sm">{money(Number(mp.eligible_volume_cents))}</TableCell>
                      <TableCell className="text-sm">{money(Number(mp.fees_waived_cents))}</TableCell>
                      <TableCell className="text-right">
                        {(live || mp.status === "qualified") && (
                          <Button size="sm" variant="ghost" onClick={() => { setEnding(mp); setEndReason(""); }}>End early</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!participants.length && (
                  <TableRow><TableCell colSpan={8} className="text-muted-foreground">No merchants have qualified yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit promotion" : "New promotion"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              {editing.id && (
                <p className="text-xs text-muted-foreground">Changes apply to merchants who qualify from now on. Merchants who already qualified keep their terms.</p>
              )}
              <div className="grid gap-2"><Label>Campaign name</Label><Input value={editing.input.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Promo message (headline)</Label><Input value={editing.input.message} onChange={(e) => set("message", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Description</Label><Textarea rows={2} value={editing.input.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Terms (shown in small print)</Label><Textarea rows={3} value={editing.input.terms} onChange={(e) => set("terms", e.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Loumilab fee during promo (%)</Label>
                  <Input type="number" min={0} max={10} step={0.25} value={editing.input.fee_bps / 100}
                    onChange={(e) => set("fee_bps", Math.min(1000, Math.max(0, Math.round(Number(e.target.value) * 100))))} />
                </div>
                <div className="grid gap-2">
                  <Label>Length (days)</Label>
                  <Input type="number" min={1} max={365} value={editing.input.duration_days}
                    onChange={(e) => set("duration_days", Math.min(365, Math.max(1, Math.round(Number(e.target.value)))))} />
                </div>
                <div className="grid gap-2">
                  <Label>Start date (Eastern)</Label>
                  <Input type="date" value={isoToEtDay(editing.input.starts_at)} onChange={(e) => e.target.value && set("starts_at", etDayToIso(e.target.value, false))} />
                </div>
                <div className="grid gap-2">
                  <Label>Signup deadline (end of day, Eastern)</Label>
                  <Input type="date" value={isoToEtDay(editing.input.signup_deadline)} onChange={(e) => set("signup_deadline", e.target.value ? etDayToIso(e.target.value, true) : null)} />
                </div>
                <div className="grid gap-2">
                  <Label>Promo clock starts</Label>
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={editing.input.start_trigger}
                    onChange={(e) => set("start_trigger", e.target.value as PromoTrigger)}>
                    {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Who qualifies</Label>
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={editing.input.eligibility}
                    onChange={(e) => set("eligibility", e.target.value as PromoEligibility)}>
                    {Object.entries(ELIGIBILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {editing.input.eligibility === "selected" && (
                <div className="grid gap-2">
                  <Label>Chosen merchants</Label>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border p-3">
                    {merchantOptions.map(([id, name]) => (
                      <label key={id} className="flex items-center gap-2 py-1 text-sm">
                        <input type="checkbox" checked={editing.input.selected_merchant_ids.includes(id)}
                          onChange={(e) => set("selected_merchant_ids", e.target.checked
                            ? [...editing.input.selected_merchant_ids, id]
                            : editing.input.selected_merchant_ids.filter((x) => x !== id))} />
                        {name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Show the message on</Label>
                {([["show_homepage", "Orders homepage"], ["show_builder", "Store builder"], ["show_onboarding", "Merchant onboarding"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-3 text-sm">
                    <Switch checked={editing.input[k]} onCheckedChange={(v) => set(k, v)} /> {l}
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(ending)} onOpenChange={(o) => !o && setEnding(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>End this merchant's promotion early?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Their normal Loumilab fee applies from their next order. Only do this when the campaign terms allow it. This is recorded in the audit log.
          </p>
          <div className="grid gap-2"><Label>Reason</Label><Input value={endReason} onChange={(e) => setEndReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnding(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!endReason.trim() || endEarly.isPending}
              onClick={() => ending && endEarly.mutate({ mp: ending, reason: endReason.trim() }, {
                onSuccess: () => { toast({ title: "Promotion ended" }); setEnding(null); },
                onError: fail,
              })}>End promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default Promotions;
