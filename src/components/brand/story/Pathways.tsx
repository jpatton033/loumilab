import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, Mail, Receipt, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RtlSequence, useAutoMotion, type Frame } from "./Horizontal";

const STEPS = [
  { id: "establish", label: "Establish" },
  { id: "run", label: "Run" },
  { id: "improve", label: "Improve" },
] as const;

/** Business name -> domain -> email, cycling while visible. */
function IdentityMorph() {
  const { ref, running } = useAutoMotion<HTMLDivElement>();
  const names = [["Harbor Bakery", "harborbakery"], ["Fern & Stone", "fernandstone"], ["Northside Repair", "northsiderepair"]];
  const [n, setN] = useState(0);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      if (stage < 2) setStage(stage + 1);
      else { setStage(0); setN((n + 1) % names.length); }
    }, 1800);
    return () => window.clearTimeout(t);
  }, [running, stage, n, names.length]);
  const [name, slug] = names[n];
  const rows = [name, `${slug}.com`, `hello@${slug}.com`];
  return (
    <div ref={ref} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10" aria-label="A business name becoming a domain and email address">
      <ol className="space-y-5">
        {rows.map((r, i) => (
          <li key={i} className={`flex items-center gap-4 transition-all duration-700 ${i <= stage ? "translate-x-0 opacity-100" : "translate-x-6 opacity-20"}`}>
            <span className="w-14 shrink-0 text-[0.625rem] sm:w-16 sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{["Name", "Domain", "Email"][i]}</span>
            <span className={`min-w-0 break-all font-hero font-bold tracking-tight text-foreground ${i === 0 ? "text-2xl sm:text-4xl" : "text-base sm:text-2xl"}`}>{r}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Scattered tasks drawing together into one tidy flow. */
function TasksConverge() {
  const { ref, running } = useAutoMotion<HTMLDivElement>();
  const [tidy, setTidy] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setTidy((v) => !v), 2600);
    return () => window.clearInterval(t);
  }, [running]);
  const tasks = [
    { icon: FileSpreadsheet, label: "Spreadsheet", messy: "-translate-x-6 -rotate-6", },
    { icon: StickyNote, label: "Sticky note", messy: "translate-x-10 rotate-3" },
    { icon: Mail, label: "Email", messy: "-translate-x-2 rotate-6" },
    { icon: Receipt, label: "Invoice", messy: "translate-x-6 -rotate-3" },
  ];
  return (
    <div ref={ref} className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10" aria-label="Scattered tasks becoming one process">
      <div className="relative space-y-3">
        {tasks.map(({ icon: Icon, label, messy }, i) => (
          <div key={label} className={`flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-all duration-1000 ease-out ${tidy ? "translate-x-0 rotate-0" : messy}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-700 ${tidy ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{tidy ? i + 1 : <Icon className="h-3.5 w-3.5" />}</span>
            <span className="font-medium text-foreground">{label}</span>
            {tidy && i < tasks.length - 1 && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pathways({ runFrames }: { runFrames: Frame[] }) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const chapter = (i: number, dark: boolean, kicker: string, title: string, body: string, ctas: { label: string; to: string }[], visual: JSX.Element) => (
    <section ref={(el) => (refs.current[i] = el)} data-idx={i} id={STEPS[i].id} className={`scroll-mt-28 overflow-hidden border-t border-border py-24 lg:py-32 ${dark ? "bg-ink text-inverse" : ""}`} aria-labelledby={`${STEPS[i].id}-title`}>
      <div className="section-container grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-inverse-muted" : "text-muted-foreground"}`}>{kicker}</p>
          <h2 id={`${STEPS[i].id}-title`} className={`mt-4 font-hero text-4xl font-bold tracking-tight lg:text-6xl ${dark ? "text-inverse" : ""}`}>{title}</h2>
          <p className={`mt-6 max-w-md text-lg leading-relaxed ${dark ? "text-inverse-muted" : "text-muted-foreground"}`}>{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {ctas.map((c, k) => (
              <Button key={c.to} size="lg" variant={k === 0 ? "default" : "outline"} asChild className={dark ? (k === 0 ? "bg-background text-foreground hover:bg-background/90" : "border-inverse/40 bg-transparent text-inverse hover:bg-inverse/10 hover:text-inverse") : ""}>
                <Link to={c.to}>{c.label}</Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7">{visual}</div>
      </div>
    </section>
  );

  return (
    <div className="relative">
      <nav aria-label="Establish, Run, Improve" className="sticky top-16 z-30 border-b border-border bg-background/95 lg:top-[72px]">
        <div className="section-container flex items-center gap-6 py-3">
          {STEPS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${i === active ? "bg-dot" : "bg-border"}`} />
              {s.label}
            </a>
          ))}
          <div className="ml-auto hidden h-px flex-1 bg-border sm:block" aria-hidden>
            <div className="h-px bg-foreground transition-all duration-500" style={{ width: `${((active + 1) / 3) * 100}%` }} />
          </div>
        </div>
      </nav>
      {chapter(0, false, "Establish", "Establish your business.", "Your name, your domain, and email that matches — set up properly from day one.",
        [{ label: "Business Email", to: "/services/business-email" }, { label: "Domains", to: "/services/domains" }], <IdentityMorph />)}
      {chapter(1, false, "Run", "Less managing. More business.", "Your own storefront, orders and pickups in one place, so the day runs itself.",
        [{ label: "Explore Orders", to: "/orders" }], <RtlSequence frames={runFrames} className="aspect-[4/3]" />)}
      {chapter(2, false, "Improve", "Improve your business.", "Spreadsheets, notes, emails and invoices — drawn together into one simple process.",
        [{ label: "Workflow Optimization", to: "/services/workflow-optimization" }], <TasksConverge />)}
    </div>
  );
}
