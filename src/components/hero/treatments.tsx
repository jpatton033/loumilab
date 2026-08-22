import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, CreditCard, Package } from "lucide-react";
import fintrack from "@/assets/work/fintrack.jpg";
import bloom from "@/assets/work/bloom.jpg";
import careconnect from "@/assets/work/careconnect.jpg";

interface TreatmentProps {
  /** Built-in mockup key from the product record. */
  treatmentKey: string;
  /** Slide is currently on screen. */
  active: boolean;
  /** User prefers reduced motion — no looping or staged animation. */
  reduced: boolean;
  /** Optional admin-supplied screenshot; replaces the built-in mockup art. */
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  alt: string;
  /** Eager-load the first slide only. */
  priority?: boolean;
}

/* ---------------- shared frames ---------------- */

const BrowserChrome = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]",
      className
    )}
  >
    <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-muted" />
      <span className="h-2 w-2 rounded-full bg-muted" />
      <span className="h-2 w-2 rounded-full bg-muted" />
      <span className="ml-3 h-2 w-24 rounded-full bg-muted/70" />
    </div>
    {children}
  </div>
);

const LaptopFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("w-full", className)}>
    <div className="overflow-hidden rounded-t-2xl border border-border border-b-0 bg-card shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-muted" />
        <span className="h-2 w-2 rounded-full bg-muted" />
        <span className="h-2 w-2 rounded-full bg-muted" />
      </div>
      {children}
    </div>
    <div className="mx-auto h-2.5 w-[108%] max-w-none -translate-x-[4%] rounded-b-xl border border-border bg-surface-tint" />
  </div>
);

const Phone = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "w-full max-w-[240px] rounded-[2rem] border border-border bg-foreground p-1.5 shadow-[var(--shadow-lift)]",
      className
    )}
  >
    <div className="overflow-hidden rounded-[1.65rem] bg-background">
      <div className="flex justify-center py-1.5">
        <span className="h-1 w-12 rounded-full bg-muted" />
      </div>
      {children}
    </div>
  </div>
);

const Bar = ({ w, className }: { w: string; className?: string }) => (
  <span className={cn("block h-2 rounded-full bg-muted", className)} style={{ width: w }} />
);

/* ---------------- treatment 1: Orders ---------------- */

const cues = [
  { icon: Package, label: "New order", detail: "Sunday Kitchen · #1042" },
  { icon: CreditCard, label: "Payment received", detail: "$42.00 · card" },
  { icon: CheckCircle2, label: "Ready for pickup", detail: "Order #1042" },
];

