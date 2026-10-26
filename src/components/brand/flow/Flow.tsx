import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Cta = { label: string; to: string; onClick?: () => void };

/** Squarespace-style hero: big headline, one sentence, one main button, optional quiet link and wide image. */
export const FlowHero = ({
  title, lede, cta, secondary, image, imageAlt, eyebrow,
}: { title: ReactNode; lede: ReactNode; cta: Cta; secondary?: Cta; image?: string; imageAlt?: string; eyebrow?: ReactNode }) => (
  <section className="section-container pt-10 pb-16 text-center lg:pt-16 lg:pb-24">
    {eyebrow && <div className="mb-6">{eyebrow}</div>}
    <h1 className="mx-auto max-w-4xl font-hero text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{title}</h1>
    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{lede}</p>
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button size="lg" asChild>
        <Link to={cta.to} onClick={cta.onClick}>{cta.label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </Button>
      {secondary && (
        <Link to={secondary.to} className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">
          {secondary.label}
        </Link>
      )}
    </div>
    {image && (
      <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-[2rem] border border-border shadow-[var(--shadow-lift)]">
        <img src={image} alt={imageAlt ?? ""} width={1600} height={900} className="aspect-[16/9] w-full object-cover" />
      </div>
    )}
  </section>
);

/** Three short, even benefit blocks. */
export const BenefitTrio = ({ items }: { items: { title: string; body: string }[] }) => (
  <section className="section-container py-16 lg:py-24">
    <div className="grid gap-12 md:grid-cols-3 md:gap-10">
      {items.map((b) => (
        <div key={b.title}>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{b.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{b.body}</p>
        </div>
      ))}
    </div>
  </section>
);

/** Closing band that repeats the page's one main action. */
export const ClosingCta = ({ title, lede, cta, tone = "light" }: { title: string; lede?: string; cta: Cta; tone?: "light" | "dark" }) => (
  <section className="section-container py-20 lg:py-28">
    <div className={`rounded-[2rem] px-6 py-16 text-center sm:px-12 lg:py-20 ${tone === "dark" ? "section-dark" : "bg-surface-subtle"}`}>
      <h2 className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
      {lede && <p className={`mx-auto mt-5 max-w-xl text-lg ${tone === "dark" ? "text-inverse-muted" : "text-muted-foreground"}`}>{lede}</p>}
      <Button size="lg" asChild className={`mt-10 ${tone === "dark" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}>
        <Link to={cta.to} onClick={cta.onClick}>{cta.label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </Button>
    </div>
  </section>
);

/** "What do you need?" row: clear paths into each part of Loumilab. */
export const PathPicker = ({ title, items }: { title: string; items: { label: string; body: string; to: string }[] }) => (
  <section className="section-container py-16 lg:py-24" aria-labelledby="path-picker-title">
    <h2 id="path-picker-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-5xl">{title}</h2>
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((p) => (
        <li key={p.to}>
          <Link to={p.to} className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <span className="font-display text-lg font-semibold leading-snug">{p.label}</span>
            <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.body}</span>
            <ArrowRight aria-hidden="true" className="mt-5 h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

/** Real product screenshot in a quiet browser frame. */
export const ScreenFrame = ({ src, alt, label, className = "" }: { src: string; alt: string; label?: string; className?: string }) => (
  <figure className={`overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[var(--shadow-lift)] ${className}`}>
    <div className="flex items-center gap-2 border-b border-border bg-surface-subtle px-4 py-3" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-border" />
      <span className="h-2.5 w-2.5 rounded-full bg-border" />
      <span className="h-2.5 w-2.5 rounded-full bg-border" />
      {label && <span className="ml-3 truncate font-display text-xs text-muted-foreground">{label}</span>}
    </div>
    <img src={src} alt={alt} loading="lazy" className="block w-full" />
  </figure>
);
