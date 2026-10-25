import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  computeBalance, computeFunds, emailSetupAdmin, HANDOFF_ITEMS, handoffMissing, MANAGEMENT_PLANS, MANAGEMENT_STATUS_LABELS,
  requiredHandoff, STAGES, usd, type ChangeStatus, type ManagementPlan, type PurchaseMode, type ThirdPartyLine,
} from "@/lib/services/emailSetup";

type Req = Tables<"email_setup_requests">;
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const dollars = (v: string) => Math.round(Number(v) * 100);

export function EmailSetupPurchasing({ r, onChanged }: { r: Req; onChanged: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mode = r.purchase_mode as PurchaseMode;
  const purchasing = mode === "loumilab_purchase";
  const key = ["admin", "email-setup", r.id, "purchasing"];

  const data = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [p, c, pay, m] = await Promise.all([
        supabase.from("email_setup_purchases").select("*").eq("request_id", r.id).order("created_at"),
        supabase.from("email_setup_change_sets").select("status,total_after_cents,total_before_cents,amount_due_cents").eq("request_id", r.id).order("created_at"),
        supabase.from("email_setup_payments").select("kind,amount_cents").eq("request_id", r.id),
        supabase.from("email_setup_mgmt_checks").select("*").eq("request_id", r.id).order("created_at", { ascending: false }),
      ]);
      return { purchases: p.data ?? [], changes: c.data ?? [], payments: pay.data ?? [], checks: m.data ?? [] };
    },
  });
  const act = useMutation({
    mutationFn: emailSetupAdmin,
    onSuccess: () => { onChanged(); qc.invalidateQueries({ queryKey: ["admin", "email-setup", r.id] }); toast({ title: "Saved" }); },
    onError: (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  const bal = data.data ? computeBalance(r, data.data.changes as { status: ChangeStatus; total_after_cents: number; total_before_cents: number; amount_due_cents: number }[], data.data.payments as { kind: "charge" | "refund"; amount_cents: number }[]) : null;
  const funds = bal && data.data ? computeFunds({ agreedTotalCents: bal.totalCents, budgetCents: r.third_party_budget_cents, netPaidCents: bal.netPaidCents, purchases: data.data.purchases }) : null;

  // Quote
  const [svc, setSvc] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<{ label: string; amount: string; billing: string }[]>([
    { label: "Domain registration", amount: "", billing: "1 year, renews yearly" },
    { label: "Email hosting", amount: "", billing: "First month, then monthly" },
  ]);
  const tpLines: ThirdPartyLine[] = lines.filter((l) => l.label.trim() && Number(l.amount) > 0).map((l) => ({ label: l.label.trim(), cents: dollars(l.amount), billing: l.billing.trim() || "See provider" }));
  // Purchase
  const [pf, setPf] = useState({ kind: "domain", vendor: "", amount: "", purchased_on: new Date().toISOString().slice(0, 10), reference: "", commitment: "", renews_on: "", description: "" });
  // Extra cost
  const [extra, setExtra] = useState(""); const [extraWhy, setExtraWhy] = useState("");
  // Handoff
  const [handoff, setHandoff] = useState<Record<string, boolean>>((r.handoff ?? {}) as Record<string, boolean>);
  const [review, setReview] = useState(r.handoff_manual_review);
  const [custMsg, setCustMsg] = useState(r.handoff_customer_actions ?? "Accept the account invitations we sent, set your own password and recovery options, and add your payment method in each provider's billing page.");
  const [stage, setStage] = useState(r.fulfillment_stage);
  const [check, setCheck] = useState({ kind: "monthly_dns", notes: "" });
  const req = new Set(requiredHandoff(mode));
  const h = handoffMissing(mode, handoff, review);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant={purchasing ? "default" : "secondary"}>{purchasing ? "Loumilab buys services" : "Customer pays providers"}</Badge>
        {purchasing && <Badge variant="outline">{r.purchase_auth_at ? `Authorized ${new Date(r.purchase_auth_at).toLocaleDateString()}` : "Not authorized yet"}</Badge>}
      </div>

      {purchasing && !(bal && bal.chargedCents > 0) && (
        <section className="space-y-2 rounded-2xl border border-border p-4">
          <h3 className="font-semibold">Itemized quote (confirmed prices only)</h3>
          <Input type="number" min={0} step="0.01" placeholder="Loumilab setup fee ($)" value={svc} onChange={(e) => setSvc(e.target.value)} />
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem] gap-2">
              <Input placeholder="Item (e.g. acme.com registration, Namecheap)" value={l.label} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <Input type="number" min={0} step="0.01" placeholder="$" value={l.amount} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
              <Input className="col-span-2" placeholder="Billing period and commitment (e.g. annual commitment, billed monthly)" value={l.billing} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, billing: e.target.value } : x))} />
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setLines((p) => [...p, { label: "", amount: "", billing: "" }])}>Add provider item</Button>
          <Textarea rows={2} placeholder="Note for the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="text-sm">Total: <b>{usd((Number(svc) > 0 ? dollars(svc) : 0) + tpLines.reduce((n, l) => n + l.cents, 0))}</b></p>
          <Button size="sm" disabled={!(Number(svc) >= 1) || !tpLines.length || act.isPending}
            onClick={() => act.mutate({ action: "quote", id: r.id, cents: dollars(svc), note: note || undefined, third_party_lines: tpLines })}>Send quote for authorization</Button>
          <p className="text-xs text-muted-foreground">Sending a new quote clears any earlier authorization.</p>
        </section>
      )}

      {purchasing && funds && (
        <section className="space-y-1 rounded-2xl border border-border p-4 text-sm">
          <h3 className="mb-2 font-semibold">Funds</h3>
          {([
            ["Customer funds collected", funds.collectedCents],
            ["Loumilab service revenue", funds.serviceRevenueCents],
            ["Approved third-party budget", funds.budgetCents],
            ["Third-party funds held", funds.purchasingFundsCents],
            ["Actual purchase expenses", funds.spentCents],
          ] as [string, number][]).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{usd(v)}</span></div>)}
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>{funds.remainingCents >= 0 ? "Remaining (unspent)" : "Shortfall"}</span><span>{usd(Math.abs(funds.remainingCents))}</span>
          </div>
          {r.service_status === "completed" && funds.unspentOwedCents > 0 && (
            <p className="mt-2 rounded-xl bg-accent-soft p-2 text-xs">{usd(funds.unspentOwedCents)} of unused purchasing funds belongs to the customer. Refund it in Stripe (it's recorded here automatically) or record a credit they approved.</p>
          )}
        </section>
      )}

      {purchasing && (
        <section className="space-y-2 rounded-2xl border border-border p-4">
          <h3 className="font-semibold">Purchases made</h3>
          {data.data?.purchases.map((p) => (
            <div key={p.id} className="flex justify-between gap-3 border-b border-border py-1 text-sm">
              <span>{p.kind} · {p.vendor}{p.reference && ` · ${p.reference}`}<span className="block text-xs text-muted-foreground">{p.purchased_on}{p.commitment && ` · ${p.commitment}`}{p.renews_on && ` · renews ${p.renews_on}`}</span></span>
              <span>{usd(p.amount_cents)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <select className={sel} value={pf.kind} onChange={(e) => setPf({ ...pf, kind: e.target.value })}>
              <option value="domain">Domain</option><option value="email_hosting">Email hosting</option><option value="other">Other</option><option value="correction">Correction (+/−)</option>
            </select>
            <Input placeholder="Provider / registrar" value={pf.vendor} onChange={(e) => setPf({ ...pf, vendor: e.target.value })} />
            <Input type="number" step="0.01" placeholder="Amount paid ($)" value={pf.amount} onChange={(e) => setPf({ ...pf, amount: e.target.value })} />
            <Input type="date" aria-label="Purchase date" value={pf.purchased_on} onChange={(e) => setPf({ ...pf, purchased_on: e.target.value })} />
            <Input placeholder="Order / invoice reference" value={pf.reference} onChange={(e) => setPf({ ...pf, reference: e.target.value })} />
            <Input type="date" aria-label="Renewal date" value={pf.renews_on} onChange={(e) => setPf({ ...pf, renews_on: e.target.value })} />
            <Input className="col-span-2" placeholder="Billing commitment (e.g. annual plan, renews yearly)" value={pf.commitment} onChange={(e) => setPf({ ...pf, commitment: e.target.value })} />
          </div>
          <Button size="sm" disabled={!pf.vendor || !Number(pf.amount) || act.isPending} onClick={() => act.mutate({
            action: "record_purchase", id: r.id, kind: pf.kind, vendor: pf.vendor, amount_cents: dollars(pf.amount), purchased_on: pf.purchased_on,
            reference: pf.reference || undefined, commitment: pf.commitment || undefined, renews_on: pf.renews_on || undefined,
          })}>Record purchase</Button>
          <p className="text-xs text-muted-foreground">Entries can't be edited. Use a correction to fix mistakes. Purchases over the paid budget are blocked.</p>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <p className="text-sm font-medium">Price went up? Ask the customer for the difference</p>
            <Input type="number" min={0} step="0.01" placeholder="Extra provider cost ($)" value={extra} onChange={(e) => setExtra(e.target.value)} />
            <Textarea rows={2} placeholder="Explanation for the customer" value={extraWhy} onChange={(e) => setExtraWhy(e.target.value)} />
            <Button size="sm" variant="outline" disabled={!(Number(extra) > 0) || extraWhy.trim().length < 5 || act.isPending}
              onClick={() => act.mutate({ action: "propose_change", id: r.id, package_to: r.package, lines: [], third_party_cents: dollars(extra), customer_reason: extraWhy })}>Request approval and payment</Button>
          </div>
        </section>
      )}

      <section className="space-y-2 rounded-2xl border border-border p-4">
        <h3 className="font-semibold">Customer progress stage</h3>
        <select className={sel} value={stage} onChange={(e) => setStage(e.target.value)}>
          {STAGES.filter(([k]) => k !== "completed").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Button size="sm" disabled={stage === r.fulfillment_stage || act.isPending} onClick={() => act.mutate({ action: "set_stage", id: r.id, stage })}>Update stage (emails customer)</Button>
      </section>

      <section className="space-y-2 rounded-2xl border border-border p-4">
        <h3 className="font-semibold">Billing and ownership handoff</h3>
        {HANDOFF_ITEMS.filter(([k]) => req.has(k)).map(([k, label]) => (
          <label key={k} className="flex items-start gap-2 py-0.5 text-sm"><Checkbox className="mt-0.5" checked={!!handoff[k]} onCheckedChange={(v) => setHandoff((p) => ({ ...p, [k]: v === true }))} />{label}</label>
        ))}
        <label className="flex items-start gap-2 pt-2 text-sm"><Checkbox className="mt-0.5" checked={review} onCheckedChange={(v) => setReview(v === true)} />
          Provider can't transfer billing. Flag for manual review and switch to customer-direct payment. Don't cancel active services.</label>
        <p className="text-xs text-muted-foreground">{h.canComplete ? "Ready. You can mark the order Completed." : review ? "Flagged for manual review. Can't complete yet." : `${h.missing.length} item(s) left before completion.`}</p>
        <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ action: "update_handoff", id: r.id, handoff, manual_review: review })}>Save handoff</Button>
        <Textarea rows={3} value={custMsg} onChange={(e) => setCustMsg(e.target.value)} />
        <Button size="sm" variant="outline" disabled={custMsg.trim().length < 5 || act.isPending} onClick={() => act.mutate({ action: "handoff_action", id: r.id, message: custMsg })}>Email customer their handoff steps</Button>
      </section>

      <section className="space-y-2 rounded-2xl border border-border p-4 text-sm">
        <h3 className="font-semibold">Management plan</h3>
        <p>{r.management_plan ? MANAGEMENT_PLANS[r.management_plan as ManagementPlan].label : "None"} · {MANAGEMENT_STATUS_LABELS[r.management_status]}</p>
        {r.management_status !== "none" && (<>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select className={sel} value={check.kind} onChange={(e) => setCheck({ ...check, kind: e.target.value })}>
              <option value="monthly_dns">Monthly MX/SPF/DKIM/DMARC check</option><option value="expiration_reminder">Domain expiration reminder</option>
              <option value="quarterly_review">Quarterly review</option><option value="security_review">Annual security review</option>
              <option value="support_request">Support request</option><option value="other">Other</option>
            </select>
            <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => { act.mutate({ action: "log_check", id: r.id, kind: check.kind, notes: check.notes || undefined }); setCheck({ ...check, notes: "" }); }}>Log</Button>
          </div>
          <Input placeholder="Notes (optional)" value={check.notes} onChange={(e) => setCheck({ ...check, notes: e.target.value })} />
          {data.data?.checks.slice(0, 8).map((c) => <div key={c.id} className="flex justify-between border-b border-border py-1"><span>{c.kind.replace(/_/g, " ")}{c.notes && ` · ${c.notes}`}</span><span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span></div>)}
        </>)}
      </section>
    </div>
  );
}
