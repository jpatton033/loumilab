import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrdersHeroSlide } from "@/data/orders/hero-slides";

const RESUME_AFTER_MS = 6000;

interface OrdersHeroSlideshowProps {
  slides: OrdersHeroSlide[];
}

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

const isExternal = (href: string) => /^https?:\/\//.test(href);

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

const OrdersHeroSlideshow = ({ slides }: OrdersHeroSlideshowProps) => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollFade, setScrollFade] = useState(0);
  const touchStart = useRef<number | null>(null);

  const count = slides.length;
  const active = slides[Math.min(index, Math.max(count - 1, 0))];

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

  const progress = useMemo(
    () => (reduced || paused ? 0 : (elapsed / HOLD_MS) * 100),
    [elapsed, paused, reduced]
  );

  const wrapperStyle = reduced
    ? undefined
    : {
        opacity: 1 - scrollFade * 0.45,
        transform: `translate3d(0,${scrollFade * -12}px,0)`,
      };

  const accent = active?.accent_hsl ?? "217 91% 50%";

  return (
    <section
      aria-label="Loumilab Orders benefits"
      className="relative overflow-hidden pb-16 pt-8 lg:pb-24 lg:pt-12"
      style={{ ["--hero-accent" as string]: accent }}
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
      tabIndex={0}
    >
      {/* ambient lighting keyed to the active slide */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-[1200ms]"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 0%, hsl(var(--hero-accent) / 0.10), transparent 70%)",
          transitionTimingFunction: "var(--ease-brand)",
        }}
      />

      <div className="section-container relative" style={wrapperStyle}>
        <div className="mx-auto max-w-5xl" aria-live="polite" aria-atomic="true">
          {count === 0 ? null : (
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div
                key={`copy-${active.id}`}
                className="animate-fade-in"
                style={{ animationDuration: reduced ? "0.01ms" : "0.7s" }}
              >
                <p
                  className="font-display text-xs font-semibold uppercase tracking-[0.26em]"
                  style={{ color: "hsl(var(--hero-accent))" }}
                >
                  {active.eyebrow}
                </p>
                <h2 className="mt-4 font-hero text-[clamp(1.85rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                  {active.headline}
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground lg:text-lg">
                  {active.description}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {active.cta_primary ? (
                    <Cta label={active.cta_primary.label} href={active.cta_primary.href} variant="default" />
                  ) : null}
                  {active.cta_secondary ? (
                    <Cta
                      label={active.cta_secondary.label}
                      href={active.cta_secondary.href}
                      variant="outline"
                    />
                  ) : null}
                </div>
              </div>

              <div
                key={`card-${active.id}`}
                className="animate-scale-in flex justify-center lg:justify-end"
                style={{ animationDuration: reduced ? "0.01ms" : "0.9s" }}
              >
                <div className="relative flex aspect-square w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-lift)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-40"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, hsl(var(--hero-accent) / 0.22), transparent 65%)",
                    }}
                  />
                  <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-[2rem]"
                    style={{ background: "hsl(var(--hero-accent) / 0.12)" }}
                  >
                    <active.icon
                      size={40}
                      strokeWidth={1.5}
                      style={{ color: "hsl(var(--hero-accent))" }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="relative mt-8 w-full max-w-[200px] space-y-2">
                    <span className="block h-2 w-full rounded-full bg-muted" />
                    <span className="block h-2 w-[75%] rounded-full bg-muted/70" />
                    <span className="block h-2 w-[55%] rounded-full bg-muted/50" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {count > 1 ? (
          <div
            role="tablist"
            aria-label="Loumilab Orders benefits"
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-border pt-6 lg:mt-20"
          >
            {slides.map((slide, i) => {
              const isActive = i === index;
              return (
                <button
                  key={slide.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-label={`Show ${slide.nav_label}`}
                  onClick={() => {
                    stopAuto();
                    goTo(i);
                  }}
                  className={cn(
                    "group relative pb-2 font-display text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {slide.nav_label}
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

export default OrdersHeroSlideshow;
