import { useEffect, useRef, useState, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll progress (0–1) of a tall wrapper through the viewport. */
export const useScrollProgress = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced()) { setP(0); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
};

/** Silent looping video that only plays while on screen; poster-only with reduced motion. */
export const AmbientVideo = ({ src, poster, className = "", label }: { src: string; poster: string; className?: string; label: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  useEffect(() => { setMotion(!reduced()); }, []);
  useEffect(() => {
    const v = ref.current; if (!v || !motion) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.05 });
    io.observe(v); return () => io.disconnect();
  }, [motion]);
  if (!motion) return <img src={poster} alt={label} className={`h-full w-full object-cover ${className}`} />;
  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label}
      className={`h-full w-full object-cover ${className}`} />
  );
};

/**
 * Cinematic opening: full-bleed media with huge type; on scroll the frame
 * contracts into an arch window while the backdrop shifts from charcoal to ivory.
 */
export const ExpandingHero = ({ media, children, after }: { media: ReactNode; children: ReactNode; after?: ReactNode }) => {
  const [ref, p] = useScrollProgress<HTMLDivElement>();
  const e = 1 - Math.pow(1 - p, 3);
  const inset = e * 14; // vw
  const radius = e * 50; // vw-ish arch top
  return (
    <div ref={ref} className="relative h-[180svh] bg-inverse">
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ backgroundColor: `hsl(var(--background) / ${e})` }}>
        <div className="absolute overflow-hidden will-change-[inset]"
          style={{ inset: `${e * 9}svh ${inset}vw ${e * 6}svh`, borderRadius: `${radius}vw ${radius}vw 1.5rem 1.5rem` }}>
          {media}
          <div className="absolute inset-0 bg-gradient-to-t from-inverse/80 via-inverse/20 to-inverse/40" style={{ opacity: 1 - e * 0.6 }} />
        </div>
        <div className="film-grain pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-end pb-[10svh]" style={{ opacity: 1 - Math.min(1, p * 2.2), transform: `translateY(${-p * 60}px)` }}>
          {children}
        </div>
        {after && (
          <div className="absolute inset-x-0 bottom-0 z-10" style={{ opacity: Math.max(0, (p - 0.65) / 0.35) }}>{after}</div>
        )}
      </div>
    </div>
  );
};

export interface Scene { word: string; line: string; image: string; alt: string }

/** Dark pinned scenes: full-bleed imagery cross-fades while one huge word changes. */
export const PinnedScenes = ({ scenes, eyebrow }: { scenes: Scene[]; eyebrow: string }) => {
  const [ref, p] = useScrollProgress<HTMLDivElement>();
  const active = Math.min(scenes.length - 1, Math.floor(p * scenes.length));
  return (
    <div ref={ref} className="relative bg-inverse text-inverse" style={{ height: `${scenes.length * 90 + 30}svh` }}>
      <div className="film-grain sticky top-0 h-[100svh] overflow-hidden">
        {scenes.map((s, i) => (
          <img key={s.word} src={s.image} alt={i === active ? s.alt : ""} loading="lazy" width={1200} height={1504}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out motion-reduce:transition-none ${i === active ? "scale-100 opacity-60" : "scale-[1.06] opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-inverse via-inverse/50 to-transparent" />
        <div className="section-container relative z-10 flex h-full flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand">{eyebrow}</p>
          <ol className="mt-6 flex gap-4 text-xs font-semibold tracking-[0.16em] text-inverse-muted" aria-hidden>
            {scenes.map((s, i) => <li key={s.word} className={`transition-colors duration-500 ${i === active ? "text-inverse" : ""}`}>0{i + 1}</li>)}
          </ol>
          <div className="relative mt-4 h-[6rem] sm:h-[9rem] lg:h-[13rem]">
            {scenes.map((s, i) => (
              <h3 key={s.word} aria-hidden={i !== active} className={`absolute inset-0 font-hero text-[5rem] font-semibold leading-none tracking-[-0.05em] text-inverse transition-all duration-700 motion-reduce:transition-none sm:text-[8rem] lg:text-[12rem] ${i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-8 opacity-0" : "translate-y-8 opacity-0"}`}>
                {s.word}<span className="text-dot">.</span>
              </h3>
            ))}
          </div>
          <p className="mt-6 max-w-md font-serif text-2xl italic leading-snug text-inverse/85 lg:text-3xl">{scenes[active].line}</p>
        </div>
      </div>
    </div>
  );
};

/** Section whose background eases between two tones as it scrolls in. */
export const LayeredParallax = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden ${className}`}>{children}</div>
);
