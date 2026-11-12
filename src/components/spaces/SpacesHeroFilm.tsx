import { useEffect, useRef, useState } from "react";

/**
 * A five-scene looping browser animation (no video): create → independence →
 * converge into Spaces → deploy → continue. Transform/opacity only; pauses when
 * offscreen or hidden; shows a still composition for reduced motion.
 */
const SCENES = ["Create", "Independent", "Spaces", "Deploy", "Continue"] as const;
const DUR = 3800;

// 12 fragments with a position per scene: [x%, y%, rotate, scale, opacity]
type P = [number, number, number, number, number];
const F: { kind: "code" | "ui" | "block"; w: number; h: number; pos: P[] }[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const col = i % 4, row = Math.floor(i / 4);
  const grid: P = [-27 + col * 18, -16 + row * 16, 0, 0.9, 1];
  return {
    kind: i % 3 === 0 ? "code" : i % 3 === 1 ? "ui" : "block",
    w: 120 + (i % 4) * 26, h: 56 + (i % 3) * 22,
    pos: [
      [Math.cos(a) * 38, Math.sin(a) * 30, (i % 2 ? 6 : -6), 0.9, 0.85],
      [Math.cos(a) * 46 + (i % 2 ? 10 : -10), Math.sin(a) * 36, (i % 2 ? -12 : 12), 0.75, 0.6],
      grid,
      [grid[0] * 0.55, grid[1] * 0.55, 0, 0.62, i < 6 ? 0.25 : 0],
      [Math.cos(a + 0.4) * 34, Math.sin(a + 0.4) * 26, (i % 2 ? 4 : -4), 0.85, 0.75],
    ],
  };
});

export const SpacesHeroFilm = () => {
  const [scene, setScene] = useState(0);
  const [still, setStill] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(mq.matches);
    if (mq.matches) { setScene(2); return; }
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (ref.current) io.observe(ref.current);
    const t = setInterval(() => { if (visible && !document.hidden) setScene((s) => (s + 1) % SCENES.length); }, DUR);
    return () => { clearInterval(t); io.disconnect(); };
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ink" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,hsl(var(--inverse-foreground)/0.07),transparent_60%)]" />
      <div className="absolute left-1/2 top-[56%] h-[min(70vh,640px)] w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2 [perspective:1400px]">
        {/* The Space frame appears from scene 2 onward */}
        <div className="absolute inset-[14%_18%] rounded-3xl border border-inverse/15 transition-all duration-[1400ms] ease-out"
          style={{ opacity: scene >= 2 && scene <= 3 ? 1 : 0, transform: `scale(${scene === 3 ? 0.68 : scene >= 2 ? 1 : 1.15})` }} />
        {/* The live app (deploy) */}
        <div className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-inverse/20 bg-inverse/[0.06] transition-all duration-[1400ms] ease-out"
          style={{ opacity: scene === 3 ? 1 : scene === 4 ? 0.35 : 0, transform: `translate(-50%,-50%) scale(${scene === 3 ? 1 : 0.9})`, aspectRatio: "16/10" }}>
          <div className="flex gap-1.5 border-b border-inverse/10 p-3"><i className="h-2 w-2 rounded-full bg-inverse/30" /><i className="h-2 w-2 rounded-full bg-inverse/30" /><i className="h-2 w-2 rounded-full bg-inverse/30" /><span className="ml-3 h-2 w-40 rounded-full bg-inverse/15" /></div>
          <div className="grid grid-cols-3 gap-3 p-5"><span className="col-span-2 h-16 rounded-lg bg-inverse/15" /><span className="h-16 rounded-lg bg-inverse/10" /><span className="h-24 rounded-lg bg-inverse/10" /><span className="col-span-2 h-24 rounded-lg bg-inverse/[0.08]" /></div>
          <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-inverse/70"><i className="h-1.5 w-1.5 rounded-full bg-dot" />Live · v{scene === 4 ? "1.1.0" : "1.0.0"}</div>
        </div>
        {F.map((f, i) => {
          const [x, y, r, s, o] = still ? f.pos[2] : f.pos[scene];
          return (
            <div key={i} className="absolute left-1/2 top-1/2 rounded-xl border border-inverse/12 bg-inverse/[0.04] p-3 transition-all ease-[cubic-bezier(.22,.8,.2,1)]"
              style={{ width: f.w, height: f.h, opacity: o, transitionDuration: `${1300 + (i % 4) * 120}ms`,
                transform: `translate(-50%,-50%) translate(${x}vw, ${y}vh) rotateY(${r}deg) rotateZ(${r / 3}deg) scale(${s})` }}>
              {f.kind === "code" && <div className="space-y-1.5">{[70, 45, 85, 30].map((w, k) => <span key={k} className="block h-1.5 rounded-full bg-inverse/25" style={{ width: `${w}%`, marginLeft: k % 2 ? 10 : 0 }} />)}</div>}
              {f.kind === "ui" && <div className="flex h-full items-center gap-2"><span className="h-6 w-6 rounded-md bg-inverse/20" /><span className="h-2 flex-1 rounded-full bg-inverse/20" /></div>}
              {f.kind === "block" && <div className="grid h-full grid-cols-3 gap-1.5">{[0, 1, 2].map((k) => <span key={k} className="rounded-md bg-inverse/10" />)}</div>}
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink/85" />
      <ol className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-6 text-[10px] font-medium uppercase tracking-[0.2em]">
        {SCENES.map((s, i) => <li key={s} className={`transition-colors duration-700 ${i === scene ? "text-inverse" : "text-inverse/35"}`}>{s}</li>)}
      </ol>
    </div>
  );
};
