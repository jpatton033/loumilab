import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Fires once when the element enters the viewport. */
export const useInView = <T extends Element>(rootMargin = "0px 0px -15% 0px") => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView };
};

export type DotVariant = "hero" | "land" | "design" | "build" | "innovate" | "secure";

/** The Loumilab dot as a period. Decorative; real text stays readable. */
export const BrandDot = ({ variant = "land", className }: { variant?: DotVariant; className?: string }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("ldot", `ldot-${variant}`, inView && "ldot-in", className)}
    >
      <span className="ldot-core" />
      {variant === "build" && <><span className="ldot-half ldot-half-l" /><span className="ldot-half ldot-half-r" /></>}
      {variant === "secure" && <span className="ldot-ring" />}
      {variant === "hero" && <span className="ldot-glow" />}
    </span>
  );
};

/** Renders text, swapping a trailing "." for the brand dot (screen readers still read the period). */
export const DotText = ({ children, variant = "land" }: { children: string; variant?: DotVariant }) => {
  if (!children.endsWith(".")) return <>{children}</>;
  return (
    <>
      {children.slice(0, -1)}
      <span className="sr-only">.</span>
      <BrandDot variant={variant} />
    </>
  );
};

/** One dot splitting into two points that lead toward the products, then resolving. */
export const DotSplit = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-split pointer-events-none", inView && "ldot-in", className)}>
      <span className="dot-split-line" />
      <span className="dot-split-a" />
      <span className="dot-split-b" />
      <span className="dot-split-origin" />
    </div>
  );
};

/** Short hairline the dot travels along before a section. */
export const DotThread = ({ className }: { className?: string; children?: ReactNode }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-thread pointer-events-none", inView && "ldot-in", className)}>
      <span className="dot-thread-line" />
      <span className="dot-thread-dot" />
    </div>
  );
};

/** Reveals a Wordmark's period when scrolled into view. */
export const DotReveal = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  return <span ref={ref} className={cn("dot-reveal inline-flex", inView && "ldot-in", className)}>{children}</span>;
};
