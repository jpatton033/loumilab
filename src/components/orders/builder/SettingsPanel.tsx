import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadMerchantImage } from "@/lib/orders/media";
import { FONTS, SECTION_LABELS, type Design, type Section, type Theme } from "@/lib/orders/builder/schema";
import { TEMPLATES } from "@/lib/orders/builder/templates";
import type { BuilderCaps } from "@/lib/orders/builder/gating";

const Seg = <T extends string>({ value, options, onChange, disabled }: { value: T; options: [T, string][]; onChange: (v: T) => void; disabled?: boolean }) => (
  <div className="flex rounded-full border border-border p-1">
    {options.map(([v, l]) => (
      <button key={v} type="button" disabled={disabled} onClick={() => onChange(v)}
        className={`min-h-9 flex-1 rounded-full px-2 text-xs font-medium transition disabled:opacity-40 ${value === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
    ))}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2" role="group" aria-label={label}><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>
);

const ImagePick = ({ merchantId, value, onChange }: { merchantId: string; value?: string; onChange: (url: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {value ? <img src={value} alt="" className="h-14 w-20 rounded-lg object-cover" /> : <div className="h-14 w-20 rounded-lg bg-secondary" />}
      <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => ref.current?.click()}>
        <ImagePlus size={14} /> {busy ? "Uploading…" : value ? "Replace" : "Upload"}
      </Button>
      {value && <Button type="button" size="sm" variant="ghost" aria-label="Remove image" onClick={() => onChange("")}><X size={14} /></Button>}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        setBusy(true);
        try { onChange((await uploadMerchantImage(merchantId, "hero", f)).url); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
        finally { setBusy(false); }
      }} />
    </div>
  );
};

const HAS: Record<string, (keyof Section["props"])[]> = {
  hero: ["heading", "body", "cta", "image"], about: ["heading", "body", "image"], products: ["heading"],
  featured: ["heading", "count"], services: ["heading", "items"], gallery: ["heading", "images"], promo: ["body"],
  testimonials: ["heading", "items"], faq: ["heading", "items"], contact: ["heading", "body", "email", "phone"],
  hours: ["heading", "body"], footer: ["body"], header: [],
};

export const SectionSettings = ({ section, merchantId, caps, onChange }: { section: Section; merchantId: string; caps: BuilderCaps; onChange: (s: Section) => void }) => {
  const p = section.props;
  const set = (patch: Partial<Section["props"]>) => onChange({ ...section, props: { ...p, ...patch } });
  const style = (patch: Partial<Section["style"]>) => onChange({ ...section, style: { ...section.style, ...patch } });
  const fields = HAS[section.type];
  const itemLabel = section.type === "testimonials" ? ["Name", "Quote"] : section.type === "faq" ? ["Question", "Answer"] : ["Title", "Description"];

  return (
    <div className="space-y-5">
      <p className="font-hero text-lg font-semibold">{SECTION_LABELS[section.type]}.</p>
      {fields.includes("heading") && <Field label="Heading"><Input aria-label="Heading" value={p.heading ?? ""} maxLength={140} onChange={(e) => set({ heading: e.target.value })} /></Field>}
      {fields.includes("body") && <Field label={section.type === "hours" ? "Hours" : section.type === "promo" ? "Message" : "Text"}><Textarea aria-label="Text" rows={4} value={p.body ?? ""} maxLength={2000} onChange={(e) => set({ body: e.target.value })} /></Field>}
      {fields.includes("cta") && <Field label="Button text"><Input aria-label="Button text" value={p.cta ?? ""} maxLength={40} onChange={(e) => set({ cta: e.target.value })} /></Field>}
      {fields.includes("email") && <Field label="Email"><Input aria-label="Email" type="email" value={p.email ?? ""} maxLength={120} onChange={(e) => set({ email: e.target.value })} /></Field>}
      {fields.includes("phone") && <Field label="Phone"><Input aria-label="Phone" value={p.phone ?? ""} maxLength={40} onChange={(e) => set({ phone: e.target.value })} /></Field>}
      {fields.includes("count") && <Field label="How many to show"><Seg value={String(p.count ?? 3) as "3"} options={[["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"]] as ["3", string][]} onChange={(v) => set({ count: Number(v) })} /></Field>}
      {fields.includes("image") && <Field label="Image"><ImagePick merchantId={merchantId} value={p.image} onChange={(url) => set({ image: url })} /></Field>}
      {fields.includes("images") && (
        <Field label="Photos">
          <div className="grid grid-cols-3 gap-2">
            {(p.images ?? []).map((src, i) => (
              <div key={i} className="relative"><img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button type="button" aria-label="Remove photo" className="absolute right-1 top-1 rounded-full bg-background p-1" onClick={() => set({ images: (p.images ?? []).filter((_, j) => j !== i) })}><X size={12} /></button></div>
            ))}
          </div>
          {(p.images?.length ?? 0) < 12 && <ImagePick merchantId={merchantId} onChange={(url) => url && set({ images: [...(p.images ?? []), url] })} />}
        </Field>
      )}
      {fields.includes("items") && (
        <Field label="Items">
          <div className="space-y-3">
            {(p.items ?? []).map((it, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
                <div className="flex gap-2">
                  <Input aria-label={itemLabel[0]} placeholder={itemLabel[0]} value={it.title} maxLength={120} onChange={(e) => set({ items: (p.items ?? []).map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
                  <Button type="button" size="icon" variant="ghost" aria-label="Remove item" onClick={() => set({ items: (p.items ?? []).filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
                </div>
                <Textarea aria-label={itemLabel[1]} placeholder={itemLabel[1]} rows={2} value={it.text} maxLength={600} onChange={(e) => set({ items: (p.items ?? []).map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
              </div>
            ))}
            {(p.items?.length ?? 0) < 24 && <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => set({ items: [...(p.items ?? []), { title: "", text: "" }] })}><Plus size={14} /> Add item</Button>}
          </div>
        </Field>
      )}
      <div className="space-y-4 border-t border-border pt-5">
        <Field label="Background"><Seg value={section.style.background} onChange={(v) => style({ background: v })} options={[["base", "Page"], ["surface", "Soft"], ["accent", "Accent"], ["inverse", "Dark"]]} /></Field>
        <Field label="Alignment"><Seg value={section.style.align} onChange={(v) => style({ align: v })} options={[["left", "Left"], ["center", "Center"]]} /></Field>
        <Field label={caps.advancedStyle ? "Spacing" : "Spacing · Business plan"}><Seg disabled={!caps.advancedStyle} value={section.style.spacing} onChange={(v) => style({ spacing: v })} options={[["compact", "Compact"], ["normal", "Normal"], ["airy", "Airy"]]} /></Field>
      </div>
    </div>
  );
};

const Color = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="flex items-center justify-between gap-3 text-sm">
    <span>{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground">{value}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent" aria-label={label} />
    </span>
  </label>
);

export const ThemeSettings = ({ design, caps, onTheme, onTemplate }: { design: Design; caps: BuilderCaps; onTheme: (t: Theme) => void; onTemplate: (key: string) => void }) => {
  const t = design.theme;
  const set = (patch: Partial<Theme>) => onTheme({ ...t, ...patch });
  return (
    <div className="space-y-6">
      <p className="font-hero text-lg font-semibold">Site style.</p>
      <Field label="Starting design">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tp) => (
            <button key={tp.key} type="button" onClick={() => onTemplate(tp.key)}
              className={`overflow-hidden rounded-2xl border text-left text-xs transition ${design.template === tp.key ? "border-foreground" : "border-border hover:border-foreground/40"}`}>
              <img src={tp.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <span className="block p-2 font-medium">{tp.name}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Colors">
        <div className="space-y-2">
          <Color label="Background" value={t.background} onChange={(v) => set({ background: v })} />
          <Color label="Soft background" value={t.surface} onChange={(v) => set({ surface: v })} />
          <Color label="Text" value={t.text} onChange={(v) => set({ text: v })} />
          <Color label="Accent" value={t.accent} onChange={(v) => set({ accent: v })} />
          <Color label="Text on accent" value={t.accentText} onChange={(v) => set({ accentText: v })} />
        </div>
      </Field>
      {(["headingFont", "bodyFont"] as const).map((k) => (
        <Field key={k} label={k === "headingFont" ? "Heading font" : "Body font"}>
          <select aria-label={k === "headingFont" ? "Heading font" : "Body font"} value={t[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<Theme>)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      ))}
      <Field label={caps.advancedStyle ? "Corners" : "Corners · Business plan"}><Seg disabled={!caps.advancedStyle} value={t.radius} onChange={(v) => set({ radius: v })} options={[["none", "Square"], ["soft", "Soft"], ["round", "Round"]]} /></Field>
      <Field label={caps.advancedStyle ? "Heading size" : "Heading size · Business plan"}><Seg disabled={!caps.advancedStyle} value={t.headingScale} onChange={(v) => set({ headingScale: v })} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} /></Field>
    </div>
  );
};
