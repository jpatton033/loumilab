import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export type Frame = { src: string; alt: string; caption?: string };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Auto sequence: each frame enters from the right, rests, then exits left. */
export function RtlSequence({ frames, interval = 5000, className = "" }: { frames: Frame[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (paused || hover || reduced() || frames.length < 2) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % frames.length), interval);
    return () => window.clearTimeout(t);
  }, [i, paused, hover, interval, frames.length]);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-inverse ${className}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} aria-roledescription="carousel">
      {frames.map((f, n) => {
        const state = n === i ? "translate-x-0" : n === (i - 1 + frames.length) % frames.length ? "-translate-x-full" : "translate-x-full";
        return (
          <figure key={f.src} aria-hidden={n !== i} className={`absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${state}`}>
            <img src={f.src} alt={f.alt} loading={n === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />
            {f.caption && <figcaption className="absolute bottom-5 left-5 rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold text-foreground">{f.caption}</figcaption>}
          </figure>
        );
      })}
      <div className="absolute bottom-5 right-5 flex items-center gap-2">
        {frames.map((f, n) => (
          <button key={f.src} onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-background" : "w-1.5 bg-background/50"}`} />
        ))}
        <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play sequence" : "Pause sequence"} className="ml-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground">
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>
    </div>
  );
}

/** Scroll rail: on desktop, vertical scroll moves items right→left; on touch it's a swipe row. */
export function ScrollRail({ items, tone = "light" }: { items: Frame[]; tone?: "light" | "dark" }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = () => setDesk(mq.matches && !reduced());
    set(); mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  useEffect(() => {
    if (!desk) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = wrap.current, t = track.current; if (!w || !t) return;
        const r = w.getBoundingClientRect();
        const span = w.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
        t.style.transform = `translate3d(${-(t.scrollWidth - window.innerWidth + 64) * p}px,0,0)`;
      });
    };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [desk]);

  const cap = tone === "dark" ? "text-inverse-muted" : "text-muted-foreground";
  const cards = items.map((f) => (
    <figure key={f.src} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[34vw]">
      <div className="overflow-hidden rounded-3xl"><img src={f.src} alt={f.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" /></div>
      {f.caption && <figcaption className={`mt-4 text-sm ${cap}`}>{f.caption}</figcaption>}
    </figure>
  ));

  if (!desk) return <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none]">{cards}</div>;
  return (
    <div ref={wrap} style={{ height: `${100 + items.length * 22}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={track} className="flex gap-8 pl-[8vw] will-change-transform">{cards}</div>
      </div>
    </div>
  );
}