const OrdersDevices = ({ active, reduced }: TreatmentProps) => {
  const [step, setStep] = useState(reduced ? cues.length : 0);

  useEffect(() => {
    if (reduced || !active) return;
    setStep(0);
    const timers = cues.map((_, i) => window.setTimeout(() => setStep(i + 1), 700 + i * 900));
    return () => timers.forEach(window.clearTimeout);
  }, [active, reduced]);

  return (
    <div className="relative pb-20">
      <LaptopFrame className="ml-auto w-[80%]">
        <div className="bg-background p-4">
          <div className="flex items-center justify-between">
            <Bar w="90px" className="h-2.5" />
            <Bar w="44px" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Today", "Orders", "Revenue"].map((k, i) => (
              <div key={k} className="rounded-xl border border-border bg-surface-subtle p-3">
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {k}
                </span>
                <span className="mt-1 block font-display text-sm font-semibold">
                  {["18", "26", "$742"][i]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <Bar w="120px" />
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={{ background: "hsl(var(--hero-accent) / 0.12)", color: "hsl(var(--hero-accent))" }}
                >
                  {r === 0 ? "New" : r === 1 ? "Preparing" : "Ready"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </LaptopFrame>

      <Phone className="absolute left-0 top-8 z-10 w-[30%] max-w-[165px]">
        <div className="p-3">
          <div className="h-16 rounded-xl" style={{ background: "hsl(var(--hero-accent) / 0.14)" }} />
          <Bar w="70%" className="mt-3 h-2.5" />
          <Bar w="45%" className="mt-2" />
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-border p-2">
                <span className="h-8 w-8 rounded-lg bg-muted" />
                <span className="flex-1 space-y-1.5">
                  <Bar w="80%" className="h-1.5" />
                  <Bar w="40%" className="h-1.5" />
                </span>
              </div>
            ))}
          </div>
          <div
            className="mt-3 rounded-xl py-2 text-center text-[10px] font-semibold text-primary-foreground"
            style={{ background: "hsl(var(--hero-accent))" }}
          >
            Checkout
          </div>
        </div>
      </Phone>

      <div className="pointer-events-none absolute bottom-0 left-[6%] right-0 flex flex-wrap gap-2">
        {cues.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-soft)] transition-all duration-700",
              step > i ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            )}
            style={{ transitionTimingFunction: "var(--ease-brand)" }}
          >
            <c.icon size={14} style={{ color: "hsl(var(--hero-accent))" }} />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold leading-tight">{c.label}</span>
              <span className="block truncate text-[9px] text-muted-foreground">{c.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- treatment 2: Vurtti dashboard ---------------- */

const VurttiDashboard = ({ active, reduced }: TreatmentProps) => (
  <LaptopFrame className="mx-auto w-full max-w-3xl">
    <div className="flex bg-background">
      <div className="hidden w-32 shrink-0 space-y-2 border-r border-border bg-surface-subtle p-3 sm:block">
        <span className="block font-display text-[11px] font-bold uppercase tracking-tight">
          Vurtti<span style={{ color: "hsl(var(--hero-accent))" }}>.</span>
        </span>
        {["Overview", "Controls", "Evidence", "Policies", "Audits"].map((s, i) => (
          <span
            key={s}
            className={cn(
              "block rounded-lg px-2 py-1 text-[10px]",
              i === 0 ? "font-semibold" : "text-muted-foreground"
            )}
            style={i === 0 ? { background: "hsl(var(--hero-accent) / 0.12)", color: "hsl(var(--hero-accent))" } : undefined}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center justify-between">
          <Bar w="110px" className="h-2.5" />
          <Bar w="52px" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: "Readiness", v: "92%" },
            { k: "Controls", v: "148" },
            { k: "Open tasks", v: "6" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border p-3">
              <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                {m.k}
              </span>
              <span className="mt-1 block font-display text-base font-semibold">{m.v}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-border p-3">
          <Bar w="80px" className="h-1.5" />
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {[38, 52, 44, 66, 58, 74, 82, 70, 90].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background: "hsl(var(--hero-accent) / 0.35)",
                  transition: "height 900ms var(--ease-brand)",
                  transitionDelay: `${i * 60}ms`,
                  ...(active || reduced ? null : { height: "10%" }),
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <Bar w="140px" className="h-1.5" />
              <span className="text-[9px] font-semibold" style={{ color: "hsl(var(--hero-accent))" }}>
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </LaptopFrame>
);

/* ---------------- treatment 3: browser stack ---------------- */

const sites = [
  { src: fintrack, label: "FinTrack analytics platform" },
  { src: bloom, label: "Bloom commerce storefront" },
  { src: careconnect, label: "CareConnect patient portal" },
];

const BrowserStack = ({ active, reduced, priority }: TreatmentProps) => {
  const [front, setFront] = useState(0);

  useEffect(() => {
    if (reduced || !active) return;
    const id = window.setInterval(() => setFront((f) => (f + 1) % sites.length), 2400);
    return () => window.clearInterval(id);
  }, [active, reduced]);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-xl pr-6">
      {sites.map((s, i) => {
        const depth = (i - front + sites.length) % sites.length;
        return (
          <div
            key={s.label}
            className="absolute inset-x-0 top-0 transition-all duration-[1200ms]"
            style={{
              transitionTimingFunction: "var(--ease-brand)",
              transform: `translate3d(${depth * 5}%, ${depth * 7}%, 0) scale(${1 - depth * 0.07})`,
              zIndex: sites.length - depth,
              opacity: depth === 0 ? 1 : 0.55 - depth * 0.12,
              filter: depth === 0 ? "none" : `blur(${depth}px)`,
            }}
          >
            <BrowserChrome>
              <img
                src={s.src}
                alt={s.label}
                width={800}
                height={520}
                loading={priority && i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="aspect-[16/10] w-full object-cover"
              />
            </BrowserChrome>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- treatment 4: app panels ---------------- */

const AppPanels = ({ active, reduced }: TreatmentProps) => {
  const panels = [
    { title: "Analytics", w: "w-[56%]", pos: "left-0 top-0", delay: 0 },
    { title: "Workflow", w: "w-[50%]", pos: "right-0 top-[26%]", delay: 140 },
    { title: "Access control", w: "w-[52%]", pos: "left-[12%] bottom-0", delay: 280 },
  ];

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-xl">
      {panels.map((p) => (
        <div
          key={p.title}
          className={cn(
            "absolute rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] transition-all duration-1000",
            p.w,
            p.pos,
            active || reduced ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}
          style={{ transitionDelay: `${reduced ? 0 : p.delay}ms`, transitionTimingFunction: "var(--ease-brand)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[11px] font-semibold">{p.title}</span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "hsl(var(--hero-accent))" }}
            />
          </div>
          <div className="mt-3 space-y-2">
            <Bar w="88%" className="h-1.5" />
            <Bar w="64%" className="h-1.5" />
            <div className="flex h-12 items-end gap-1">
              {[40, 68, 52, 84, 60, 92].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%`, background: "hsl(var(--hero-accent) / 0.28)" }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------------- dispatcher ---------------- */

const map: Record<string, (p: TreatmentProps) => JSX.Element> = {
  "orders-devices": OrdersDevices,
  "vurtti-dashboard": VurttiDashboard,
  "browser-stack": BrowserStack,
  "app-panels": AppPanels,
};

const HeroTreatment = (props: TreatmentProps) => {
  const { imageUrl, mobileImageUrl, alt, priority, ...rest } = props;

  if (imageUrl) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <BrowserChrome>
          <picture>
            {mobileImageUrl ? <source media="(max-width: 640px)" srcSet={mobileImageUrl} /> : null}
            <img
              src={imageUrl}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="aspect-[16/10] w-full object-cover"
            />
          </picture>
        </BrowserChrome>
      </div>
    );
  }

  const Component = map[props.treatmentKey] ?? AppPanels;
  return <Component {...props} />;
};

export type { TreatmentProps };
export default HeroTreatment;
