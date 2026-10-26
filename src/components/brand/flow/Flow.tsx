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
export const ClosingCta = ({ title, lede, cta }: { title: string; lede?: string; cta: Cta }) => (
  <section className="section-container py-20 lg:py-28">
    <div className="rounded-[2rem] bg-surface-subtle px-6 py-16 text-center sm:px-12 lg:py-20">
      <h2 className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
      {lede && <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{lede}</p>}
      <Button size="lg" asChild className="mt-10">
        <Link to={cta.to} onClick={cta.onClick}>{cta.label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </Button>
    </div>
  </section>
);
