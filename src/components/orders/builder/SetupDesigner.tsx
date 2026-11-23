import { Check } from "lucide-react";
import { TEMPLATES } from "@/lib/orders/builder/templates";
import type { Design } from "@/lib/orders/builder/schema";
import { FONT_PAIRS, PALETTES, STYLE_PRESETS, applyFontPair, applyPalette, applyStyle, readableOn } from "@/lib/orders/builder/presets";
import { cn } from "@/lib/utils";

const chip = (on: boolean) => cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40");

/** Starting design plus style, colors and fonts in store setup. Same choices as the public preview and the builder. */
const SetupDesigner = ({ design, onChange }: { design: Design; onChange: (d: Design) => void }) => {
  const t = design.theme;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Choose your starting design</p>
        <p className="text-xs text-muted-foreground">Watch the live preview change. You can fine-tune everything later in the website builder.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEMPLATES.map((tpl) => {
          const on = design.template === tpl.key;
          return (
            <button key={tpl.key} type="button" aria-pressed={on} onClick={() => onChange(tpl.build())}
              className={cn("relative overflow-hidden rounded-2xl border text-left transition", on ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40")}>
              <img src={tpl.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <span className="block p-3"><span className="block text-sm font-medium">{tpl.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{tpl.summary}</span></span>
              {on && <span className="absolute right-2 top-2 rounded-full bg-foreground p-1 text-background"><Check size={12} /></span>}
            </button>
          );
        })}
      </div>

      <fieldset className="space-y-2"><legend className="text-sm font-medium">Style</legend>
        <div className="flex flex-wrap gap-2">{STYLE_PRESETS.map((p) => (
          <button key={p.key} type="button" aria-pressed={t.headingFont === p.theme.headingFont && t.background === p.theme.background} className={chip(t.headingFont === p.theme.headingFont && t.background === p.theme.background)} onClick={() => onChange(applyStyle(design, p))}>{p.name}</button>
        ))}</div>
      </fieldset>

      <fieldset className="space-y-2"><legend className="text-sm font-medium">Colors</legend>
        <div className="flex flex-wrap items-center gap-2">
          {PALETTES.map((p) => {
            const on = t.background === p.colors.background && t.accent === p.colors.accent;
            return (
              <button key={p.key} type="button" aria-pressed={on} aria-label={p.name} title={p.name} className={chip(on)} onClick={() => onChange(applyPalette(design, p))}>
                <span className="flex h-5 w-8 overflow-hidden rounded-full border border-border"><span className="flex-1" style={{ background: p.colors.background }} /><span className="flex-1" style={{ background: p.colors.accent }} /></span>
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            );
          })}
          <label className={cn(chip(false), "cursor-pointer")}>
            <input type="color" value={t.accent} aria-label="Your own accent color" className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
              onChange={(e) => onChange({ ...design, theme: { ...t, accent: e.target.value, accentText: readableOn(e.target.value) } })} />
            Your color
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-2"><legend className="text-sm font-medium">Fonts</legend>
        <div className="flex flex-wrap gap-2">{FONT_PAIRS.map((f) => {
          const on = t.headingFont === f.heading && t.bodyFont === f.body;
          return <button key={f.key} type="button" aria-pressed={on} className={chip(on)} style={{ fontFamily: f.heading }} onClick={() => onChange(applyFontPair(design, f))}>{f.name}</button>;
        })}</div>
      </fieldset>
    </div>
  );
};

export default SetupDesigner;
