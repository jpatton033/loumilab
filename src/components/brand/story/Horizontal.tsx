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

/* ───────── Auto motion: runs on its own, never on scroll ───────── */

/** True while the element is on screen, the tab is visible and motion is allowed. */
export function useAutoMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ok] = useState(() => !reduced());
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const vis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return { ref, running: inView && visible && ok, motionOk: ok };
}

function PauseToggle({ paused, onToggle, tone }: { paused: boolean; onToggle: () => void; tone: "light" | "dark" }) {
  const c = tone === "dark" ? "border-inverse/30 text-inverse hover:bg-inverse/10" : "border-foreground/20 text-foreground hover:bg-foreground/5";
  return (
    <button type="button" onClick={onToggle} aria-label={paused ? "Play motion" : "Pause motion"} className={`flex h-11 w-11 items-center justify-center rounded-full border bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${c}`}>
      {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
    </button>
  );
}

/** Seamless right-to-left loop. Items are duplicated once; the copy is hidden from assistive tech. */
export function AutoMarquee({ items, duration = 40, gap = "gap-5", tone = "light", label, showToggle = true, className = "" }: {
  items: React.ReactNode[]; duration?: number; gap?: string; tone?: "light" | "dark"; label: string; showToggle?: boolean; className?: string;
}) {
  const { ref, running, motionOk } = useAutoMotion<HTMLDivElement>();
  const [user, setUser] = useState(false);
  const [hover, setHover] = useState(false);
  const paused = !running || user || hover;
  if (!motionOk) {
    return <div className={`flex snap-x gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] ${className}`} aria-label={label}>{items}</div>;
  }
  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="overflow-hidden" aria-label={label} role="region"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}>
        <div className={`marquee-track ${gap}`} data-paused={paused} style={{ ["--marquee-dur" as string]: `${duration}s` }}>
          <div className={`flex shrink-0 ${gap}`}>{items}</div>
          <div className={`flex shrink-0 ${gap}`} aria-hidden="true" inert={"" as unknown as boolean}>{items}</div>
        </div>
      </div>
      {showToggle && <div className="section-container mt-5 flex justify-end"><PauseToggle paused={user} onToggle={() => setUser((u) => !u)} tone={tone} /></div>}
    </div>
  );
}

/** Timed crossfade: words and media change on a timer, independent of scroll. */
export function TimedCrossfade({ scenes, interval = 3200, className = "" }: {
  scenes: { word: string; line: string; media: React.ReactNode }[]; interval?: number; className?: string;
}) {
  const { ref, running } = useAutoMotion<HTMLDivElement>();
  const [i, setI] = useState(0);
  const [user, setUser] = useState(false);
  useEffect(() => {
    if (!running || user) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % scenes.length), interval);
    return () => window.clearTimeout(t);
  }, [i, running, user, interval, scenes.length]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {scenes.map((s, n) => (
        <div key={s.word} aria-hidden={n !== i} className={`absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${n === i ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}>{s.media}</div>
      ))}
      <div className="absolute inset-0 bg-ink/45" aria-hidden />
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 lg:p-14">
        <p className="font-hero text-[3.4rem] font-semibold leading-[0.9] tracking-[-0.05em] text-inverse sm:text-[6rem] lg:text-[9rem]" aria-live="polite">
          {scenes[i].word}<span className="text-dot">.</span>
        </p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-lg text-lg leading-relaxed text-inverse/85">{scenes[i].line}</p>
          <div className="flex items-center gap-3">
            {scenes.map((s, n) => (
              <button key={s.word} type="button" onClick={() => setI(n)} aria-label={`Show ${s.word}`} className="flex h-11 w-11 items-center justify-center">
                <span className={`block h-1 rounded-full transition-all ${n === i ? "w-8 bg-inverse" : "w-3 bg-inverse/40"}`} />
              </button>
            ))}
            <PauseToggle paused={user} onToggle={() => setUser((u) => !u)} tone="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Layered stack: frames slide in from the right, settle tilted, then leave to the left. */
export function LayeredStack({ frames, interval = 3400, className = "" }: { frames: Frame[]; interval?: number; className?: string }) {
  const { ref, running } = useAutoMotion<HTMLDivElement>();
  const [i, setI] = useState(0);
  const [user, setUser] = useState(false);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!running || user || hover) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % frames.length), interval);
    return () => window.clearTimeout(t);
  }, [i, running, user, hover, interval, frames.length]);
  const L = frames.length;
  return (
    <div className={className}>
      <div ref={ref} className="relative aspect-[4/3] w-full" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        {frames.map((f, n) => {
          const d = (n - i + L) % L; // 0 = front, 1 = next (right), L-1 = leaving (left)
          const pos = d === 0 ? "translate-x-0 rotate-0 scale-100 opacity-100 z-30"
            : d === 1 ? "translate-x-[14%] rotate-[3deg] scale-[0.9] opacity-80 z-20"
            : d === L - 1 ? "-translate-x-[60%] -rotate-[4deg] scale-[0.85] opacity-0 z-10"
            : "translate-x-[40%] rotate-[5deg] scale-[0.82] opacity-0 z-0";
          return (
            <figure key={f.src} aria-hidden={d !== 0} className={`absolute inset-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${pos}`}>
              <div className="h-full overflow-hidden rounded-3xl border border-inverse/15 shadow-[0_40px_80px_-30px_hsl(var(--ink)/0.8)]">
                <img src={f.src} alt={f.alt} loading="lazy" className="h-full w-full object-cover object-top" />
              </div>
              {f.caption && <figcaption className="absolute -bottom-10 left-0 text-sm text-inverse-muted">{f.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
      <div className="mt-16 flex justify-end"><PauseToggle paused={user} onToggle={() => setUser((u) => !u)} tone="dark" /></div>
    </div>
  );
}

/** Muted looping clip that only plays while on screen. */
export function LoopVideo({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const { ref, running, motionOk } = useAutoMotion<HTMLVideoElement>();
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (running) v.play().catch(() => {}); else v.pause();
  }, [running, ref]);
  if (!motionOk && poster) return <img src={poster} alt="" className={className} />;
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden className={className} />;
}
