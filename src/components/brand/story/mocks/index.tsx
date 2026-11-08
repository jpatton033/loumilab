import { useEffect, useState } from "react";

/** Coded software previews for the homepage. Values change on a timer; frozen for reduced motion. */
function useTick(ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => { if (document.visibilityState === "visible") setN((v) => v + 1); }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return n;
}

const Shell = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl border border-inverse/15 bg-ink text-inverse shadow-2xl ${className}`}>
    <div className="flex items-center gap-1.5 border-b border-inverse/10 px-4 py-2.5">
      <span className="h-2 w-2 rounded-full bg-inverse/25" /><span className="h-2 w-2 rounded-full bg-inverse/25" /><span className="h-2 w-2 rounded-full bg-inverse/25" />
      <span className="ml-3 text-[11px] font-medium text-inverse-muted">{title}</span>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

export function MockDashboard({ className = "" }: { className?: string }) {
  const t = useTick(2200);
  const bars = Array.from({ length: 14 }, (_, i) => 30 + ((i * 37 + t * 13) % 60));
  const kpis = [["Revenue", `$${(18420 + t * 37).toLocaleString()}`], ["Open jobs", String(24 + (t % 5))], ["On-time", `${96 + (t % 3)}%`]];
  return (
    <Shell title="Operations — Today" className={className}>
      <div className="grid grid-cols-3 gap-3">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-inverse/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-inverse-muted">{k}</p>
            <p className="mt-1 font-hero text-lg font-semibold tabular-nums sm:text-2xl">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-28 items-end gap-1.5 sm:h-36">
        {bars.map((h, i) => <div key={i} className="flex-1 rounded-sm bg-inverse/70 transition-all duration-700" style={{ height: `${h}%`, opacity: i === bars.length - 1 ? 1 : 0.35 + i / 28 }} />)}
      </div>
    </Shell>
  );
}

export function MockSchedule({ className = "" }: { className?: string }) {
  const t = useTick(2600);
  const rows = ["Install — Ridge St.", "Consult — Halden", "Delivery — Wren & Stem", "Fitting — NORR"];
  return (
    <Shell title="Schedule — Thursday" className={className}>
      <ul className="space-y-2">
        {rows.map((r, i) => {
          const on = t % rows.length === i;
          return (
            <li key={r} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors duration-500 ${on ? "border-inverse/50 bg-inverse/10" : "border-inverse/10"}`}>
              <span>{`${9 + i * 2}:00`} · {r}</span>
              <span className="text-inverse-muted">{on ? "In progress" : i < t % rows.length ? "Done" : "Scheduled"}</span>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

export function MockWorkflow({ className = "" }: { className?: string }) {
  const t = useTick(1400);
  const steps = ["New request", "Check details", "Draft quote", "Owner approves", "Send & schedule"];
  const at = t % (steps.length + 1);
  return (
    <Shell title="Workflow — Quote requests" className={className}>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center sm:flex-1">
            <span className={`flex-1 rounded-lg border px-3 py-2.5 text-center text-xs transition-all duration-500 ${i < at ? "border-inverse bg-inverse text-ink" : "border-inverse/15 text-inverse-muted"}`}>{s}</span>
            {i < steps.length - 1 && <span className={`hidden h-px w-4 sm:block ${i < at - 1 ? "bg-inverse" : "bg-inverse/20"}`} />}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-inverse-muted">{at === 0 ? "Waiting for the next request…" : `Step ${Math.min(at, steps.length)} of ${steps.length} · no manual copying`}</p>
    </Shell>
  );
}

export function MockSecurity({ className = "" }: { className?: string }) {
  const t = useTick(1800);
  const systems = ["Website", "Email", "Payments", "Backups", "Staff logins", "Domains"];
  const log = ["Login verified · 2-step", "Backup completed", "Certificate renewed", "Unusual sign-in blocked", "Email records checked"];
  return (
    <Shell title="Security — All systems" className={className}>
      <div className="grid grid-cols-3 gap-2">
        {systems.map((s, i) => (
          <div key={s} className="rounded-lg border border-inverse/10 px-3 py-2.5">
            <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle transition-opacity ${(t + i) % 7 === 0 ? "bg-inverse/40" : "bg-inverse"}`} />
            <span className="text-xs">{s}</span>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 border-t border-inverse/10 pt-3 text-[11px] text-inverse-muted">
        {[0, 1, 2].map((k) => <li key={k + t} className="animate-fade-in">{`${String(8 + ((t + k) % 10)).padStart(2, "0")}:${String((t * 7 + k * 13) % 60).padStart(2, "0")}`} — {log[(t + k) % log.length]}</li>)}
      </ul>
    </Shell>
  );
}
