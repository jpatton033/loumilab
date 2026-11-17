import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Search, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABEL, type DomainResult } from "../../../supabase/functions/_shared/domainSearch";

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("domain-search", { body });
  if (error) {
    let msg = "Domain search is temporarily unavailable.";
    if (error instanceof FunctionsHttpError) { try { msg = (await error.context.json()).error ?? msg; } catch { /* keep default */ } }
    throw new Error(msg);
  }
  return data;
}

const price = (r: DomainResult) => r.pricing ? `$${r.pricing.registration} first year${r.pricing.renewal ? ` · $${r.pricing.renewal}/yr renewal` : ""}` : "Price not provided";

export default function DomainSearch({ surface, onProceed, proceedLabel = "Request Domain Setup" }: { surface: "business" | "spaces"; onProceed: (r: DomainResult) => void; proceedLabel?: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<DomainResult[] | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [verified, setVerified] = useState<DomainResult | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setVerified(null);
    try { setResults((await call({ op: "search", q, surface })).results ?? []); }
    catch (x) { setErr((x as Error).message); setResults(null); }
    finally { setBusy(false); }
  };
  const check = async (name: string) => {
    setChecking(name); setErr(null);
    try { setVerified((await call({ op: "check", domain: name, surface })).results?.[0] ?? null); }
    catch (x) { setErr((x as Error).message); }
    finally { setChecking(null); }
  };

  const Icon = verified?.status === "available" ? CheckCircle2 : verified?.status === "unavailable" ? XCircle : AlertCircle;
  return (
    <div>
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`ds-${surface}`}>Domain name or keyword</label>
        <Input id={`ds-${surface}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="yourbusiness.com or a keyword" className="h-12 rounded-full px-5 text-base" maxLength={63} />
        <Button type="submit" size="lg" className="h-12 rounded-full" disabled={busy || q.trim().length < 2}>{busy ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Search</Button>
      </form>
      {err && <p role="alert" className="mt-4 text-sm text-destructive">{err}</p>}

      {verified && (
        <div className="mt-6 rounded-3xl border border-border bg-background p-6">
          <div className="flex items-start gap-3">
            <Icon className={verified.status === "available" ? "text-success" : "text-muted-foreground"} size={22} />
            <div className="flex-1">
              <p className="font-display text-xl font-semibold text-foreground">{verified.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{STATUS_LABEL[verified.status]}{verified.verified ? " · checked live with the registry just now" : ""}{verified.status !== "unavailable" && verified.status !== "provider_unavailable" ? ` · ${price(verified)}` : ""}</p>
              {verified.status === "unsupported" && <p className="mt-2 text-sm text-muted-foreground">This ending can't be checked online yet. We can still look into it for you.</p>}
            </div>
          </div>
          {(verified.status === "available" || verified.status === "premium" || verified.status === "unsupported") && (
            <div className="mt-5">
              <Button className="rounded-full" onClick={() => onProceed(verified)}>{proceedLabel}</Button>
              <p className="mt-3 text-xs text-muted-foreground">Availability can change at any time. Requesting setup doesn't reserve or buy the domain, and doesn't guarantee ownership. Prices are Cloudflare's, in {verified.pricing?.currency ?? "USD"}, with no Loumilab markup.</p>
            </div>
          )}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Suggestions — not yet confirmed. Select one to check it live.</p>
          {results.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No suggestions found. Try another word.</p> : (
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-background">
              {results.map((r) => (
                <li key={r.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.name} {r.status === "premium" && <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-xs">Premium</span>}</p>
                    <p className="text-sm text-muted-foreground">.{r.name.split(".").slice(1).join(".")} · {price(r)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" disabled={!!checking} onClick={() => check(r.name)}>
                    {checking === r.name ? <Loader2 className="animate-spin" size={14} /> : null} Check availability
                  </Button>
                </li>))}
            </ul>)}
        </div>
      )}
    </div>
  );
}
