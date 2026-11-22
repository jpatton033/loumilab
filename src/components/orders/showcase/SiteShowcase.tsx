import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Monitor, Pause, Play, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOWCASE, setPendingDesign } from "@/lib/orders/builder/presets";
import { ORDERS_CTA } from "@/data/orders/cta";
import { cn } from "@/lib/utils";
import { SitePreview } from "./SitePreview";

const INTERVAL = 5500;

/** Six sample websites, each a real Orders design. "Start with this template" carries it into setup. */
export default function SiteShowcase({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"));
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const designs = useRef(SHOWCASE.map((s) => s.design()));
  const touch = useRef<number | null>(null);
  const navigate = useNavigate();
  const site = SHOWCASE[i];
  const go = useCallback((d: number) => setI((v) => (v + d + SHOWCASE.length) % SHOWCASE.length), []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [i, paused, reduced, go]);

  const start = () => { setPendingDesign(designs.current[i]); navigate(ORDERS_CTA.href); };
  const ctl = tone === "dark" ? "border-atmo-ivory/25 text-atmo-ivory hover:bg-atmo-ivory/10" : "border-border text-foreground hover:bg-secondary";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Sample websites made with Loumilab Orders"
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div className="relative h-[460px] overflow-hidden sm:h-[560px]" aria-live={paused ? "polite" : "off"}>
        <div key={`${site.key}-${viewport}`} className={cn("absolute inset-0", !reduced && "animate-in fade-in zoom-in-[0.98] duration-700")}
          role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SHOWCASE.length}: ${site.label}`}>
          <SitePreview design={designs.current[i]} storeName={site.storeName} products={site.products} viewport={viewport} className="h-full" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={cn("text-xs uppercase tracking-[0.2em]", tone === "dark" ? "text-atmo-ivory/60" : "text-muted-foreground")}>Sample website · {site.label}</p>
          <button type="button" onClick={start} className={cn("mt-1 text-sm font-semibold underline-offset-4 hover:underline", tone === "dark" ? "text-atmo-ivory" : "text-foreground")}>Start with this template →</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 hidden items-center gap-1.5 sm:flex" role="tablist" aria-label="Choose a sample website">
            {SHOWCASE.map((s, j) => (
              <button key={s.key} type="button" role="tab" aria-selected={j === i} aria-label={s.label} onClick={() => setI(j)}
                className={cn("h-2 rounded-full transition-all", j === i ? "w-6 bg-dot" : tone === "dark" ? "w-2 bg-atmo-ivory/35" : "w-2 bg-foreground/25")} />
            ))}
          </div>
          <Button size="icon" variant="outline" className={cn("rounded-full bg-transparent", ctl)} aria-label={viewport === "desktop" ? "Show phone view" : "Show desktop view"} onClick={() => setViewport((v) => (v === "desktop" ? "mobile" : "desktop"))}>
            {viewport === "desktop" ? <Smartphone size={16} /> : <Monitor size={16} />}
          </Button>
          <Button size="icon" variant="outline" className={cn("rounded-full bg-transparent", ctl)} aria-label="Previous website" onClick={() => go(-1)}><ChevronLeft size={16} /></Button>
          <Button size="icon" variant="outline" className={cn("rounded-full bg-transparent", ctl)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((p) => !p)}>{paused || reduced ? <Play size={16} /> : <Pause size={16} />}</Button>
          <Button size="icon" variant="outline" className={cn("rounded-full bg-transparent", ctl)} aria-label="Next website" onClick={() => go(1)}><ChevronRight size={16} /></Button>
        </div>
      </div>
    </div>
  );
}
