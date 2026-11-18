import { useEffect, useRef, useState } from "react";
import wide from "@/assets/senti/awakening-wide.mp4.asset.json";
import tall from "@/assets/senti/awakening-tall.mp4.asset.json";
import widePoster from "@/assets/senti/awakening-wide.jpg";
import tallPoster from "@/assets/senti/awakening-tall.jpg";

const useMedia = (q: string) => {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const s = () => setM(mq.matches); s(); mq.addEventListener("change", s); return () => mq.removeEventListener("change", s); }, [q]);
  return m;
};

/** "The Awakening": looping gold-brain film, pointer parallax + sparks, scroll pull-back. Poster only for reduced motion. */
export function SentiHeroFilm() {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const portrait = useMedia("(max-aspect-ratio: 4/5)");
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = portrait ? tallPoster : widePoster;

  // Play only when visible.
  useEffect(() => {
    const v = video.current; if (!v || reduced) return;
    let visible = true;
    const update = () => (visible && !document.hidden ? v.play().catch(() => {}) : v.pause());
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); });
    io.observe(v); document.addEventListener("visibilitychange", update);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [reduced, portrait]);

  // Parallax, sparks and scroll exit in one rAF loop.
  useEffect(() => {
    if (reduced) return;
    const el = root.current, st = stage.current, cv = canvas.current; if (!el || !st || !cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let tx = 0, ty = 0, x = 0, y = 0, px = -1, py = -1, idle = 0, raf = 0, running = true;
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const size = () => { const d = Math.min(devicePixelRatio, 2); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); window.addEventListener("resize", size);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; idle = 0;
      tx = (px / r.width - 0.5) * 2; ty = (py / r.height - 0.5) * 2;
      if (sparks.length < 40 && Math.random() < 0.35) sparks.push({ x: px, y: py, vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.5, life: 1 });
    };
    if (fine) el.addEventListener("pointermove", move);
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); } });
    io.observe(el);
    function tick() {
      if (!running) return;
      if (++idle > 120) { tx *= 0.96; ty *= 0.96; }
      x += (tx - x) * 0.04; y += (ty - y) * 0.04;
      const h = el!.offsetHeight, p = Math.min(Math.max(-el!.getBoundingClientRect().top / h, 0), 1);
      st!.style.transform = `translate3d(${-x * 14}px, ${-y * 10 + p * 60}px, 0) scale(${1.06 - p * 0.08})`;
      st!.style.opacity = String(1 - p * 0.85);
      ctx!.clearRect(0, 0, cv!.clientWidth, cv!.clientHeight);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.life -= 0.012;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
        g.addColorStop(0, `hsla(42, 85%, 72%, ${s.life * 0.7})`); g.addColorStop(1, "hsla(38, 80%, 50%, 0)");
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); el.removeEventListener("pointermove", move); };
  }, [reduced]);

  return (
    <div ref={root} className="absolute inset-0 -z-10 bg-atmo-obsidian" aria-hidden="true">
      <div ref={stage} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.06)" }}>
        {reduced ? <img src={poster} alt="" className="h-full w-full object-cover" /> :
          <video key={portrait ? "t" : "w"} ref={video} className="h-full w-full object-cover" src={(portrait ? tall : wide).url} poster={poster} muted loop playsInline autoPlay preload="auto" />}
      </div>
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-atmo-obsidian via-transparent to-atmo-obsidian/50" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-atmo-obsidian/90 via-atmo-obsidian/30 to-transparent [@media(min-aspect-ratio:4/5)]:block" />
    </div>
  );
}
