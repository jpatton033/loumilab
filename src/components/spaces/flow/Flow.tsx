import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "midnight" | "forest" | "teal" | "burgundy" | "copper";

/** Soft environmental light that bleeds past chapter edges, so color evolves without section boxes or scroll fades. */
export const Glow = ({ tone, className }: { tone: Tone; className?: string }) => (
  <span aria-hidden="true" className={cn("spaces-glow", className)} style={{ background: `hsl(var(--spaces-${tone}))` }} />
);

export const Chapter = ({ n, label, title, children, className, id }: { n: string; label: string; title: ReactNode; children?: ReactNode; className?: string; id?: string }) => (
  <section id={id} className={cn("relative isolate", className)}>
    <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--spaces-ivory-muted))]">
      <span className="font-mono">{n}</span><span className="h-px w-8 bg-[hsl(var(--spaces-ivory)/0.25)]" />{label}
    </p>
    <h2 className="font-hero text-4xl font-semibold leading-[1.03] tracking-tight text-[hsl(var(--spaces-ivory))] sm:text-5xl lg:text-7xl">{title}</h2>
    {children}
  </section>
);

export const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("mt-6 max-w-xl text-lg leading-relaxed text-[hsl(var(--spaces-ivory-muted))]", className)}>{children}</p>
);

/** Photo frame with gentle hover drift; no rounded bubbles on full-bleed use. */
export const CinemaFrame = ({ src, alt, className, imgClassName, w, h, rounded = true }: { src: string; alt: string; className?: string; imgClassName?: string; w: number; h: number; rounded?: boolean }) => (
  <figure className={cn("group relative overflow-hidden", rounded && "rounded-3xl", className)}>
    <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" className={cn("spaces-img-drift h-full w-full object-cover", imgClassName)} />
  </figure>
);

/** Dark interface surface used for product demonstrations. */
export const Surface = ({ title, children, className }: { title: string; children: ReactNode; className?: string }) => (
  <div className={cn("overflow-hidden rounded-2xl border border-[hsl(var(--spaces-ivory)/0.12)] bg-[hsl(var(--spaces-charcoal)/0.92)] shadow-2xl backdrop-blur-0", className)}>
    <div className="flex items-center gap-2 border-b border-[hsl(var(--spaces-ivory)/0.1)] px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-[hsl(var(--spaces-ivory)/0.25)]" /><span className="h-2 w-2 rounded-full bg-[hsl(var(--spaces-ivory)/0.15)]" />
      <span className="ml-2 text-xs text-[hsl(var(--spaces-ivory-muted))]">{title}</span>
    </div>
    <div className="p-5 text-sm text-[hsl(var(--spaces-ivory)/0.85)]">{children}</div>
  </div>
);
