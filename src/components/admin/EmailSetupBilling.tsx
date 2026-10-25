import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  ADDON_PRICES, computeBalance, emailSetupAdmin, PACKAGE_LABELS, PACKAGE_PRICES, priceLine, usd,
  type AddonKey, type ChangeStatus, type EmailPackage, type ProviderPrice,
} from "@/lib/services/emailSetup";

type Req = Tables<"email_setup_requests">;
interface DraftLine { kind: "addon" | "custom" | "discount" | "credit"; addon: AddonKey; label: string; quantity: number; unit: string; reason: string; note: string }

const newLine = (kind: DraftLine["kind"]): DraftLine => ({
  kind, addon: "mailbox", label: "", quantity: 1, unit: kind === "addon" ? (ADDON_PRICES.mailbox.cents / 100).toFixed(2) : "", reason: "", note: "",
});
const toCents = (v: string) => Math.round((Number(v) || 0) * 100);
const sel = "h-10 rounded-md border border-input bg-background px-2 text-sm";

export function EmailSetupBilling({ r, onChanged }: { r: Req; onChanged: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const data = useQuery({
    queryKey: ["admin", "email-setup", r.id, "billing"],
    queryFn: async () => {
      const [c, a, p] = await Promise.all([
        supabase.from("email_setup_change_sets").select("*").eq("request_id", r.id).order("created_at"),
        supabase.from("email_setup_adjustments").select("*").eq("request_id", r.id).order("created_at"),
        supabase.from("email_setup_payments").select("*").eq("request_id", r.id).order("created_at"),
      ]);
      return { changes: c.data ?? [], adjustments: a.data ?? [], payments: p.data ?? [] };
    },
  });
  const changes = data.data?.changes ?? [];
  const payments = data.data?.payments ?? [];
  const bal = computeBalance(r, changes.map((c) => ({ ...c, status: c.status as ChangeStatus })), payments.map((p) => ({ kind: p.kind as "charge" | "refund", amount_cents: p.amount_cents })));
  const open = changes.find((c) => c.status === "proposed" || c.status === "approved");

  const [editing, setEditing] = useState(false);
  const [pkgTo, setPkgTo] = useState<EmailPackage>(r.package as EmailPackage);
  const [pkgReason, setPkgReason] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [why, setWhy] = useState("");
  const [internal, setInternal] = useState("");

  const preview = useMemo(() => {
    const from = r.package as EmailPackage;
    const amounts = lines.map((l) => priceLine({ kind: l.kind, addon: l.addon, label: l.label, quantity: l.quantity, unit_cents: toCents(l.unit) }, from, pkgTo).amount_cents);
    if (pkgTo !== from) amounts.push(PACKAGE_PRICES[pkgTo] - PACKAGE_PRICES[from]);
    const after = bal.totalCents + amounts.reduce((n, a) => n + a, 0);
    return { after, due: Math.max(0, after - bal.netPaidCents), credit: Math.max(0, bal.netPaidCents - after) };
  }, [lines, pkgTo, r.package, bal.totalCents, bal.netPaidCents]);

  const refresh = () => { onChanged(); qc.invalidateQueries({ queryKey: ["admin", "email-setup", r.id] }); };
  const act = useMutation({
    mutationFn: emailSetupAdmin,
    onSuccess: () => { refresh(); toast({ title: "Done" }); },
    onError: (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });
  const upd = (i: number, patch: Partial<DraftLine>) => setLines((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const send = () => act.mutate({
    action: "propose_change", id: r.id, package_to: pkgTo, package_reason: pkgReason || undefined,
    customer_reason: why, internal_note: internal || undefined,
    lines: lines.map((l) => ({ kind: l.kind, addon: l.kind === "addon" ? l.addon : undefined, label: l.label || undefined, quantity: l.quantity, unit_cents: toCents(l.unit), reason: l.reason, customer_note: l.note || undefined })),
  }, { onSuccess: () => { setEditing(false); setLines([]); setWhy(""); setInternal(""); setPkgReason(""); } });

  const valid = why.trim().length >= 5 && (pkgTo !== r.package || lines.length > 0) && lines.every((l) => l.reason.trim().length >= 3 && (l.kind === "addon" || toCents(l.unit) > 0)) && preview.after >= 0;

  return (
    <section className="space-y-4 rounded-2xl border border-border p-4">
      <h3 className="font-semibold">Order &amp; billing</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Original order</dt><dd className="text-right">{usd(bal.originalCents)}</dd>
        <dt className="text-muted-foreground">Approved adjustments</dt><dd className="text-right">{usd(bal.adjustmentsCents)}</dd>
        <dt className="font-semibold">Current total</dt><dd className="text-right font-semibold">{usd(bal.totalCents)}</dd>
        <dt className="text-muted-foreground">Paid</dt><dd className="text-right">{usd(bal.chargedCents)}</dd>
        <dt className="text-muted-foreground">Refunds</dt><dd className="text-right">{usd(bal.refundedCents)}</dd>
        <dt className="font-semibold">{bal.balanceCents >= 0 ? "Outstanding" : "Credit owed"}</dt><dd className="text-right font-semibold">{usd(Math.abs(bal.balanceCents))}</dd>
        <dt className="text-muted-foreground">Pending requests</dt><dd className="text-right">{usd(bal.pendingCents)}</dd>
      </dl>
      {bal.balanceCents < 0 && <p className="rounded-xl bg-accent-soft p-3 text-xs">A credit is owed. Issue any refund in Stripe; it's recorded here automatically.</p>}

      {open ? (
        <div className="rounded-xl bg-surface-subtle p-3 text-sm">
          <div className="flex items-center justify-between"><b>Open change</b><Badge variant="secondary">{open.status === "proposed" ? "Awaiting approval" : "Approved — awaiting payment"}</Badge></div>
          <p className="mt-1">{usd(open.total_before_cents)} → {usd(open.total_after_cents)} · due {usd(open.amount_due_cents)}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ action: "resend_change", id: r.id, change_set_id: open.id })}>Resend</Button>
            <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => confirm("Cancel this unpaid change?") && act.mutate({ action: "cancel_change", id: r.id, change_set_id: open.id })}>Cancel request</Button>
          </div>
        </div>
      ) : !editing ? (
        <Button size="sm" onClick={() => setEditing(true)}>Change order / Add charge</Button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Package</span>
            <select className={sel} value={pkgTo} onChange={(e) => setPkgTo(e.target.value as EmailPackage)}>
              {(Object.keys(PACKAGE_LABELS) as EmailPackage[]).map((k) => <option key={k} value={k}>{PACKAGE_LABELS[k]} ({usd(PACKAGE_PRICES[k])})</option>)}
            </select>
          </div>
          {pkgTo !== r.package && <Input placeholder="Why the package is changing (shown to customer)" value={pkgReason} onChange={(e) => setPkgReason(e.target.value)} />}
          {lines.map((l, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{l.kind}</Badge>
                {l.kind === "addon" ? (
                  <select className={sel} value={l.addon} onChange={(e) => { const a = e.target.value as AddonKey; upd(i, { addon: a, unit: (ADDON_PRICES[a].cents / 100).toFixed(2) }); }}>
                    {(Object.keys(ADDON_PRICES) as AddonKey[]).map((k) => <option key={k} value={k}>{ADDON_PRICES[k].label}</option>)}
                  </select>
                ) : <Input className="flex-1" placeholder="Description" value={l.label} onChange={(e) => upd(i, { label: e.target.value })} />}
                <Input className="w-20" type="number" min={1} value={l.quantity} onChange={(e) => upd(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Quantity" />
                <Input className="w-28" type="number" min={0} step="0.01" placeholder="Unit $" value={l.unit} onChange={(e) => upd(i, { unit: e.target.value })} aria-label="Unit price" />
                <Button size="sm" variant="ghost" onClick={() => setLines((p) => p.filter((_, j) => j !== i))}>Remove</Button>
              </div>
              <Input placeholder="Internal reason (required)" value={l.reason} onChange={(e) => upd(i, { reason: e.target.value })} />
              <Input placeholder="Explanation for customer (optional)" value={l.note} onChange={(e) => upd(i, { note: e.target.value })} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setLines((p) => [...p, newLine("addon")])}>+ Add-on</Button>
            <Button size="sm" variant="outline" onClick={() => setLines((p) => [...p, newLine("custom")])}>+ Custom charge</Button>
            <Button size="sm" variant="outline" onClick={() => setLines((p) => [...p, newLine("discount")])}>+ Discount</Button>
            <Button size="sm" variant="outline" onClick={() => setLines((p) => [...p, newLine("credit")])}>+ Credit</Button>
          </div>
          <Textarea rows={2} placeholder="Explanation to the customer of why this change is needed (required)" value={why} onChange={(e) => setWhy(e.target.value)} />
          <Textarea rows={2} placeholder="Internal note (optional)" value={internal} onChange={(e) => setInternal(e.target.value)} />
          <p className="rounded-xl bg-surface-subtle p-3 text-sm">
            Revised total <b>{usd(preview.after)}</b> · already paid {usd(bal.netPaidCents)} · {preview.due > 0 ? <>customer will be asked for <b>{usd(preview.due)}</b></> : <>credit {usd(preview.credit)}</>}
            <span className="block text-xs text-muted-foreground">Final amounts are recalculated on the server. Nothing is charged until the customer approves.</span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" disabled={!valid || act.isPending} onClick={send}>Send for approval</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change history</p>
        {changes.length === 0 && <p className="text-sm text-muted-foreground">No changes.</p>}
        {[...changes].reverse().map((c) => (
          <div key={c.id} className="border-b border-border py-2 text-sm">
            <div className="flex justify-between"><span>{new Date(c.created_at).toLocaleString()}</span><Badge variant="outline">{c.status}</Badge></div>
            <p>{usd(c.total_before_cents)} → {usd(c.total_after_cents)} · due {usd(c.amount_due_cents)}{c.credit_cents ? ` · credit ${usd(c.credit_cents)}` : ""}</p>
            <ul className="text-xs text-muted-foreground">
              {data.data?.adjustments.filter((a) => a.change_set_id === c.id).map((a) => <li key={a.id}>{a.label}{a.quantity > 1 ? ` × ${a.quantity}` : ""}: {usd(a.amount_cents)} — {a.reason}</li>)}
            </ul>
            {c.internal_note && <p className="text-xs italic text-muted-foreground">{c.internal_note}</p>}
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment history</p>
        {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
        {payments.map((p) => (
          <div key={p.id} className="flex justify-between border-b border-border py-1.5 text-sm">
            <span>{p.kind === "charge" ? "Payment" : "Refund"} · {new Date(p.created_at).toLocaleString()}</span>
            <span>{p.kind === "refund" ? "−" : ""}{usd(p.amount_cents)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProviderPricingEditor() {
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "email-provider-prices"],
    queryFn: async () => ((await supabase.from("email_provider_prices").select("*").order("sort")).data ?? []) as ProviderPrice[],
  });
  const [edit, setEdit] = useState<Record<string, Partial<ProviderPrice>>>({});
  const save = async (p: ProviderPrice) => {
    const e = edit[p.key] ?? {};
    const { error } = await supabase.from("email_provider_prices").update({ ...e, checked_on: new Date().toISOString().slice(0, 10) }).eq("key", p.key);
    if (error) toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setEdit((x) => ({ ...x, [p.key]: {} })); q.refetch(); }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Estimates shown to customers before checkout. Check each provider's official page and update when prices change. Saving stamps today's date. The domain row's amount is per month (×12 shown as yearly).</p>
      {q.data?.map((p) => {
        const e = { ...p, ...(edit[p.key] ?? {}) };
        const set = (patch: Partial<ProviderPrice>) => setEdit((x) => ({ ...x, [p.key]: { ...(x[p.key] ?? {}), ...patch } }));
        return (
          <div key={p.key} className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <Input value={e.plan_name} onChange={(ev) => set({ plan_name: ev.target.value })} aria-label="Plan name" />
            <div className="flex items-center gap-2 text-sm">$<Input type="number" step="0.01" min={0} value={(e.monthly_cents / 100).toString()} onChange={(ev) => set({ monthly_cents: toCents(ev.target.value) })} aria-label="Monthly price" /> /month</div>
            <Textarea className="sm:col-span-2" rows={2} value={e.billing_note} onChange={(ev) => set({ billing_note: ev.target.value })} aria-label="Billing terms" />
            <Input className="sm:col-span-2" value={e.url} onChange={(ev) => set({ url: ev.target.value })} aria-label="Official pricing link" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.monthly_available} onChange={(ev) => set({ monthly_available: ev.target.checked })} /> Monthly billing available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.active} onChange={(ev) => set({ active: ev.target.checked })} /> Shown to customers</label>
            <div className="flex items-center justify-between sm:col-span-2">
              <span className="text-xs text-muted-foreground">Last checked {p.checked_on}</span>
              <Button size="sm" onClick={() => save(p)}>Save</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
