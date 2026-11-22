import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import cake from "@/assets/orders/bake-cake.jpg";
import cupcakes from "@/assets/orders/bake-cupcakes.jpg";
import cookies from "@/assets/orders/bake-cookies.jpg";
import boutique from "@/assets/orders/cinema/boutique.jpg";
import designer from "@/assets/orders/cinema/designer.jpg";
import braids from "@/assets/orders/svc-salon-braids.jpg";
import silk from "@/assets/orders/svc-salon-silk.jpg";
import cut from "@/assets/orders/svc-salon-cut.jpg";

/** Looping demo of one site being customized into three distinct business identities. Sample data only. */
type Section = "hero" | "items" | "about";
const designs = [
  { name: "Mae's Bakehouse", template: "Bakery", hero: cake, tagline: "Order fresh this week.", brand: "hsl(28 60% 42%)", bg: "hsl(36 40% 96%)", ink: "hsl(24 30% 14%)", font: "font-hero", radius: "rounded-2xl", order: ["hero", "items", "about"] as Section[],
    items: [[cake, "Celebration cake", "$48"], [cupcakes, "Cupcakes (12)", "$30"], [cookies, "Cookie box", "$18"]], about: "Small-batch cakes baked to order in Akron." },
  { name: "Rahman Tailors", template: "Boutique", hero: boutique, tagline: "Handmade, fitted to you.", brand: "hsl(40 30% 82%)", bg: "hsl(30 10% 10%)", ink: "hsl(40 30% 92%)", font: "font-display", radius: "rounded-none", order: ["about", "hero", "items"] as Section[],
    items: [[boutique, "Kurta, linen", "$120"], [designer, "Ceramic bowl", "$42"], [boutique, "Alterations", "from $25"]], about: "Three generations of tailoring on Main Street." },
  { name: "Crown Studio", template: "Salon", hero: braids, tagline: "Book your next look.", brand: "hsl(345 45% 38%)", bg: "hsl(330 30% 97%)", ink: "hsl(340 30% 16%)", font: "font-hero", radius: "rounded-full", order: ["hero", "about", "items"] as Section[],
    items: [[braids, "Knotless braids", "$180"], [silk, "Silk press", "$85"], [cut, "Cut & style", "$55"]], about: "Appointments Tuesday to Saturday." },
];
const steps = ["Pick a template", "Change colors & fonts", "Rearrange sections", "Add photos & products", "Take orders"];

export default function CustomizeDemo() {
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (paused || reduced || !inView) return;
    const id = window.setInterval(() => setStep((s) => { if (s === steps.length - 1) { setI((v) => (v + 1) % designs.length); return 0; } return s + 1; }), 1600);
    return () => window.clearInterval(id);
  }, [paused, reduced, inView]);

  const d = designs[i];
  const s = reduced ? steps.length - 1 : step;
  const styled = s >= 1, ordered = s >= 2, filled = s >= 3, taking = s >= 4;
  const order = ordered ? d.order : (["hero", "items", "about"] as Section[]);

  const blocks: Record<Section, JSX.Element> = {
    hero: (
      <div key="hero" className="relative h-28 overflow-hidden">
        {filled ? <img src={d.hero} alt="" loading="lazy" className="h-full w-full object-cover transition-opacity duration-700" /> : <div className="h-full w-full bg-muted" />}
        <p className={cn("absolute bottom-2 left-3 text-base font-semibold text-inverse drop-shadow", styled && d.font)}>{d.tagline}</p>
      </div>
    ),
    items: (
      <div key="items" className="grid grid-cols-3 gap-2 p-3">
        {d.items.map(([src, n, p], k) => (
          <div key={k} className={cn("overflow-hidden bg-background/90 p-1.5 transition-all duration-500", styled ? (d.radius === "rounded-full" ? "rounded-2xl" : d.radius) : "rounded-lg", taking && k === 0 && "ring-2")} style={taking && k === 0 ? { ["--tw-ring-color" as string]: d.brand } : undefined}>
            {filled ? <img src={src} alt="" loading="lazy" className="aspect-square w-full rounded-md object-cover" /> : <div className="aspect-square w-full rounded-md bg-muted" />}
            <p className="mt-1 truncate text-[10px] font-medium text-foreground">{filled ? n : "Product"}</p>
            <p className="text-[10px] text-muted-foreground">{filled ? p : "$—"}</p>
          </div>
        ))}
      </div>
    ),
    about: <p key="about" className="px-3 py-2 text-[11px] leading-relaxed" style={{ color: styled ? d.ink : undefined }}>{filled ? d.about : "About your business…"}</p>,
  };

  return (
    <div ref={ref} className="relative" aria-label="Example: one Loumilab Orders website customized for three different businesses (sample data)">
      <div className="overflow-hidden rounded-3xl border border-atmo-ivory/12 shadow-2xl transition-colors duration-700" style={{ background: styled ? d.bg : "hsl(0 0% 96%)" }}>
        <div className="flex items-center justify-between px-4 py-2.5 transition-colors duration-700" style={{ background: styled ? d.brand : "hsl(0 0% 85%)" }}>
          <span className={cn("text-sm font-semibold transition-all", styled ? d.font : "font-sans")} style={{ color: styled ? d.bg : "hsl(0 0% 20%)" }}>{d.name}</span>
          <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: styled ? d.bg : "hsl(0 0% 30%)" }}>{d.template} template</span>
        </div>
        <div className="flex flex-col">{order.map((k) => blocks[k])}</div>
        <div className="p-3 pt-0">
          <div className={cn("py-2 text-center text-xs font-semibold transition-colors duration-500", styled ? (d.radius === "rounded-none" ? "rounded-none" : "rounded-full") : "rounded-md")} style={{ background: styled ? d.brand : "hsl(0 0% 80%)", color: styled ? d.bg : "hsl(0 0% 20%)" }}>
            {taking ? "New order received ✓" : "Order now"}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <ol className="flex flex-wrap gap-1.5" aria-label="Customization steps">
          {steps.map((t, k) => (
            <li key={t} className={cn("rounded-full border px-2.5 py-1 text-[11px] transition-colors", k === s ? "border-atmo-ivory/60 text-atmo-ivory" : "border-atmo-ivory/12 text-atmo-ivory/50")}>{t}</li>
          ))}
        </ol>
        {!reduced && (
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play website demo" : "Pause website demo"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-atmo-ivory/25 text-atmo-ivory hover:bg-atmo-ivory/10">
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-atmo-ivory/45">Sample businesses for illustration.</p>
    </div>
  );
}
