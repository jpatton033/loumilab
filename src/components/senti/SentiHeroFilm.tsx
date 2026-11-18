import { useEffect, useRef, useState } from "react";
import film from "@/assets/senti/senti-hero-film.mp4.asset.json";
import poster from "@/assets/senti/senti-hero-poster.jpg";

/** Muted looping research film; poster only for reduced motion; pauses offscreen. */
export function SentiHeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(rm.matches); sync();
    rm.addEventListener("change", sync); return () => rm.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const v = ref.current; if (!v || reduced) return;
    let visible = true;
    const update = () => (visible && !document.hidden ? v.play().catch(() => {}) : v.pause());
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); });
    io.observe(v); document.addEventListener("visibilitychange", update);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [reduced]);
  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      {reduced ? <img src={poster} alt="" className="h-full w-full object-cover" /> :
        <video ref={ref} className="h-full w-full object-cover" src={film.url} poster={poster} muted loop playsInline autoPlay preload="metadata" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-atmo-obsidian via-atmo-obsidian/30 to-atmo-obsidian/40" />
    </div>
  );
}
