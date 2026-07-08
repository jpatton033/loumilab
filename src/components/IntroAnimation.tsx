import { useEffect, useState } from "react";
import LoumilabLogo from "./LoumilabLogo";

const STORAGE_KEY = "loumilab_intro_seen";

const IntroAnimation = () => {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduced(prefersReduced);

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setShow(true);
    document.body.style.overflow = "hidden";

    const fadeAt = prefersReduced ? 1800 : 5200;
    const unmountAt = prefersReduced ? 2400 : 6000;

    const t1 = window.setTimeout(() => setFadeOut(true), fadeAt);
    const t2 = window.setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, unmountAt);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] transition-opacity duration-[800ms] ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(217 91% 30% / 0.35), transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(217 91% 50% / 0.15), transparent 60%)",
        }}
      />

      {/* Floating particles */}
      {!reduced && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute block w-1 h-1 rounded-full bg-accent/40 animate-intro-float"
              style={{
                top: `${(i * 53) % 100}%`,
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 6) * 0.6}s`,
                animationDuration: `${8 + (i % 5)}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8 px-6">
        <div className="animate-intro-logo">
          <LoumilabLogo size="md" />
        </div>

        {/* Drawn rule */}
        <div
          className="h-px w-40 md:w-56 bg-gradient-to-r from-transparent via-accent/70 to-transparent origin-center"
          style={{
            animation: reduced
              ? undefined
              : "intro-rule-draw 0.9s cubic-bezier(0.22,1,0.36,1) 1.6s both",
            transform: reduced ? undefined : "scaleX(0)",
          }}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="opacity-0 animate-intro-tagline-1 text-[11px] md:text-xs tracking-[0.5em] uppercase text-muted-foreground">
            Powered by
          </span>
          <span className="opacity-0 animate-intro-tagline-2 relative font-display text-5xl md:text-7xl font-semibold tracking-[-0.02em] inline-flex items-baseline">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#8a8a8a_0%,#ffffff_45%,#8a8a8a_100%)] bg-[length:200%_100%] animate-intro-shimmer text-6xl md:text-8xl">
              L
            </span>
            <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#8a8a8a_0%,#ffffff_45%,#8a8a8a_100%)] bg-[length:200%_100%] animate-intro-shimmer">
              OUMILAB
            </span>
          </span>
        </div>
      </div>

      {/* Local keyframes for rule draw */}
      <style>{`
        @keyframes intro-rule-draw {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default IntroAnimation;
