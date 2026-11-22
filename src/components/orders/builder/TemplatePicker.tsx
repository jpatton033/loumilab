import { useState } from "react";
import { Check } from "lucide-react";
import { TEMPLATES, templateForIndustry } from "@/lib/orders/builder/templates";
import { getPendingTemplate, setPendingTemplate } from "@/lib/orders/builder/queries";

/** "Choose your starting design" in store setup. The choice is kept on this device and applied when the builder first opens. */
const TemplatePicker = ({ industrySlug }: { industrySlug?: string }) => {
  const [key, setKey] = useState(() => getPendingTemplate() ?? templateForIndustry(industrySlug).key);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Choose your starting design</p>
        <p className="text-xs text-muted-foreground">You can change colors, fonts and sections anytime in the website builder.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const on = key === t.key;
          return (
            <button key={t.key} type="button" aria-pressed={on} onClick={() => { setKey(t.key); setPendingTemplate(t.key); }}
              className={`relative overflow-hidden rounded-2xl border text-left transition ${on ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40"}`}>
              <img src={t.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <span className="block p-3"><span className="block text-sm font-medium">{t.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{t.summary}</span></span>
              {on && <span className="absolute right-2 top-2 rounded-full bg-foreground p-1 text-background"><Check size={12} /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatePicker;
