import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Search, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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

/** One search, three looks: "dark" (bold black moment), "editorial" (compact, on dark atmosphere), "full" (light, comprehensive). */
export type DomainSearchVariant = "dark" | "editorial" | "full";

const look = {
  dark: { input: "bg-atmo-ivory text-atmo-obsidian placeholder:text-atmo-obsidian/50 border-transparent", btn: "bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85", panel: "border-atmo-ivory/12 bg-atmo-charcoal/60", text: "text-atmo-ivory", muted: "text-atmo-ivory/60", divide: "divide-atmo-ivory/10", ghost: "border-atmo-ivory/25 text-atmo-ivory hover:bg-atmo-ivory/10", ok: "text-atmo-ivory" },
  editorial: { input: "bg-transparent text-atmo-ivory placeholder:text-atmo-ivory/45 border-atmo-ivory/25 focus:border-atmo-ivory/60", btn: "bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85", panel: "border-atmo-ivory/12 bg-atmo-charcoal/60", text: "text-atmo-ivory", muted: "text-atmo-ivory/60", divide: "divide-atmo-ivory/10", ghost: "border-atmo-ivory/25 text-atmo-ivory hover:bg-atmo-ivory/10", ok: "text-atmo-ivory" },
  full: { input: "bg-background text-foreground placeholder:text-muted-foreground border-border focus:border-foreground/40", btn: "bg-primary text-primary-foreground hover:bg-primary/85", panel: "border-border bg-background", text: "text-foreground", muted: "text-muted-foreground", divide: "divide-border", ghost: "border-border text-foreground hover:bg-muted", ok: "text-success" },
};

export default function DomainSearch({
  surface, onProceed, proceedLabel = "Request Domain Setup", variant = "full",
  placeholder = "yourbusiness.com or a keyword", cta = "Search Domains", limit,
}: {
  surface: "business" | "spaces"; onProceed: (r: DomainResult) => void; proceedLabel?: string;
  variant?: DomainSearchVariant; placeholder?: string; cta?: string; limit?: number;
}) {
  const L = look[variant];
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<DomainResult[] | null>(null);
  const [all, setAll] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [verified, setVerified] = useState<DomainResult | null>(null);
  const id = `ds-${surface}-${variant}`;

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setVerified(null); setAll(false);
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

  const shown = results && limit && !all ? results.slice(0, limit) : results;
  const Icon = verified?.status === "available" ? CheckCircle2 : verified?.status === "unavailable" ? XCircle : AlertCircle;
  const pill = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,transform,border-color] duration-200 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none";
  const big = variant !== "editorial";

  return (
    <div>
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row" role="search">
        <label className="sr-only" htmlFor={id}>Domain name or keyword</label>
        <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} maxLength={63} autoComplete="off"
          className={cn("w-full sm:flex-1 rounded-full border px-6 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring", big ? "h-14 text-lg" : "h-12 text-base", L.input)} />
        <button type="submit" disabled={busy || q.trim().length < 2} className={cn(pill, big ? "h-14 px-8 text-base" : "h-12 px-6 text-sm", L.btn)}>
          {busy ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <Search size={18} aria-hidden />} {cta}
        </button>
      </form>
      <div aria-live="polite">
        {err && <p role="alert" className="mt-4 text-sm text-destructive">{err}</p>}

        {verified && (
          <div className={cn("mt-6 rounded-3xl border p-6 animate-fade-in motion-reduce:animate-none", L.panel)}>
            <div className="flex items-start gap-3">
              <Icon className={verified.status === "available" ? L.ok : L.muted} size={22} aria-hidden />
              <div className="flex-1">
                <p className={cn("font-display text-xl font-semibold break-all", L.text)}>{verified.name}</p>
                <p className={cn("mt-1 text-sm", L.muted)}>{STATUS_LABEL[verified.status]}{verified.verified ? " · checked live with the registry just now" : ""}{verified.status !== "unavailable" && verified.status !== "provider_unavailable" ? ` · ${price(verified)}` : ""}</p>
                {verified.status === "unsupported" && <p className={cn("mt-2 text-sm", L.muted)}>This ending can't be checked online yet. We can still look into it for you.</p>}
              </div>
            </div>
            {(verified.status === "available" || verified.status === "premium" || verified.status === "unsupported") && (
              <div className="mt-5">
                <button type="button" className={cn(pill, "h-11 px-6 text-sm", L.btn)} onClick={() => onProceed(verified)}>{proceedLabel}</button>
                <p className={cn("mt-3 text-xs", L.muted)}>Availability can change at any time. Requesting setup doesn't reserve or buy the domain, and doesn't guarantee ownership. Prices are Cloudflare's, in {verified.pricing?.currency ?? "USD"}, with no Loumilab markup.</p>
              </div>
            )}
          </div>
        )}

        {shown && (
          <div className="mt-6 animate-fade-in motion-reduce:animate-none">
            <p className={cn("text-xs uppercase tracking-wide", L.muted)}>Suggestions — not yet confirmed. Select one to check it live.</p>
            {shown.length === 0 ? <p className={cn("mt-3 text-sm", L.muted)}>No suggestions found. Try another word.</p> : (
              <ul className={cn("mt-3 divide-y overflow-hidden rounded-3xl border", L.panel, L.divide, variant === "full" && "md:grid md:grid-cols-2 md:divide-y-0 md:gap-px md:bg-border")}>
                {shown.map((r) => (
                  <li key={r.name} className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-4", variant === "full" && "md:bg-background")}>
                    <div className="min-w-0">
                      <p className={cn("truncate font-medium", L.text)}>{r.name} {r.status === "premium" && <span className="ml-1 rounded-full border border-current px-2 py-0.5 text-xs">Premium</span>}</p>
                      <p className={cn("text-sm", L.muted)}>.{r.name.split(".").slice(1).join(".")} · {price(r)}</p>
                    </div>
                    <button type="button" className={cn(pill, "h-9 border px-4 text-sm", L.ghost)} disabled={!!checking} onClick={() => check(r.name)}>
                      {checking === r.name && <Loader2 className="animate-spin" size={14} aria-hidden />} Check availability
                    </button>
                  </li>))}
              </ul>)}
            {results && limit && !all && results.length > limit && (
              <button type="button" className={cn("mt-3 text-sm underline underline-offset-4", L.text)} onClick={() => setAll(true)}>See all {results.length}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
