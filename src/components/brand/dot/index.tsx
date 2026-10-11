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

/** Page-level identity cue: a dot arrives, draws a short thread, then settles. */
export const DotMarker = ({ className, synchronized = false }: { className?: string; synchronized?: boolean }) => {
  const { ref, inView } = useInView<HTMLDivElement>("0px 0px -5% 0px");
  const [logoComplete, setLogoComplete] = useState(() => {
    if (!synchronized || typeof window === "undefined") return !synchronized;
    const w = window as unknown as { __loumilabLogoAnimationComplete?: boolean };
    return w.__loumilabLogoAnimationComplete === true;
  });
  useEffect(() => {
    if (!synchronized || logoComplete) return;
    const onComplete = () => setLogoComplete(true);
    window.addEventListener("loumilab:logo-complete", onComplete);
    return () => window.removeEventListener("loumilab:logo-complete", onComplete);
  }, [logoComplete, synchronized]);
  const active = inView && logoComplete;
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-marker pointer-events-none", synchronized && "dot-marker-synchronized", active && "ldot-in", className)}>
      <span className="dot-marker-thread" />
      <span className="dot-marker-core" />
    </div>
  );
};

/** A short section handoff that gives the dot continuity without becoming a divider. */
export const DotThread = ({ className, reverse = false }: { className?: string; reverse?: boolean }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-thread pointer-events-none", reverse && "dot-thread-reverse", inView && "ldot-in", className)}>
      <span className="dot-thread-line" />
      <span className="dot-thread-core" />
    </div>
  );
};

/** The dot expands into a focus ring over selected photography, then resolves. */
export const DotLens = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true" className={cn("dot-lens pointer-events-none", inView && "ldot-in", className)}>
      <span className="dot-lens-core" />
      <span className="dot-lens-ring" />
      <span className="dot-lens-exit" />
    </div>
  );
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
