import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  callConnect,
  fetchConnectStatus,
  PAYOUT_DESCRIPTIONS,
  PAYOUT_LABELS,
  PAYOUT_STEPS,
  type ConnectedAccount,
  type MerchantRecord,
} from "@/lib/orders/connect";

const PayoutSetupCard = () => {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [mode, setMode] = useState<"live" | "test" | null>(null);
  const [form, setForm] = useState({ business_name: "", contact_email: "", phone: "" });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      setForm((f) => ({ ...f, contact_email: data.session?.user.email ?? "" }));
      const res = await fetchConnectStatus();
      if (!active) return;
      if (res.merchant) setMerchant(res.merchant);
      if (res.account) setAccount(res.account);
      if (res.mode) setMode(res.mode);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const start = async () => {
    setWorking(true);
    const res = await callConnect("start", merchant ? {} : { business: form });
    setWorking(false);
    if (res.error) {
      toast({ title: "Payments setup failed", description: res.error, variant: "destructive" });
      return;
    }
    if (res.merchant) setMerchant(res.merchant);
    if (res.account) setAccount(res.account);
    if (res.mode) setMode(res.mode);
    if (res.url) window.location.href = res.url;
  };

  const openStripeDashboard = async () => {
    setWorking(true);
    const res = await callConnect("dashboard_link");
    setWorking(false);
    if (res.url) window.open(res.url, "_blank", "noopener");
    else toast({ title: "Unable to open payouts", description: res.error, variant: "destructive" });
  };

  const status = account?.payout_status ?? "not_started";
  const enabled = status === "payout_enabled";
  const needsAttention = status === "restricted" || status === "disabled";

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
        <Loader2 size={16} className="animate-spin" /> Checking payments status…
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-base font-semibold">Payments &amp; payouts</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your Loumilab account to set up payments and receive payouts.
        </p>
        <Button asChild className="mt-4 rounded-full">
          <a href="/sign-in">Sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <h2 className="font-display text-base font-semibold">Payments &amp; payouts</h2>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{PAYOUT_DESCRIPTIONS[status]}</p>
        </div>
        <Badge variant={enabled ? "default" : needsAttention ? "destructive" : "outline"}>
          {PAYOUT_LABELS[status]}
        </Badge>
      </div>

      <ol className="mt-6 grid gap-2 sm:grid-cols-4">
        {PAYOUT_STEPS.map((step, index) => {
          const currentIndex = PAYOUT_STEPS.findIndex((s) => s.status === status);
          const reached = enabled || (currentIndex >= 0 && index <= currentIndex);
          return (
            <li
              key={step.status}
              className={`rounded-2xl border p-3 text-xs font-semibold ${
                reached ? "border-transparent bg-secondary text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {reached ? <CheckCircle2 size={13} /> : <span className="text-[10px]">{index + 1}</span>}
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {needsAttention && account?.requirements_due?.length ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-secondary p-4 text-xs text-muted-foreground">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>Outstanding items: {account.requirements_due.join(", ")}</span>
        </div>
      ) : null}

      {!merchant ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pc-name">Business name</Label>
            <Input
              id="pc-name"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              placeholder="Loumi Coffee Co."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc-email">Contact email</Label>
            <Input
              id="pc-email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc-phone">Phone (optional)</Label>
            <Input
              id="pc-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          className="rounded-full"
          onClick={start}
          disabled={working || (!merchant && (!form.business_name || !form.contact_email))}
        >
          {working ? <Loader2 size={15} className="animate-spin" /> : null}
          {status === "not_started" ? "Set up payments" : enabled ? "Update details" : "Continue setup"}
        </Button>
        {account ? (
          <Button variant="outline" className="rounded-full" onClick={openStripeDashboard} disabled={working}>
            Payouts &amp; balance <ExternalLink size={14} />
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground">Payments securely powered by Stripe.</p>
        {mode === "test" ? (
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.14em]">
            Test mode
          </Badge>
        ) : null}
      </div>
    </div>
  );
};

export default PayoutSetupCard;
