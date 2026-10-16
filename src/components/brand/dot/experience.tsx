import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useInView } from "./index";
import { useDotMotion } from "./tokens";

/** Reveal — the signature: the dot grows to fill, wipes the next section in, then parks. Once per page. */
export const DotReveal = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>("0px 0px -25% 0px");
  return (
    <div ref={ref} aria-hidden="true" className={cn("ldot-reveal pointer-events-none", inView && "ldot-in", className)}>
      <span className="ldot-reveal-fill" />
      <span className="ldot-reveal-park" />
    </div>
  );
};

/** Pin — discovery: the dot drops like a map pin onto what was found. */
export const DotPin = ({ className }: { className?: string }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  return (
    <span ref={ref} aria-hidden="true" className={cn("ldot-pin pointer-events-none", inView && "ldot-in", className)}>
      <span className="ldot-pin-core" />
      <span className="ldot-pin-shadow" />
    </span>
  );
};

/** Reading marker — a hairline progress line with the dot at its tip. */
export const DotProgress = ({ targetId }: { targetId: string }) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    let f = 0;
    const on = () => {
      cancelAnimationFrame(f);
      f = requestAnimationFrame(() => {
        const el = document.getElementById(targetId);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = Math.max(r.height - window.innerHeight, 1);
        setP(Math.min(Math.max(-r.top / total, 0), 1));
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    on();
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(f); };
  }, [targetId]);
  return (
    <div aria-hidden="true" className="ldot-progress pointer-events-none" style={{ opacity: p > 0.01 && p < 0.995 ? 1 : 0 }}>
      <span className="ldot-progress-line" style={{ transform: `scaleX(${p})` }} />
      <span className="ldot-progress-tip" style={{ left: `calc(${p * 100}% - 4px)` }} />
    </div>
  );
};

/** Confirmation — the dot draws a check, then settles. */
export const DotCheck = ({ className, label = "Sent" }: { className?: string; label?: string }) => (
  <span role="status" className={cn("ldot-check inline-flex items-center gap-3 font-display text-sm font-semibold", className)}>
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <circle className="ldot-check-dot" cx="14" cy="14" r="13" />
      <path className="ldot-check-mark" d="M8.5 14.5l3.6 3.6 7.4-8" fill="none" />
    </svg>
    {label}
  </span>
);

/** Page dot — crosses the top bar on navigation and lands by the logo. */
export const RouteDot = () => {
  const { pathname } = useLocation();
  const { reduced } = useDotMotion();
  const first = useRef(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!reduced) setRun((r) => r + 1);
  }, [pathname, reduced]);
  if (!run) return null;
  return <span key={run} aria-hidden="true" className="ldot-route pointer-events-none" />;
};
