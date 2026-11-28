import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import cake from "@/assets/orders/bake-cake.jpg";
import cupcakes from "@/assets/orders/bake-cupcakes.jpg";
import cookies from "@/assets/orders/bake-cookies.jpg";
import { ORDERS_HERO_SCENES as SCENES, ORDERS_SCENE_SECONDS as SEC, DEMO_ORDER as O } from "@/data/ordersHero";

/**
 * Orders hero "The Business Behind the Business". Text (children) renders immediately and never moves.
 * Six ~5s scenes from src/data/ordersHero.ts: footage scenes plus two coded demo screens (sample data only).
 * Opacity/translate only; reduced motion shows one still; pauses off-screen and when the tab is hidden.
 */
export default function CinematicOrdersHero({ children, controlsLabel = "background film" }: { children: ReactNode; controlsLabel?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0); // sub-step inside the storefront scene
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [tall] = useState(() => window.matchMedia("(max-aspect-ratio: 4/5)").matches);
  const seen = useRef(new Set<number>([0, 1]));

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const running = !reduced && !paused && visible;
  useEffect(() => {
    if (!running) return;
    let ms = 0;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      ms += 250;
      setStep(Math.floor(ms / 1100));
      if (ms >= SEC * 1000) { ms = 0; setStep(0); setI((v) => { const n = (v + 1) % SCENES.length; seen.current.add((n + 1) % SCENES.length); return n; }); }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, i]);

  const scene = SCENES[i];
  const st = (s: (typeof SCENES)[number]) => (tall ? s.stillTall : s.still);

  return (
    <section ref={ref} aria-label="Loumilab Orders" data-page-hero
      className="relative isolate -mt-16 flex min-h-[88svh] items-end overflow-hidden bg-ink text-inverse sm:min-h-[100svh] lg:-mt-20 lg:items-center">
      <div aria-hidden className="absolute inset-0 -z-10">
        {SCENES.map((s, k) => {
          const on = reduced ? k === 0 : k === i;
          if (!seen.current.has(k) && !on) return null;
          const dim = s.kind !== "film";
          const cls = cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out", on ? (dim ? "opacity-40" : "opacity-100") : "opacity-0");
          const clip = tall ? s.clipTall ?? s.clip : s.clip;
          return clip && !reduced
            ? <video key={s.id} src={on || seen.current.has(k) ? clip : undefined} poster={st(s)} muted playsInline loop preload={on ? "auto" : "metadata"} autoPlay={on} className={cls} ref={(v) => { if (v) { if (on && running) v.play().catch(() => {}); else v.pause(); } }} />
            : <img key={s.id} src={st(s)} alt="" decoding="async" fetchPriority={k === 0 ? "high" : "auto"} className={cls} />;
        })}

        {/* Scenes 4–5: demo screens (desktop/tablet). Sample data only — no orders, payments or emails are created. */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-end pr-[6vw] md:flex">
          <div className="relative w-[min(420px,38vw)]">
            <div className={cn("overflow-hidden rounded-3xl border border-inverse/10 bg-atmo-ivory text-atmo-obsidian shadow-2xl transition-all duration-1000 ease-out",
              scene.kind === "storefront" ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
              <div className="flex items-center justify-between bg-atmo-obsidian px-5 py-3 text-atmo-ivory">
                <span className="font-hero text-sm font-semibold">Mae's Bakehouse</span><ShoppingBag className="h-4 w-4" />
              </div>
              <img src={cake} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <p className="font-hero text-lg font-semibold">Order fresh this week.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[{ s: cake, n: "Celebration Cake", p: "$48" }, { s: cupcakes, n: "Cupcakes (12)", p: "$30" }, { s: cookies, n: "Cookie box", p: "$18" }].map((x, k) => (
                    <div key={x.n} className={cn("rounded-xl p-1.5 transition-colors duration-500", k === 0 && step >= 1 ? "bg-atmo-obsidian/10" : "bg-atmo-obsidian/[0.03]")}>
                      <img src={x.s} alt="" className="aspect-square w-full rounded-lg object-cover" />
                      <p className="mt-1 truncate text-[10px] font-medium">{x.n}</p><p className="text-[10px] opacity-60">{x.p}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-full bg-atmo-obsidian py-2 text-center text-xs font-semibold text-atmo-ivory">
                  {step >= 3 ? "Order placed · Paid" : step >= 2 ? "Checkout · $48.00" : step >= 1 ? "Added to order · 1 item" : "Add to order"}
                </div>
              </div>
            </div>
            <div className={cn("absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-3xl border border-inverse/15 bg-ink/90 p-6 shadow-2xl transition-all duration-1000 ease-out",
              scene.kind === "order" ? "opacity-100" : "pointer-events-none opacity-0")}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-inverse/60">Orders · Today</p>
              <p className="mt-3 font-hero text-xl font-semibold">New Order #{O.number}</p>
              <dl className="mt-4 space-y-2 text-sm">
                {[["Item", O.item], ["Total", `${O.total} — ${O.payment}`], ["Pickup", O.pickup], ["Status", O.status]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-t border-inverse/10 pt-2"><dt className="text-inverse/60">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10 lg:bg-gradient-to-r lg:from-ink/90 lg:via-ink/45 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="section-container relative w-full pb-20 pt-32 lg:py-32">
        <div className="max-w-xl">{children}</div>
      </div>

      {!reduced && (
        <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}
          aria-label={paused ? `Play ${controlsLabel}` : `Pause ${controlsLabel}`}
          className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-inverse/25 bg-ink/60 text-inverse transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverse">
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
    </section>
  );
}
