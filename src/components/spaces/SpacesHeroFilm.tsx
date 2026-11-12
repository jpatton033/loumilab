import { useEffect, useRef, useState } from "react";
import film from "@/assets/spaces/built_by_people_film.mp4.asset.json";
import filmVertical from "@/assets/spaces/built_by_people_film_vertical.mp4.asset.json";
import poster from "@/assets/spaces/built_by_people_poster.webp.asset.json";

/**
 * "Built by People" brand film: muralist → dancer → ceramicist → shop owner.
 * Muted, looping, inline; vertical cut on phones; poster only for reduced
 * motion; pauses when offscreen or when the tab is hidden.
 */
export const SpacesHeroFilm = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mm = window.matchMedia("(max-width: 767px)");
    const sync = () => { setReduced(rm.matches); setMobile(mm.matches); };
    sync();
    rm.addEventListener("change", sync); mm.addEventListener("change", sync);
    return () => { rm.removeEventListener("change", sync); mm.removeEventListener("change", sync); };
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || reduced) return;
    let visible = true;
    const update = () => (visible && !document.hidden ? v.play().catch(() => {}) : v.pause());
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); });
    io.observe(v);
    document.addEventListener("visibilitychange", update);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [reduced, mobile]);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      {reduced ? (
        <img src={poster.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <video key={mobile ? "v" : "h"} ref={ref} className="h-full w-full object-cover"
          src={mobile ? filmVertical.url : film.url} poster={poster.url}
          muted loop playsInline autoPlay preload="metadata" />
      )}
      {/* Readability shade from the bottom-left, then into the page below */}
      <div className="absolute inset-0 bg-gradient-to-tr from-ink/90 via-ink/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
    </div>
  );
};
