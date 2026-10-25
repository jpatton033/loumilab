import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  emailSetupAdmin, PACKAGE_LABELS, PAYMENT_STATUS_LABELS, PROVIDER_LABELS, SERVICE_STATUS_LABELS, usd,
  type EmailPackage, type EmailProvider,
} from "@/lib/services/emailSetup";
import type { Tables } from "@/integrations/supabase/types";

type Req = Tables<"email_setup_requests">;

const CHECKLIST: [string, string[]][] = [
  ["Domain configuration", ["Verify domain ownership or registration needs", "Help with domain registration if needed", "Confirm customer ownership", "Configure DNS records", "Verify domain connection"]],
  ["Email configuration", ["Confirm provider and subscription", "Configure the email environment", "Create mailboxes and aliases", "Configure MX, SPF, DKIM and DMARC", "Enable multi-factor authentication", "Configure requested devices", "Test sending and receiving"]],
  ["Final verification", ["Confirm inbound and outbound delivery", "Verify domain and email authentication", "Confirm customer access", "Provide admin guidance", "Document completion"]],
];

const AdminEmailSetup = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [svc, setSvc] = useState("all");
  const [pay, setPay] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "email-setup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_setup_requests").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const rows = useMemo(() => (list.data ?? []).filter((r) => {
    const s = search.toLowerCase();
    return (svc === "all" || r.service_status === svc) && (pay === "all" || r.payment_status === pay) &&
      (!s || [r.request_number, r.business_name, r.full_name, r.contact_email].some((v) => v?.toLowerCase().includes(s)));
  }), [list.data, search, svc, pay]);
  const open = list.data?.find((r) => r.id === openId) ?? null;

  return (
    <AdminShell>
      <SEOHead title="Email Setup | Admin" description="Business email setup requests" path="/admin/email-setup" noindex />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Business Email &amp; Domain Setup</h1>
          <p className="text-sm text-muted-foreground">Requests, payments and fulfillment.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input className="max-w-xs" placeholder="Search number, business, name, email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={svc} onChange={(e) => setSvc(e.target.value)}>
            <option value="all">All service statuses</option>
            {Object.entries(SERVICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={pay} onChange={(e) => setPay(e.target.value)}>
            <option value="all">All payment statuses</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr>
              {["Request", "Business", "Package", "Provider", "Total", "Payment", "Service", "Submitted"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t border-border hover:bg-surface-subtle" onClick={() => setOpenId(r.id)}>
                  <td className="px-4 py-3 font-medium">{r.request_number}</td>
                  <td className="px-4 py-3">{r.business_name}<div className="text-xs text-muted-foreground">{r.contact_email}</div></td>
                  <td className="px-4 py-3">{PACKAGE_LABELS[r.package as EmailPackage]}</td>
                  <td className="px-4 py-3">{PROVIDER_LABELS[r.provider as EmailProvider]}</td>
                  <td className="px-4 py-3">{r.needs_review ? (r.quote_cents ? usd(r.quote_cents) : "Quote") : usd(r.total_cents)}</td>
                  <td className="px-4 py-3"><Badge variant={r.payment_status === "paid" ? "default" : "secondary"}>{PAYMENT_STATUS_LABELS[r.payment_status]}</Badge></td>
                  <td className="px-4 py-3">{SERVICE_STATUS_LABELS[r.service_status]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!list.isLoading && rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && <Detail r={open} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "email-setup"] })} toast={toast} />}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
};

