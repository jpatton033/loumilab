import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Image that unmasks once when it scrolls into view. */
export const UnmaskImage = ({ className = "", ...img }: React.ImgHTMLAttributes<HTMLImageElement> & { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced()) { setIn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`unmask overflow-hidden ${inView ? "is-in" : ""} ${className}`}>
      <img {...img} className="h-full w-full object-cover" />
    </div>
  );
};

/** Small vertical drift tied to scroll position (max ±shift px). */
export const useDrift = <T extends HTMLElement>(shift = 40) => {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || reduced()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      el.style.translate = `0 ${Math.max(-1, Math.min(1, p)) * -shift}px`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [shift]);
  return ref;
};

export interface Chapter { word: string; line: string; image: string; alt: string }

/** Pinned scroll sequence: one word and image per chapter. */
export const ChapterSequence = ({ chapters }: { chapters: Chapter[] }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(0.999, Math.max(0, -r.top / total)) : 0;
      setActive(Math.floor(p * chapters.length));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapters.length]);

  return (
    <div ref={wrap} className="relative" style={{ height: `${chapters.length * 80 + 40}vh` }}>
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center lg:top-[72px] lg:h-[calc(100svh-72px)]">
        <div className="section-container grid w-full items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <ol className="flex gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" aria-hidden>
              {chapters.map((c, i) => <li key={c.word} className={`transition-colors duration-500 ${i === active ? "text-foreground" : ""}`}>0{i + 1}</li>)}
            </ol>
            <div className="relative mt-6 h-[5.5rem] sm:h-[8rem] lg:h-[10rem]">
              {chapters.map((c, i) => (
                <h3 key={c.word} aria-hidden={i !== active} className={`absolute inset-0 font-hero text-[4.5rem] font-semibold leading-none tracking-[-0.04em] transition-all duration-700 motion-reduce:transition-none sm:text-[7rem] lg:text-[9rem] ${i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"}`}>
                  {c.word}<span className="text-dot">.</span>
                </h3>
              ))}
            </div>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground lg:text-xl">{chapters[active].line}</p>
          </div>
          <div className="relative aspect-[4/5] max-h-[62svh] w-full overflow-hidden rounded-[2rem] lg:max-h-[72svh]">
            {chapters.map((c, i) => (
              <img key={c.word} src={c.image} alt={c.alt} loading="lazy" width={1200} height={1504} className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out motion-reduce:transition-none ${i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
