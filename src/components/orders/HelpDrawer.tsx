import { useState } from "react";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  useDecideAccess,
  useMerchantGrants,
  useOpenTicket,
  useReply,
  useRevokeAccess,
  useTicket,
  useTickets,
} from "@/lib/support/queries";
import { GRANT_DURATIONS, SCOPE_LABELS, grantIsActive, type SupportScope } from "@/lib/support/rules";

const TOPICS = [
  ["setup", "Store setup"],
  ["storefront", "Storefront"],
  ["payments", "Payments & payouts"],
  ["orders", "Orders"],
  ["calendar", "Calendar"],
  ["other", "Something else"],
] as const;

const STATUS: Record<string, string> = { new: "Sent", open: "In progress", waiting: "Waiting on you", resolved: "Resolved" };
const fmt = (d: string) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const Thread = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const { data } = useTicket(id);
  const reply = useReply();
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      <button className="text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>← All requests</button>
      <h3 className="font-semibold">{data?.ticket?.subject}</h3>
      <div className="space-y-3">
        {data?.messages.map((m) => (
          <div key={m.id} className={`rounded-2xl border border-border p-3 text-sm ${m.author_kind === "staff" ? "bg-secondary" : "bg-card"}`}>
            <p className="mb-1 text-xs text-muted-foreground">{m.author_kind === "staff" ? "Loumilab support" : "You"} · {fmt(m.created_at)}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply" maxLength={5000} />
      <Button
        className="rounded-full"
        disabled={!body.trim() || reply.isPending}
        onClick={() => reply.mutate({ ticketId: id, body }, { onSuccess: () => setBody(""), onError: (e) => toast.error(e.message) })}
      >
        Send reply
      </Button>
    </div>
  );
};

const HelpDrawer = ({ merchantId }: { merchantId?: string }) => {
  const { data: tickets = [] } = useTickets(merchantId);
  const { data: grants = [] } = useMerchantGrants(merchantId);
  const open = useOpenTicket();
  const revoke = useRevokeAccess();
  const decide = useDecideAccess();
  const [topic, setTopic] = useState("setup");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [allow, setAllow] = useState(false);
  const [hours, setHours] = useState(24);
  const [thread, setThread] = useState<string | null>(null);
  const [approveHours, setApproveHours] = useState(24);

  if (!merchantId) return null;
  const active = grants.filter((g) => grantIsActive(g));
  const requested = grants.filter((g) => g.status === "requested");

  const submit = () =>
    open.mutate(
      { topic, subject, body, grantHours: allow ? hours : null },
      {
        onSuccess: (id) => {
          toast.success("Request sent. We'll reply here and by email.");
          setSubject("");
          setBody("");
          setAllow(false);
          setThread(id as string);
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <LifeBuoy size={15} /> Help
          {active.length > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-accent" aria-label="Support access active" />}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Help from Loumilab</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {active.map((g) => (
            <div key={g.id} className="rounded-2xl border border-accent/40 bg-accent/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><ShieldCheck size={15} className="text-accent" /> Support can make changes for you</p>
              <p className="mt-1 text-muted-foreground">
                {g.scopes.map((s) => SCOPE_LABELS[s as SupportScope] ?? s).join(", ")} · until {fmt(g.expires_at!)}
              </p>
              <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => revoke.mutate(g.id)}>Revoke access</Button>
            </div>
          ))}

          {requested.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border p-4 text-sm">
              <p className="font-medium">Loumilab support asks to help with:</p>
              <p className="mt-1 text-muted-foreground">{g.scopes.map((s) => SCOPE_LABELS[s as SupportScope] ?? s).join(", ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">Support never sees your password, payouts or bank details, and can't change your plan or account owner.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select className="h-9 rounded-full border border-input bg-background px-3 text-sm" value={approveHours} onChange={(e) => setApproveHours(Number(e.target.value))}>
                  {GRANT_DURATIONS.map((d) => <option key={d.hours} value={d.hours}>{d.label}</option>)}
                </select>
                <Button size="sm" className="rounded-full" onClick={() => decide.mutate({ grantId: g.id, approve: true, hours: approveHours })}>Allow</Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => decide.mutate({ grantId: g.id, approve: false, hours: 0 })}>Decline</Button>
              </div>
            </div>
          ))}

          {thread ? (
            <Thread id={thread} onBack={() => setThread(null)} />
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold">Ask for help</h3>
                <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
                  {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" maxLength={160} />
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell us more" maxLength={5000} rows={4} />
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={allow} onCheckedChange={(v) => setAllow(v === true)} className="mt-0.5" />
                  <span>Allow Loumilab support to make changes for me (store details, pickup & delivery, menu items, Local listing). Never payouts, plan or account owner.</span>
                </label>
                {allow && (
                  <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={hours} onChange={(e) => setHours(Number(e.target.value))} aria-label="Access duration">
                    {GRANT_DURATIONS.map((d) => <option key={d.hours} value={d.hours}>For {d.label}</option>)}
                  </select>
                )}
                <Button className="w-full rounded-full" disabled={!subject.trim() || !body.trim() || open.isPending} onClick={submit}>
                  Send request
                </Button>
              </div>

              {tickets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Your requests</h3>
                  {tickets.map((t) => (
                    <button key={t.id} onClick={() => setThread(t.id)} className="w-full rounded-2xl border border-border p-3 text-left text-sm hover:bg-secondary">
                      <p className="font-medium">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{STATUS[t.status]} · {fmt(t.updated_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpDrawer;
