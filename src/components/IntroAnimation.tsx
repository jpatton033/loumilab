import { useEffect, useState } from "react";
import LoumilabLogo from "./LoumilabLogo";

const STORAGE_KEY = "loumilab_intro_seen";

const IntroAnimation = () => {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        setShow(true);
        sessionStorage.setItem(STORAGE_KEY, "1");
        document.body.style.overflow = "hidden";
        const t1 = window.setTimeout(() => setFadeOut(true), 2600);
        const t2 = window.setTimeout(() => {
          setShow(false);
          document.body.style.overflow = "";
        }, 3300);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          document.body.style.overflow = "";
        };
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] transition-opacity duration-700 ${
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
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute block w-1 h-1 rounded-full bg-accent/40 animate-intro-float"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 6) * 0.4}s`,
              animationDuration: `${4 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Light sweep */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent animate-intro-sweep" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">
        <div className="animate-intro-logo">
          <LoumilabLogo size="xl" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="opacity-0 animate-intro-tagline-1 text-xs md:text-sm tracking-[0.4em] uppercase text-muted-foreground">
            Designed by
          </span>
          <span className="opacity-0 animate-intro-tagline-2 relative font-display text-3xl md:text-5xl font-semibold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#a0a0a0_0%,#ffffff_45%,#a0a0a0_100%)] bg-[length:200%_100%] animate-intro-shimmer">
              Loumilab
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
