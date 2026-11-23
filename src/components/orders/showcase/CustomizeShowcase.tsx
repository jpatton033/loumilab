import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Monitor, Pause, Play, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_LAYOUTS, type Design } from "@/lib/orders/builder/schema";
import {
  FONT_PAIRS, HERO_LAYOUT_LABELS, PALETTES, SHOWCASE, STYLE_PRESETS,
  applyFontPair, applyPalette, applyStyle, heroLayoutOf, setHeroLayout, setPendingDesign,
} from "@/lib/orders/builder/presets";
import { ORDERS_CTA } from "@/data/orders/cta";
import { trackCtaClick } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { SitePreview } from "./SitePreview";

const INTERVAL = 5500;

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={cn("min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-medium transition",
      on ? "border-atmo-ivory bg-atmo-ivory text-atmo-obsidian" : "border-atmo-ivory/25 text-atmo-ivory/85 hover:border-atmo-ivory/60")}>{children}</button>
);
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div role="group" aria-label={label} className="flex items-center gap-3">
    <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-atmo-ivory/55">{label}</span>
    <div className="-my-1 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none]">{children}</div>
  </div>
);

/**
 * The Orders page's one customization showcase: six sample websites that rotate,
 * with a few real builder controls underneath. Same design data the builder saves.
 */
export default function CustomizeShowcase() {
  const [i, setI] = useState(0);
  const [designs, setDesigns] = useState<Design[]>(() => SHOWCASE.map((s) => s.design()));
  const [paused, setPaused] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"));
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = useRef<number | null>(null);
  const navigate = useNavigate();
  const site = SHOWCASE[i];
  const design = designs[i];
  const t = design.theme;

  const go = useCallback((d: number) => setI((v) => (v + d + SHOWCASE.length) % SHOWCASE.length), []);
  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [i, paused, reduced, go]);

  // Any customization stops the rotation so visitors keep what they made.
  const edit = (fn: (d: Design) => Design) => { setPaused(true); setDesigns((all) => all.map((d, j) => (j === i ? fn(d) : d))); };
  const reset = () => setDesigns((all) => all.map((d, j) => (j === i ? SHOWCASE[i].design() : d)));
  const start = () => { setPendingDesign(design); trackCtaClick("showcase", ORDERS_CTA.variant); navigate(ORDERS_CTA.href); };
  const ctl = "rounded-full border-atmo-ivory/25 bg-transparent text-atmo-ivory hover:bg-atmo-ivory/10";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Sample websites made with Loumilab Orders"
      onKeyDown={(e) => { if (e.target instanceof HTMLElement && e.target.closest("[data-preview]")) { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); } }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div data-preview tabIndex={0} aria-label={`${i + 1} of ${SHOWCASE.length}: ${site.label}. Scroll to see the whole page.`}
        className="h-[480px] overflow-y-auto overscroll-contain rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-atmo-ivory sm:h-[580px]"
        onWheel={() => setPaused(true)}>
        <div key={`${site.key}-${viewport}`} className={cn(!reduced && "animate-in fade-in duration-700")}>
          <SitePreview design={design} storeName={site.storeName} products={site.products} viewport={viewport} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-atmo-ivory/60">Sample website · {site.label}</p>
        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-1.5 sm:flex" role="tablist" aria-label="Choose a sample website">
            {SHOWCASE.map((s, j) => (
              <button key={s.key} type="button" role="tab" aria-selected={j === i} aria-label={s.label} onClick={() => setI(j)}
                className={cn("h-2 rounded-full transition-all", j === i ? "w-6 bg-dot" : "w-2 bg-atmo-ivory/35")} />
            ))}
          </div>
          <Button size="icon" variant="outline" className={ctl} aria-label={viewport === "desktop" ? "Show phone view" : "Show desktop view"} onClick={() => setViewport((v) => (v === "desktop" ? "mobile" : "desktop"))}>
            {viewport === "desktop" ? <Smartphone size={16} /> : <Monitor size={16} />}
          </Button>
          <Button size="icon" variant="outline" className={ctl} aria-label="Previous website" onClick={() => go(-1)}><ChevronLeft size={16} /></Button>
          <Button size="icon" variant="outline" className={ctl} aria-label={paused || reduced ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((p) => !p)}>{paused || reduced ? <Play size={16} /> : <Pause size={16} />}</Button>
          <Button size="icon" variant="outline" className={ctl} aria-label="Next website" onClick={() => go(1)}><ChevronRight size={16} /></Button>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-3xl border border-atmo-ivory/15 p-4 sm:p-5">
        <Row label="Style">{STYLE_PRESETS.map((p) => <Chip key={p.key} on={t.headingFont === p.theme.headingFont && t.background === p.theme.background} onClick={() => edit((d) => applyStyle(d, p))}>{p.name}</Chip>)}</Row>
        <Row label="Colors">
          {PALETTES.map((p) => {
            const on = t.accent === p.colors.accent && t.background === p.colors.background;
            return (
              <button key={p.key} type="button" aria-label={p.name} title={p.name} aria-pressed={on} onClick={() => edit((d) => applyPalette(d, p))}
                className={cn("flex h-10 shrink-0 overflow-hidden rounded-full border-2", on ? "border-atmo-ivory" : "border-atmo-ivory/20")}>
                {[p.colors.background, p.colors.surface, p.colors.accent].map((c) => <span key={c} className="h-full w-4" style={{ background: c }} />)}
              </button>
            );
          })}
        </Row>
        <Row label="Fonts">{FONT_PAIRS.map((f) => <Chip key={f.key} on={t.headingFont === f.heading && t.bodyFont === f.body} onClick={() => edit((d) => applyFontPair(d, f))}>{f.name}</Chip>)}</Row>
        <Row label="Layout">{HERO_LAYOUTS.map((l) => <Chip key={l} on={heroLayoutOf(design) === l} onClick={() => edit((d) => setHeroLayout(d, l))}>{HERO_LAYOUT_LABELS[l]}</Chip>)}</Row>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" onClick={start} className="rounded-full bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/90">Start With This Design</Button>
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-atmo-ivory/75 hover:text-atmo-ivory"><RotateCcw size={14} /> Reset this design</button>
        <p className="text-xs text-atmo-ivory/55 sm:ml-auto sm:max-w-xs">Free, no account needed. Your design opens in the website builder after you sign up.</p>
      </div>
    </div>
  );
}
