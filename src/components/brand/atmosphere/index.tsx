import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "midnight" | "forest" | "teal" | "burgundy" | "copper";

/** Soft environmental light that bleeds across section edges — color moves through light, never background swaps. */
export const Glow = ({ tone, className }: { tone: Tone; className?: string }) => (
  <span aria-hidden="true" className={cn("atmo-glow", className)} style={{ background: `hsl(var(--atmo-${tone}))` }} />
);

/** Continuous dark canvas; children sit on one shared atmosphere so sections never look like stacked boxes. */
export const Atmosphere = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("relative isolate overflow-hidden bg-atmo-obsidian text-atmo-ivory", className)}>{children}</div>
);

export const Kicker = ({ n, children }: { n?: string; children: ReactNode }) => (
  <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-atmo-ivory-muted">
    {n && <span className="font-mono">{n}</span>}<span className="h-px w-8 bg-atmo-ivory/25" />{children}
  </p>
);

export const Statement = ({ id, children, className }: { id?: string; children: ReactNode; className?: string }) => (
  <h2 id={id} className={cn("mt-5 font-hero text-4xl font-bold leading-[1.02] tracking-tight text-atmo-ivory sm:text-5xl lg:text-7xl", className)}>{children}</h2>
);

export const Lede = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("mt-6 max-w-xl text-lg leading-relaxed text-atmo-ivory-muted", className)}>{children}</p>
);

/** Photograph whose edges dissolve into the surrounding atmosphere. */
export const EditorialImage = ({ src, alt, w, h, className, fade = "bottom" }: { src: string; alt: string; w: number; h: number; className?: string; fade?: "bottom" | "left" | "right" | "none" }) => {
  const mask = { bottom: "linear-gradient(to bottom, #000 60%, transparent)", left: "linear-gradient(to left, #000 60%, transparent)", right: "linear-gradient(to right, #000 60%, transparent)", none: undefined }[fade];
  return (
    <figure className={cn("group relative overflow-hidden", className)} style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>
      <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" className="atmo-img h-full w-full object-cover" />
    </figure>
  );
};

/** Dark interface surface for product demonstrations. */
export const Surface = ({ title, children, className }: { title: string; children: ReactNode; className?: string }) => (
  <div className={cn("overflow-hidden rounded-2xl border border-atmo-ivory/12 bg-atmo-charcoal/95 shadow-2xl", className)}>
    <div className="flex items-center gap-2 border-b border-atmo-ivory/10 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-atmo-ivory/25" /><span className="h-2 w-2 rounded-full bg-atmo-ivory/15" />
      <span className="ml-2 text-xs text-atmo-ivory-muted">{title}</span>
    </div>
    <div className="p-5 text-sm text-atmo-ivory/85">{children}</div>
  </div>
);
