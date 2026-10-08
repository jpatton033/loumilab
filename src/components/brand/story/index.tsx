import { ReactNode, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { cn } from "@/lib/utils";

type Img = { src: string; alt: string; width?: number; height?: number; position?: string };

const Photo = ({ img, className }: { img: Img; className?: string }) => (
  <img
    src={img.src}
    alt={img.alt}
    width={img.width ?? 1920}
    height={img.height ?? 1088}
    loading="lazy"
    decoding="async"
    sizes="(min-width: 1280px) 1200px, 100vw"
    style={img.position ? { objectPosition: img.position } : undefined}
    className={cn("h-full w-full object-cover", className)}
  />
);

/** Wide photo with at most one line of copy beneath. */
export const ImmersiveImage = ({ image, caption, className }: { image: Img; caption?: string; className?: string }) => (
  <section className={cn("section-container py-10 lg:py-16", className)}>
    <Reveal className="photo-frame aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
      <Photo img={image} />
    </Reveal>
    {caption && <p className="mt-4 text-meta text-muted-foreground">{caption}</p>}
  </section>
);

/** Strong photo + one headline (and optional sentence). Text sits below on mobile, overlaid on desktop. */
export const ImageStatement = ({ image, title, line, eyebrow, className }: { image: Img; title: string; line?: string; eyebrow?: string; className?: string }) => (
  <section className={cn("section-container py-10 lg:py-16", className)}>
    <Reveal className="relative">
      <div className="photo-frame aspect-[4/5] sm:aspect-[16/9]">
        <Photo img={image} />
        <div className="pointer-events-none absolute inset-0 hidden rounded-3xl bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent sm:block" />
      </div>
      <div className="mt-6 sm:absolute sm:bottom-0 sm:left-0 sm:mt-0 sm:max-w-2xl sm:p-10 lg:p-14">
        {eyebrow && <Eyebrow className="sm:text-background/80">{eyebrow}</Eyebrow>}
        <h2 className="mt-3 font-hero text-3xl font-semibold leading-tight sm:text-background lg:text-5xl">{title}</h2>
        {line && <p className="mt-3 text-lede sm:text-background/85">{line}</p>}
      </div>
    </Reveal>
  </section>
);

export type SequenceItem = Img & { label: string; note?: string };

/** Swipeable row of photos. No autoplay; snap scrolling plus arrow buttons. */
export const PeopleSequence = ({ eyebrow, title, items, className }: { eyebrow?: string; title: string; items: SequenceItem[]; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className={cn("py-12 lg:py-20", className)} aria-roledescription="carousel" aria-label={title}>
      <div className="section-container flex items-end justify-between gap-6">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="mt-4 max-w-2xl font-hero text-3xl font-semibold leading-tight lg:text-5xl">{title}</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => go(-1)} aria-label="Previous photos" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next photos" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] focus-visible:outline-none sm:px-[max(1.5rem,calc((100vw-80rem)/2+2rem))] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => (
          <figure key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}: ${it.label}`} className="w-[78vw] shrink-0 snap-start sm:w-[340px] lg:w-[380px]">
            <div className="photo-frame aspect-[4/5]">
              <Photo img={{ width: 1200, height: 1504, ...it }} />
            </div>
            <figcaption className="mt-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />{it.label}
              </span>
              {it.note && <span className="mt-1 block text-sm text-muted-foreground">{it.note}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

/** Short photo band that opens a new topic. */
export const CategoryTransition = ({ image, label, title, className }: { image: Img; label: string; title: string; className?: string }) => (
  <section className={cn("section-container py-8 lg:py-12", className)}>
    <Reveal className="grid items-center gap-6 sm:grid-cols-[1fr_1.4fr] lg:gap-12">
      <div className="photo-frame aspect-[16/9] sm:order-2 sm:aspect-[21/9]">
        <Photo img={image} />
      </div>
      <div>
        <Eyebrow>{label}</Eyebrow>
        <h2 className="mt-4 font-hero text-3xl font-semibold leading-tight lg:text-4xl">{title}</h2>
      </div>
    </Reveal>
  </section>
);

/** Photo with a short idea or a figure we can stand behind. */
export const EditorialMoment = ({ image, quote, attribution, className }: { image: Img; quote: ReactNode; attribution?: string; className?: string }) => (
  <section className={cn("section-padding border-t border-border", className)}>
    <div className="section-container grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <Reveal className="photo-frame aspect-[4/3] lg:aspect-[16/11]"><Photo img={image} /></Reveal>
      <Reveal delay={80}>
        <span className="block h-1 w-12 rounded-full bg-accent" aria-hidden />
        <blockquote className="mt-6 font-hero text-3xl font-semibold leading-tight lg:text-4xl">{quote}</blockquote>
        {attribution && <p className="mt-5 text-meta text-muted-foreground">{attribution}</p>}
      </Reveal>
    </div>
  </section>
);
