import { Link, NavLink, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { useResearcher } from "@/lib/senti/studio";

const tabs = [["/senti/studio", "Explore"], ["/senti/studio/library", "Library"], ["/senti/studio/research", "Research"]] as const;
export const researchTabs = [
  ["/senti/studio/research", "Overview"], ["/senti/studio/research/experiments", "Experiments"], ["/senti/studio/research/models", "Models"],
  ["/senti/studio/research/evaluations", "Evaluations"], ["/senti/studio/research/diagnostics/observations", "Observations"],
  ["/senti/studio/research/diagnostics/memory", "Memory"], ["/senti/studio/research/journal", "Journal"],
] as const;

export const inp = "w-full rounded-xl border border-atmo-ivory/15 bg-atmo-charcoal/60 px-3 py-2 text-sm text-atmo-ivory placeholder:text-atmo-ivory/35 focus:outline-none focus:ring-2 focus:ring-atmo-ivory/30";
export const btn = "inline-flex items-center justify-center rounded-full bg-atmo-ivory px-4 py-2 text-sm font-medium text-atmo-obsidian transition hover:bg-atmo-ivory/85 disabled:opacity-50";
export const ghost = "inline-flex items-center justify-center rounded-full border border-atmo-ivory/25 px-3 py-1.5 text-xs text-atmo-ivory transition hover:bg-atmo-ivory/10 disabled:opacity-50";

export const Card = ({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <section className={cn("rounded-3xl border border-atmo-ivory/10 bg-atmo-charcoal/40 p-5", className)}>
    {(title || action) && <div className="mb-3 flex items-center justify-between gap-3">{title && <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-atmo-ivory/60">{title}</h2>}{action}</div>}
    {children}
  </section>
);
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5 text-sm"><span className="text-atmo-ivory/60">{label}</span>{children}</label>
);
const tone: Record<string, string> = {
  operational: "border-emerald-400/40 text-emerald-200", completed: "border-emerald-400/40 text-emerald-200", measured: "border-emerald-400/40 text-emerald-200", done: "border-emerald-400/40 text-emerald-200", fact: "border-emerald-400/40 text-emerald-200",
  running: "border-amber-300/40 text-amber-100", queued: "border-amber-300/40 text-amber-100", active: "border-amber-300/40 text-amber-100", experimental: "border-amber-300/40 text-amber-100", inferred: "border-amber-300/40 text-amber-100",
  failed: "border-red-400/40 text-red-200", contradicted: "border-red-400/40 text-red-200",
};
export const Pill = ({ s, label }: { s: string; label?: string }) => (
  <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] capitalize", tone[s] ?? "border-atmo-ivory/20 text-atmo-ivory/60")}>{label ?? s.replace(/_/g, " ")}</span>
);
export const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-atmo-ivory/45">{children}</p>;

export default function StudioShell({ title, children, hideTitle }: { title: string; children: React.ReactNode; hideTitle?: boolean }) {
  const { access } = useResearcher();
  const { pathname } = useLocation();
  const inResearch = pathname.startsWith("/senti/studio/research");
  const isActive = (to: string) => to === "/senti/studio" ? pathname === to || pathname.startsWith("/senti/studio/x/") : pathname.startsWith(to);
  return (
    <Layout>
      <SEOHead title={`${title} | Senti Research Studio`} description="Private Senti research workspace." path="/senti/studio" noindex />
      <div className="min-h-screen bg-atmo-obsidian text-atmo-ivory [&_h1]:text-atmo-ivory [&_h2]:text-atmo-ivory [&_h3]:text-atmo-ivory">
        <nav aria-label="Research Studio" className="border-b border-atmo-ivory/10">
          <div className="section-container flex gap-5 overflow-x-auto py-4 text-sm">
            <Link to="/senti/studio" className="whitespace-nowrap font-hero font-semibold">Senti<span className="text-atmo-ivory/50"> Research Studio</span></Link>
            {access === "ok" && tabs.map(([to, l]) => <Link key={to} to={to} aria-current={isActive(to) ? "page" : undefined} className={cn("whitespace-nowrap border-b pb-0.5", isActive(to) ? "border-atmo-copper text-atmo-ivory" : "border-transparent text-atmo-ivory/55 hover:text-atmo-ivory")}>{l}</Link>)}
          </div>
          {access === "ok" && inResearch && <div className="section-container flex gap-4 overflow-x-auto pb-3 text-xs">
            <span className="whitespace-nowrap text-atmo-copper/80">Advanced research</span>
            {researchTabs.map(([to, l]) => <NavLink key={to} to={to} end className={({ isActive: a }) => cn("whitespace-nowrap", a ? "text-atmo-ivory" : "text-atmo-ivory/50 hover:text-atmo-ivory")}>{l}</NavLink>)}
          </div>}
        </nav>
        <div className="section-container py-10">
          {access === "loading" && <Empty>Checking access…</Empty>}
          {access === "signed_out" && <Gate msg="Sign in with a Loumilab researcher account to open the Studio." link />}
          {access === "denied" && <Gate msg="This account doesn't have Senti researcher access. A Loumilab admin can grant it in Admin → Senti." />}
          {access === "ok" && <>{!hideTitle && <h1 className="mb-8 font-hero text-3xl font-semibold sm:text-4xl">{title}.</h1>}{children}</>}
        </div>
      </div>
    </Layout>
  );
}
const Gate = ({ msg, link }: { msg: string; link?: boolean }) => (
  <div className="mx-auto max-w-md py-24 text-center"><h1 className="font-hero text-3xl font-semibold">Private workspace.</h1><p className="mt-4 text-atmo-ivory/65">{msg}</p>
    {link && <Link to="/sign-in?next=/senti/studio" className={cn(btn, "mt-6")}>Sign in</Link>}</div>
);
