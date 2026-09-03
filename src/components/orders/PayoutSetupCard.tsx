import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Info, Loader2, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  callConnect,
  splitRequirements,
  usePayoutStatus,
  useRefreshPayouts,
  PAYOUT_DESCRIPTIONS,
  PAYOUT_LABELS,
  PAYOUT_STEPS,
} from "@/lib/orders/connect";

const PayoutSetupCard = () => {
  const { data, isLoading, isFetching } = usePayoutStatus();
  const refresh = useRefreshPayouts();
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState({ business_name: "", contact_email: "", phone: "" });
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  const signedIn = data?.code !== "signed_out";
  const merchant = data?.merchant ?? null;
  const account = data?.account ?? null;
  const mode = data?.mode ?? null;

  // A later clean status must clear the notice, otherwise the card stays stuck.
  useEffect(() => {
    if (!data) return;
    if (data.code === "connect_not_enabled" || data.code === "stripe_key_invalid") {
      setConfigNotice(data.error ?? null);
    } else {
      setConfigNotice(null);
    }
  }, [data]);


  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user.email) {
        setForm((f) => (f.contact_email ? f : { ...f, contact_email: session.session!.user.email! }));
      }
    })();
  }, []);

  // Returning from Stripe onboarding: re-sync so both panels reflect reality.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payments") !== "return") return;
    params.delete("payments");
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setWorking(true);
    const res = await callConnect("start", merchant ? {} : { business: form });
    setWorking(false);
    if (res.code === "connect_not_enabled" || res.code === "stripe_key_invalid") {
      setConfigNotice(res.error ?? null);
      return;
    }
    if (res.error) {
      setConfigNotice(null);
      toast({ title: "Payments setup failed", description: res.error, variant: "destructive" });
      return;
    }
    setConfigNotice(null);
    await refresh();
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
  const { provided, merchant: merchantTodo } = splitRequirements(account?.requirements_due);
  const lastSynced = account?.last_synced_at
    ? new Date(account.last_synced_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  if (isLoading) {
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

      {merchantTodo.length ? (
        <div
          className={`mt-4 flex items-start gap-2 rounded-2xl border p-4 text-xs ${
            needsAttention
              ? "border-destructive/30 bg-destructive/5 text-foreground"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          {needsAttention ? (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          ) : (
            <Info size={14} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {needsAttention
                ? "Stripe needs these details to restore payouts"
                : "Only Stripe can collect these — everything else is already filled in"}
            </p>
            <ul className="mt-2 space-y-1">
              {merchantTodo.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <span aria-hidden>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {provided.length ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-accent" />
          <span>Pre-filled from your store set-up: {provided.join(", ").toLowerCase()}.</span>
        </p>
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

      {configNotice ? (
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-secondary p-4 text-xs text-muted-foreground">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>{configNotice}</span>
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
        {account ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => void refresh()}
            disabled={isFetching}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : undefined} />
            {isFetching ? "Refreshing" : "Refresh status"}
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Payments securely powered by Stripe.
          {lastSynced ? ` Last checked ${lastSynced}.` : ""}
        </p>
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
