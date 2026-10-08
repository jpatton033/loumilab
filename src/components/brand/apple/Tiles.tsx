import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

export type TileLink = { label: string; to: string; external?: boolean };

/** Apple-style pair of actions: filled pill + outlined pill. */
export const TileActions = ({ primary, secondary, className }: { primary: TileLink; secondary?: TileLink; className?: string }) => {
  const base = "inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]";
  const render = (l: TileLink, cls: string) =>
    l.external ? (
      <a href={l.to} target="_blank" rel="noopener noreferrer" className={cn(base, cls)}>{l.label} <ArrowUpRight size={15} /></a>
    ) : (
      <Link to={l.to} className={cn(base, cls)}>{l.label}</Link>
    );
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {render(primary, "bg-accent text-accent-foreground hover:brightness-110 hover:shadow-[var(--shadow-accent-hover)]")}
      {secondary && render(secondary, "border border-accent text-accent hover:bg-accent-soft")}
    </div>
  );
};

/** Full-width product tile: centered headline, two actions, image underneath. */
export const ProductTile = ({
  eyebrow, title, line, primary, secondary, image, alt, tone = "plain", priority, className,
}: {
  eyebrow: string; title: string; line: string; primary: TileLink; secondary?: TileLink;
  image: string; alt: string; tone?: "plain" | "subtle"; priority?: boolean; className?: string;
}) => (
  <section className={cn("overflow-hidden pt-14 lg:pt-20", tone === "subtle" ? "bg-surface-subtle" : "bg-background", className)}>
    <Reveal className="section-container text-center">
      <p className="font-display text-sm font-semibold tracking-wide text-accent">{eyebrow}</p>
      <h2 className="mx-auto mt-3 max-w-4xl font-hero text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/70 lg:text-2xl">{line}</p>
      <TileActions primary={primary} secondary={secondary} className="mt-7" />
    </Reveal>
    <Reveal delay={120} className="section-container mt-10 lg:mt-14">
      <div className="photo-frame aspect-[4/5] rounded-b-none border-b-0 sm:aspect-[16/8]">
        <img
          src={image} alt={alt} width={1600} height={900}
          loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
          sizes="(min-width: 1280px) 1200px, 100vw" className="h-full w-full object-cover"
        />
      </div>
    </Reveal>
  </section>
);

/** Half-width tile used in the 2×2 grid. */
export const GridTile = ({
  eyebrow, title, line, image, alt, links, children, className,
}: {
  eyebrow: string; title: string; line?: string; image?: string; alt?: string;
  links: { primary: TileLink; secondary?: TileLink }; children?: ReactNode; className?: string;
}) => (
  <Reveal className={cn("group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface-subtle text-center transition-shadow duration-500 hover:shadow-[var(--shadow-accent-hover)]", className)}>
    <div className="px-6 pt-10 lg:pt-14">
      <p className="font-display text-sm font-semibold tracking-wide text-accent">{eyebrow}</p>
      <h3 className="mx-auto mt-2 max-w-md font-hero text-3xl font-semibold leading-tight tracking-[-0.02em] lg:text-4xl">{title}</h3>
      {line && <p className="mx-auto mt-3 max-w-sm text-base text-foreground/70 lg:text-lg">{line}</p>}
      <TileActions {...links} className="mt-6" />
    </div>
    <div className="mt-8 flex-1 px-6 lg:px-10">
      {image ? (
        <div className="overflow-hidden rounded-t-2xl">
          <img src={image} alt={alt ?? ""} width={1200} height={900} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </div>
      ) : children}
    </div>
  </Reveal>
);

/** Large typographic pause. */
export const Statement = ({ children, line }: { children: ReactNode; line?: string }) => (
  <section className="section-padding bg-background">
    <Reveal className="section-container text-center">
      <h2 className="mx-auto max-w-5xl font-hero text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1] tracking-[-0.035em]">{children}</h2>
      {line && <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70 lg:text-xl">{line}</p>}
    </Reveal>
  </section>
);

export const MoreLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="inline-flex items-center gap-1 font-display text-base font-semibold text-accent hover:underline underline-offset-4">
    {children} <ChevronRight size={18} />
  </Link>
);
