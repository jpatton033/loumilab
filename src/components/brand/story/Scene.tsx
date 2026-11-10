import { ElementType, ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Cinematic scroll scenes. Writes a 0..1 progress value to the CSS var --p on the
 * element; styles in index.css (.scene-*) turn it into transform/opacity only.
 * Never blocks scrolling; skipped entirely for reduced-motion users.
 *  - "exit":  0 when the element top is at the viewport top, 1 when it has scrolled away.
 *  - "enter": 0 when the element top reaches the viewport bottom, 1 when it reaches ~35% from top.
 */
export function useSceneProgress<T extends HTMLElement>(mode: "exit" | "enter" = "enter") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--p", mode === "exit" ? "0" : "1"); return; }
    let raf = 0; let visible = true;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect(); const vh = window.innerHeight;
      const p = mode === "exit" ? -r.top / Math.max(r.height, 1) : (vh - r.top) / (vh * 0.65);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(3));
    };
    const onScroll = () => { if (visible && !raf) raf = requestAnimationFrame(update); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }, { rootMargin: "20% 0px" });
    io.observe(el); update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [mode]);
  return ref;
}

export type SceneVariant = "rise" | "expand" | "overlap" | "drift";

/** Wrap a section so it enters like a scene: rise (lift in), expand (frame opens), overlap (slides over the previous), drift (slow sideways). */
export const Scene = ({ variant = "rise", as: Tag = "div", className, children }: { variant?: SceneVariant; as?: ElementType; className?: string; children: ReactNode }) => {
  const ref = useSceneProgress<HTMLElement>("enter");
  return <Tag ref={ref} className={cn(`scene-${variant}`, className)}>{children}</Tag>;
};

/** Scroll-linked "lights down": the light page dims to deep black before a dark section. */
export const LightsDown = ({ className }: { className?: string }) => {
  const ref = useSceneProgress<HTMLDivElement>("enter");
  return (
    <div ref={ref} aria-hidden className={cn("scene-lights relative h-40 bg-background lg:h-56", className)}>
      <div className="absolute inset-0 bg-ink" />
    </div>
  );
};

/** Scroll-linked "lights up": deep black opens into off-white. */
export const LightsUp = ({ className }: { className?: string }) => {
  const ref = useSceneProgress<HTMLDivElement>("enter");
  return (
    <div ref={ref} aria-hidden className={cn("scene-lights-up relative h-40 bg-ink lg:h-56", className)}>
      <div className="absolute inset-0 bg-background" />
    </div>
  );
};
