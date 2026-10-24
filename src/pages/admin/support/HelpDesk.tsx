import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useRequestAccess,
  useReply,
  useSetTicketStatus,
  useSupportLevel,
  useTicket,
  useTickets,
} from "@/lib/support/queries";
import { ALL_SCOPES, SCOPE_LABELS, type SupportScope } from "@/lib/support/rules";

const STATUSES = ["new", "open", "waiting", "resolved"] as const;
const LABEL: Record<string, string> = { new: "New", open: "Open", waiting: "Waiting on merchant", resolved: "Resolved" };
const fmt = (d: string) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const Queue = () => {
  const { data: tickets = [], isLoading } = useTickets();
  const [filter, setFilter] = useState<string>("active");
  const shown = tickets.filter((t) => (filter === "active" ? t.status !== "resolved" : t.status === filter));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {["active", ...STATUSES].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(s)}>
            {s === "active" ? "All open" : LABEL[s]} ({tickets.filter((t) => (s === "active" ? t.status !== "resolved" : t.status === s)).length})
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No help requests here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((t) => (
              <li key={t.id}>
                <Link to={`/admin/support/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-secondary">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.merchants?.business_name ?? "Merchant"} · {t.topic} · {fmt(t.updated_at)}</p>
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{LABEL[t.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

const TicketView = ({ id }: { id: string }) => {
  const { data } = useTicket(id);
  const { data: level = 0 } = useSupportLevel();
  const reply = useReply();
  const setStatus = useSetTicketStatus();
  const requestAccess = useRequestAccess();
  const [body, setBody] = useState("");
  const [scopes, setScopes] = useState<SupportScope[]>([]);
  const t = data?.ticket;
  if (!t) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Link to="/admin/support" className="text-sm text-muted-foreground hover:text-foreground">← Help Desk</Link>
        <h2 className="text-xl font-semibold">{t.subject}</h2>
        {data.messages.map((m) => (
          <div key={m.id} className={`rounded-2xl border border-border p-4 text-sm ${m.author_kind === "staff" ? "bg-secondary" : "bg-card"}`}>
            <p className="mb-1 text-xs text-muted-foreground">{m.author_kind === "staff" ? "Loumilab support" : t.merchants?.business_name} · {fmt(m.created_at)}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply to the merchant" rows={4} maxLength={5000} />
        <Button
          className="rounded-full"
          disabled={!body.trim() || reply.isPending}
          onClick={() => reply.mutate({ ticketId: id, body }, { onSuccess: () => setBody(""), onError: (e) => toast.error(e.message) })}
        >
          Send reply
        </Button>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm font-medium">Status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button key={s} size="sm" variant={t.status === s ? "default" : "outline"} className="rounded-full"
                onClick={() => setStatus.mutate({ ticketId: id, status: s, assignSelf: true }, { onError: (e) => toast.error(e.message) })}>
                {LABEL[s]}
              </Button>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full rounded-full">
            <Link to={`/admin/support/merchant/${t.merchant_id}`}>Open merchant support view</Link>
          </Button>
        </div>

        {level >= 2 && (
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm font-medium">Ask merchant for access</p>
            <p className="mt-1 text-xs text-muted-foreground">The merchant approves and picks how long. Payouts, plan and ownership are never included.</p>
            <div className="mt-3 space-y-2">
              {ALL_SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={scopes.includes(s)} onCheckedChange={(v) => setScopes((cur) => (v ? [...cur, s] : cur.filter((x) => x !== s)))} />
                  {SCOPE_LABELS[s]}
                </label>
              ))}
            </div>
            <Button size="sm" className="mt-3 rounded-full" disabled={!scopes.length || requestAccess.isPending}
              onClick={() => requestAccess.mutate({ merchantId: t.merchant_id, ticketId: id, scopes }, {
                onSuccess: () => { toast.success("Request sent to the merchant"); setScopes([]); },
                onError: (e) => toast.error(e.message),
              })}>
              Send access request
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
};

const HelpDesk = () => {
  const { id } = useParams();
  return (
    <AdminShell title="Help Desk" description="Merchant help requests, replies and assisted changes.">
      <SEOHead title="Help Desk | Loumilab Admin" description="Merchant help desk." path="/admin/support" noindex />
      {id ? <TicketView id={id} /> : <Queue />}
    </AdminShell>
  );
};

export default HelpDesk;
