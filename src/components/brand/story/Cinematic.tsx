import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import { useAutoMotion } from "./Horizontal";

/* ───────── Background video: clips play one after another, crossfading, looping ───────── */
export function VideoSequence({ clips, poster }: { clips: string[]; poster?: string }) {
  const [cur, setCur] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [motionOk] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!motionOk) return;
    const v = refs.current[cur]; if (!v) return;
    v.currentTime = 0; v.play().catch(() => {});
  }, [cur, motionOk]);
  if (!motionOk) return poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null;
  return (
    <>
      {clips.map((src, i) => (
        <video key={src} ref={(el) => (refs.current[i] = el)} src={src} poster={i === 0 ? poster : undefined} muted playsInline preload={i === 0 ? "auto" : "metadata"}
          onEnded={() => setCur((c) => (c + 1) % clips.length)} aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${i === cur ? "opacity-100" : "opacity-0"}`} />
      ))}
    </>
  );
}

/* ───────── Foreground previews: scenes of 3 panels that slide in from the right, then drift out left ───────── */
export type Panel = { node: ReactNode; label: string; pos: string; tilt?: number };
export type Scene = { name: string; panels: Panel[] };

export function PreviewScenes({ scenes, interval = 7000 }: { scenes: Scene[]; interval?: number }) {
  const { ref, running, motionOk } = useAutoMotion<HTMLDivElement>();
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [user, setUser] = useState(false);
  useEffect(() => {
    if (!running || user) return;
    const id = window.setInterval(() => setCur((c) => { setPrev(c); return (c + 1) % scenes.length; }), interval);
    return () => window.clearInterval(id);
  }, [running, user, interval, scenes.length]);
  return (
    <div ref={ref} className="relative h-full w-full" aria-label="Examples of websites, software and Loumilab products" role="region">
      {scenes.map((s, si) => {
        const state = si === cur ? "on" : si === prev ? "out" : "wait";
        return (
          <div key={s.name} aria-hidden={state !== "on"} className="absolute inset-0">
            {s.panels.map((p, pi) => (
              <div key={p.label} className={`absolute ${p.pos}`} style={{ zIndex: 10 + pi }}>
                <div
                  className="transition-[transform,opacity] ease-[cubic-bezier(.2,.7,.1,1)]"
                  style={{
                    transitionDuration: state === "wait" ? "0ms" : "1400ms",
                    transitionDelay: state === "on" ? `${pi * 220}ms` : `${pi * 90}ms`,
                    opacity: state === "on" ? 1 : 0,
                    transform: `${state === "on" ? "translate3d(0,0,0) scale(1)" : state === "out" ? "translate3d(-18%,0,0) scale(.97)" : "translate3d(28%,0,0) scale(.96)"} rotate(${p.tilt ?? 0}deg)`,
                  }}>
                  {p.node}
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-inverse-muted">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {motionOk && (
        <button type="button" onClick={() => setUser((u) => !u)} aria-label={user ? "Play motion" : "Pause motion"}
          className="absolute bottom-0 right-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-inverse/30 text-inverse transition-colors hover:bg-inverse/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {user ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        </button>
      )}
    </div>
  );
}

/* ───────── Floating gallery: previews suspended at different depths in a black space ───────── */
export type FloatItem = { src?: string; node?: ReactNode; label: string; to?: string; pos: string; w: string; depth: 0 | 1 | 2; aspect?: string };

export function FloatingGallery({ items }: { items: FloatItem[] }) {
  const { ref, running } = useAutoMotion<HTMLDivElement>();
  const depth = ["opacity-100", "opacity-80 blur-[1px]", "opacity-50 blur-[2px]"];
  return (
    <div ref={ref} data-paused={!running} className="float-stage relative mx-auto h-[150vw] max-h-[900px] min-h-[620px] w-full max-w-[1600px] sm:h-[80vw]">
      {items.map((it, i) => {
        const inner = (
          <div className="overflow-hidden rounded-xl border border-inverse/15 bg-ink shadow-2xl">
            {it.src ? <img src={it.src} alt={it.label} loading="lazy" className={`w-full object-cover object-top ${it.aspect ?? "aspect-[16/10]"}`} /> : it.node}
          </div>
        );
        return (
          <div key={it.label} className={`float-item group absolute ${it.pos} ${it.w}`}
            style={{ zIndex: 30 - it.depth * 10, ["--float-dur" as string]: `${16 + i * 2.3}s`, ["--float-delay" as string]: `${-i * 1.7}s`, ["--drift" as string]: `${50 - it.depth * 15}px`, ["--bob" as string]: `${(i % 2 ? -1 : 1) * 10}px` }}>
            <div className={`transition-[transform,filter,opacity] duration-500 group-hover:z-40 group-hover:scale-[1.06] group-hover:opacity-100 group-hover:blur-0 ${depth[it.depth]}`}>
              {it.to ? <Link to={it.to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link> : inner}
              <p className="mt-2 text-xs font-medium text-inverse opacity-0 transition-opacity group-hover:opacity-100">{it.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
