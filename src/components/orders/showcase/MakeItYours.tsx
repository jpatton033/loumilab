import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_LAYOUTS } from "@/lib/orders/builder/schema";
import {
  ARRANGEMENTS, FONT_PAIRS, HERO_LAYOUT_LABELS, PALETTES, PREVIEW_SITE, PREVIEW_START, STYLE_PRESETS,
  applyFontPair, applyPalette, applyStyle, arrange, heroLayoutOf, readableOn, setHeroLayout, setPendingDesign,
} from "@/lib/orders/builder/presets";
import { ORDERS_CTA } from "@/data/orders/cta";
import { cn } from "@/lib/utils";
import { SitePreview } from "./SitePreview";

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div role="group" aria-label={label}><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>{children}</div>
);
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={cn("min-h-10 rounded-full border px-3 text-xs font-medium transition", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50")}>{children}</button>
);

/** Public "Make it yours" preview. Every control edits the same design data the merchant builder saves. */
export default function MakeItYours({ onExplore }: { onExplore?: () => void }) {
  const [design, setDesign] = useState(PREVIEW_START);
  const [style, setStyle] = useState<string | null>(null);
  const [arr, setArr] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"));
  const navigate = useNavigate();
  const t = design.theme;
  const hero = heroLayoutOf(design);

  const start = () => { setPendingDesign(design); navigate(ORDERS_CTA.href); };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 rounded-3xl border border-border bg-card p-6 lg:col-span-4">
        <Group label="Style">
          <div className="flex flex-wrap gap-2">{STYLE_PRESETS.map((p) => <Chip key={p.key} on={style === p.key} onClick={() => { setStyle(p.key); setDesign((d) => applyStyle(d, p)); }}>{p.name}</Chip>)}</div>
        </Group>
        <Group label="Colors">
          <div className="flex flex-wrap items-center gap-2">
            {PALETTES.map((p) => (
              <button key={p.key} type="button" aria-label={p.name} title={p.name} aria-pressed={t.accent === p.colors.accent && t.background === p.colors.background}
                onClick={() => setDesign((d) => applyPalette(d, p))}
                className={cn("flex h-9 overflow-hidden rounded-full border-2", t.accent === p.colors.accent && t.background === p.colors.background ? "border-foreground" : "border-border")}>
                {[p.colors.background, p.colors.surface, p.colors.accent].map((c) => <span key={c} className="h-full w-4" style={{ background: c }} />)}
              </button>
            ))}
            <label className="flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-medium">
              Accent
              <input type="color" value={t.accent} aria-label="Custom accent color" className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent"
                onChange={(e) => { const v = e.target.value; setDesign((d) => ({ ...d, theme: { ...d.theme, accent: v, accentText: readableOn(v) } })); }} />
            </label>
          </div>
        </Group>
        <Group label="Fonts">
          <div className="flex flex-wrap gap-2">{FONT_PAIRS.map((f) => <Chip key={f.key} on={t.headingFont === f.heading && t.bodyFont === f.body} onClick={() => setDesign((d) => applyFontPair(d, f))}>{f.name}</Chip>)}</div>
        </Group>
        <Group label="Hero layout">
          <div className="flex flex-wrap gap-2">{HERO_LAYOUTS.map((l) => <Chip key={l} on={hero === l} onClick={() => setDesign((d) => setHeroLayout(d, l))}>{HERO_LAYOUT_LABELS[l]}</Chip>)}</div>
        </Group>
        <Group label="Section order">
          <div className="flex flex-wrap gap-2">{ARRANGEMENTS.map((a) => <Chip key={a.key} on={arr === a.key} onClick={() => { setArr(a.key); setDesign((d) => arrange(d, a.order)); }}>{a.name}</Chip>)}</div>
        </Group>
        <div className="flex items-center justify-between border-t border-border pt-5">
          <div className="flex gap-1 rounded-full border border-border p-1" role="group" aria-label="Preview size">
            {(["desktop", "mobile"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={viewport === v} onClick={() => setViewport(v)} aria-label={v === "desktop" ? "Desktop view" : "Phone view"}
                className={cn("flex h-9 w-11 items-center justify-center rounded-full", viewport === v ? "bg-foreground text-background" : "text-muted-foreground")}>
                {v === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setDesign(PREVIEW_START()); setStyle(null); setArr(null); }} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <RotateCcw size={14} /> Reset design
          </button>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <Button size="lg" className="rounded-full" onClick={start}>Start With This Design</Button>
          {onExplore && <Button size="lg" variant="outline" className="rounded-full" onClick={onExplore}>Explore More Templates</Button>}
          <p className="text-xs text-muted-foreground">Free to start. Your design is saved on this device for 24 hours and opens in the website builder after you sign up.</p>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="max-h-[720px] overflow-y-auto rounded-2xl">
          <SitePreview design={design} storeName={PREVIEW_SITE.storeName} products={PREVIEW_SITE.products} viewport={viewport} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Sample business. Scroll the preview to see the whole page.</p>
      </div>
    </div>
  );
}