function Detail({ r, onChanged, toast }: { r: Req; onChanged: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const qc = useQueryClient();
  const intake = (r.intake ?? {}) as Record<string, unknown>;
  const checklist = (r.checklist ?? {}) as Record<string, boolean>;
  const [status, setStatus] = useState(r.service_status);
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [note, setNote] = useState("");

  const notes = useQuery({
    queryKey: ["admin", "email-setup", r.id, "notes"],
    queryFn: async () => (await supabase.from("email_setup_notes").select("*").eq("request_id", r.id).order("created_at", { ascending: false })).data ?? [],
  });
  const events = useQuery({
    queryKey: ["admin", "email-setup", r.id, "events"],
    queryFn: async () => (await supabase.from("email_setup_events").select("*").eq("request_id", r.id).order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => { onChanged(); qc.invalidateQueries({ queryKey: ["admin", "email-setup", r.id] }); };

  const action = useMutation({
    mutationFn: emailSetupAdmin,
    onSuccess: (res) => {
      refresh();
      if (res.token) {
        navigator.clipboard?.writeText(`${window.location.origin}/services/business-email/status/${res.token}`);
        toast({ title: "New private link copied", description: "The previous link no longer works." });
      } else toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  const toggle = async (item: string, v: boolean) => {
    await supabase.from("email_setup_requests").update({ checklist: { ...checklist, [item]: v } }).eq("id", r.id);
    onChanged();
  };
  const addNote = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("email_setup_notes").insert({ request_id: r.id, body: note.trim(), author_id: u.user?.id });
    if (error) toast({ title: "Couldn't add note", description: error.message, variant: "destructive" });
    else { setNote(""); refresh(); }
  };

  const info: [string, unknown][] = [
    ["Name", r.full_name], ["Email", r.contact_email], ["Phone", r.phone], ["Package", PACKAGE_LABELS[r.package as EmailPackage]],
    ["Provider", PROVIDER_LABELS[r.provider as EmailProvider]], ["Primary address", r.primary_address],
    ["Owns domain", intake.owns_domain ? "Yes" : "No"], ["Domain", intake.existing_domain || intake.desired_domain],
    ["Registrar access", intake.registrar_access], ["Mailboxes", r.mailboxes], ["Extra devices", r.extra_devices],
    ["Aliases", intake.aliases ? "Yes" : "No"], ["Migration", intake.migration ? "Yes" : "No"],
    ["Special requirements", intake.special_requirements], ["Notes", intake.notes],
  ];

  return (
    <div className="space-y-6">
      <SheetHeader><SheetTitle>{r.request_number} · {r.business_name}</SheetTitle></SheetHeader>
      <div className="flex flex-wrap gap-2">
        <Badge>{SERVICE_STATUS_LABELS[r.service_status]}</Badge>
        <Badge variant="secondary">Payment: {PAYMENT_STATUS_LABELS[r.payment_status]}</Badge>
        {r.paid_cents != null && <Badge variant="outline">Paid {usd(r.paid_cents)}</Badge>}
      </div>
      {r.needs_review && <p className="rounded-xl bg-accent-soft p-3 text-sm"><b>Review needed:</b> {r.review_reasons.join("; ")}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {info.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (<Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-line">{String(v)}</dd></Fragment>))}
      </dl>

      {!r.needs_review && (
        <div className="text-sm">{(r.price_lines as { label: string; cents: number }[]).map((l) => <div key={l.label} className="flex justify-between"><span>{l.label}</span><span>{usd(l.cents)}</span></div>)}
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{usd(r.total_cents)}</span></div></div>
      )}

      {r.needs_review && r.payment_status !== "paid" && (
        <section className="space-y-2 rounded-2xl border border-border p-4">
          <h3 className="font-semibold">Issue quote</h3>
          <Input type="number" min={1} step="0.01" placeholder="Amount in dollars" value={quote} onChange={(e) => setQuote(e.target.value)} />
          <Textarea rows={2} placeholder="What the quote covers (shown to customer)" value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} />
          <Button size="sm" disabled={!Number(quote) || action.isPending} onClick={() => action.mutate({ action: "quote", id: r.id, cents: Math.round(Number(quote) * 100), note: quoteNote })}>Send quote with payment link</Button>
        </section>
      )}

      <section className="space-y-2 rounded-2xl border border-border p-4">
        <h3 className="font-semibold">Service status</h3>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(SERVICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {status === "awaiting_customer" && <Textarea rows={3} placeholder="What the customer needs to do (emailed to them)" value={message} onChange={(e) => setMessage(e.target.value)} />}
        <p className="text-xs text-muted-foreground">Customers are emailed for In Progress, Awaiting Customer Action and Completed.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={status === r.service_status && status !== "awaiting_customer" || action.isPending}
            onClick={() => action.mutate({ action: "set_status", id: r.id, status, message: message || undefined })}>Update status</Button>
          <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ action: "new_link", id: r.id })}>Copy new customer link</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Fulfillment checklist</h3>
        {CHECKLIST.map(([group, items]) => (
          <div key={group}><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
            {items.map((i) => (
              <label key={i} className="flex items-center gap-2 py-1 text-sm"><Checkbox checked={!!checklist[i]} onCheckedChange={(v) => toggle(i, v === true)} />{i}</label>
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Internal notes</h3>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only visible to Loumilab" />
        <Button size="sm" variant="outline" disabled={!note.trim()} onClick={addNote}>Add note</Button>
        {notes.data?.map((n) => <p key={n.id} className="rounded-xl bg-surface-subtle p-3 text-sm"><span className="block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>{n.body}</p>)}
      </section>

      <section className="space-y-1">
        <h3 className="font-semibold">Activity &amp; communications</h3>
        {events.data?.map((e) => <div key={e.id} className="flex justify-between gap-3 border-b border-border py-1.5 text-sm"><span className="whitespace-pre-line">{e.detail ?? e.kind}</span><span className="shrink-0 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span></div>)}
      </section>
    </div>
  );
}

export default AdminEmailSetup;
