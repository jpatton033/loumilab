import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHeroProducts, type HeroProduct } from "@/lib/hero/queries";
import HeroTreatment from "./treatments";

const HOLD_MS = 6000;
const TICK_MS = 50;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
};

const isExternal = (href?: string | null) => !!href && /^https?:\/\//.test(href);

const Cta = ({
  label,
  href,
  variant,
}: {
  label: string;
  href: string;
  variant: "default" | "outline";
}) => {
  const external = isExternal(href);
  return (
    <Button size="lg" variant={variant} asChild>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label} <ArrowUpRight size={17} />
        </a>
      ) : (
        <Link to={href}>
          {label} {variant === "default" ? <ArrowRight size={17} /> : null}
        </Link>
      )}
    </Button>
  );
};

const ProductShowcaseHero = () => {
  const { data: products = [], isLoading } = useHeroProducts();
  const reduced = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollFade, setScrollFade] = useState(0);
  const touchStart = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const count = products.length;
  const active: HeroProduct | undefined = products[Math.min(index, Math.max(count - 1, 0))];

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setElapsed(0);
  }, []);

  /* auto rotation + progress */
  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + TICK_MS >= HOLD_MS) {
          setIndex((i) => (i + 1) % count);
          return 0;
        }
        return e + TICK_MS;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, count]);

  /* subtle scroll handoff */
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrollFade(Math.min(y / 480, 1));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const stopAuto = useCallback(() => setPaused(true), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowRight") {
      stopAuto();
      goTo((index + 1) % count);
    } else if (e.key === "ArrowLeft") {
      stopAuto();
      goTo((index - 1 + count) % count);
    }
  };

  const progress = useMemo(() => (reduced || paused ? 0 : (elapsed / HOLD_MS) * 100), [elapsed, paused, reduced]);

  const copyStyle = reduced
    ? undefined
    : { opacity: 1 - scrollFade * 0.55, transform: `translate3d(0,${scrollFade * -18}px,0)` };
  const showcaseStyle = reduced
    ? undefined
    : { transform: `scale(${1 - scrollFade * 0.07}) translate3d(0,${scrollFade * -10}px,0)` };

  const centered = active?.layout === "centered";

  return (
    <section
      ref={sectionRef}
      aria-label="Loumilab product showcase"
      className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24"
      style={{ ["--hero-accent" as string]: active?.accent_hsl ?? "217 91% 50%" }}
      onMouseEnter={stopAuto}
      onFocus={stopAuto}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (start === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < 48) return;
        stopAuto();
        goTo(dx < 0 ? (index + 1) % count : (index - 1 + count) % count);
      }}
      onKeyDown={onKeyDown}
    >
      {/* ambient lighting keyed to the active product */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-[1200ms]"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 0%, hsl(var(--hero-accent) / 0.10), transparent 70%)",
          transitionTimingFunction: "var(--ease-brand)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden="true" />

      <div className="section-container relative">
        {/* brand frame */}
        <div className="text-center" style={copyStyle}>
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
            Loumilab
          </span>
          <h1
            className="mt-5 font-hero font-semibold leading-[0.95] tracking-[-0.04em]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.25rem)" }}
          >
            We Build What&apos;s Next.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
            Digital products, intelligent software, and secure experiences designed by Loumilab.
          </p>
        </div>

        {/* showcase */}
        <div className="mt-14 lg:mt-20" aria-live="polite" aria-atomic="true">
          {isLoading || !active ? (
            <div className="mx-auto h-[260px] w-full max-w-4xl rounded-3xl border border-border bg-surface-subtle lg:h-[380px]" />
          ) : (
            <div
              className={cn(
                "grid items-center gap-10",
                centered ? "text-center" : "lg:grid-cols-[0.9fr_1.1fr] lg:gap-16"
              )}
            >
              <div
                key={`copy-${active.id}`}
                className={cn("animate-fade-in", centered && "mx-auto max-w-2xl")}
                style={{ animationDuration: reduced ? "0.01ms" : "0.7s" }}
              >
                {active.attribution ? (
                  <span className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {active.attribution}
                  </span>
                ) : null}
                <p
                  className="mt-3 font-display text-xs font-semibold uppercase tracking-[0.26em]"
                  style={{ color: "hsl(var(--hero-accent))" }}
                >
                  {active.eyebrow}
                </p>
                <h2
                  className="mt-4 font-hero font-semibold leading-[1.02] tracking-[-0.035em]"
                  style={{ fontSize: centered ? "clamp(2rem, 4.6vw, 3.5rem)" : "clamp(1.85rem, 3.6vw, 3rem)" }}
                >
                  {active.headline}
                </h2>
                <p
                  className={cn(
                    "mt-5 text-base leading-relaxed text-muted-foreground lg:text-lg",
                    centered ? "mx-auto max-w-xl" : "max-w-lg"
                  )}
                >
                  {active.description}
                </p>
                <div
                  className={cn(
                    "mt-8 flex flex-col gap-3 sm:flex-row",
                    centered && "sm:justify-center"
                  )}
                >
                  {active.cta_primary_label && active.cta_primary_href ? (
                    <Cta label={active.cta_primary_label} href={active.cta_primary_href} variant="default" />
                  ) : null}
                  {active.cta_secondary_label && active.cta_secondary_href ? (
                    <Cta label={active.cta_secondary_label} href={active.cta_secondary_href} variant="outline" />
                  ) : null}
                </div>
              </div>

              <div
                key={`art-${active.id}`}
                className={cn("animate-scale-in", centered && "mx-auto w-full max-w-3xl")}
                style={{ ...showcaseStyle, animationDuration: reduced ? "0.01ms" : "0.9s" }}
              >
                <HeroTreatment
                  treatmentKey={active.treatment}
                  active
                  reduced={reduced}
                  imageUrl={active.desktop_image_url}
                  mobileImageUrl={active.mobile_image_url}
                  alt={`${active.name} product interface`}
                  priority={index === 0}
                />
              </div>
            </div>
          )}
        </div>

        {/* product navigation */}
        {count > 1 ? (
          <div
            role="tablist"
            aria-label="Featured Loumilab products"
            className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-border pt-6 lg:mt-20"
          >
            {products.map((p, i) => {
              const isActive = i === index;
              return (
                <button
                  key={p.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-label={`Show ${p.name}`}
                  onClick={() => {
                    stopAuto();
                    goTo(i);
                  }}
                  className={cn(
                    "group relative pb-2 font-display text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.nav_label}
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-border" aria-hidden="true">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: isActive ? `${paused || reduced ? 100 : progress}%` : "0%",
                        background: "hsl(var(--hero-accent))",
                        transition: "width 120ms linear",
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ProductShowcaseHero;
