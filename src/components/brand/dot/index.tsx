import { useEffect, useRef, useState } from "react";
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

/** One studio becoming two products: the homepage's signature dot transition. */
export const DotSplit = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-split pointer-events-none", inView && "ldot-in", className)}>
      <span className="dot-split-path dot-split-path-left" />
      <span className="dot-split-path dot-split-path-right" />
      <span className="dot-split-branch dot-split-branch-left" />
      <span className="dot-split-branch dot-split-branch-right" />
      <span className="dot-split-source" />
    </div>
  );
};

/** A dot crosses an image and resolves into an impact ring. */
export const DotImageJourney = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-image-journey pointer-events-none", inView && "ldot-in", className)}>
      <span className="dot-image-line" />
      <span className="dot-image-traveler" />
      <span className="dot-image-impact" />
    </div>
  );
};
