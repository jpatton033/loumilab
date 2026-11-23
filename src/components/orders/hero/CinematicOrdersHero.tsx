import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Check, ShoppingBag, CreditCard, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import baker from "@/assets/orders/cinema/baker.jpg";
import boutique from "@/assets/orders/cinema/boutique.jpg";
import caterer from "@/assets/orders/cinema/caterer.jpg";
import designer from "@/assets/orders/cinema/designer.jpg";
import cake from "@/assets/orders/bake-cake.jpg";
import cupcakes from "@/assets/orders/bake-cupcakes.jpg";
import cookies from "@/assets/orders/bake-cookies.jpg";

/**
 * Orders cinematic hero. Layer A (text + buttons) renders immediately and never moves.
 * Layer B is a 24s, six-scene loop: photos (scenes 1, 2, 6) and coded demo product
 * screens (scenes 3–5). Transform/opacity only; reduced motion shows one still.
 */
const LOOP = 24;
const photos = [
  { src: baker, from: 0, to: 4.6, pos: "70% 40%" },
  { src: boutique, from: 4, to: 5.9, pos: "72% 50%" },
  { src: caterer, from: 5.4, to: 7.2, pos: "60% 40%" },
  { src: designer, from: 6.7, to: 9, pos: "65% 40%" },
  { src: baker, from: 19.6, to: 24.5, pos: "70% 40%", dim: true },
];
// Sample merchant brand themes (demo data shown inside the storefront mock).
const themes = [
  { brand: "hsl(28 60% 42%)", bg: "hsl(36 40% 96%)", font: "font-hero" },
  { brand: "hsl(160 35% 28%)", bg: "hsl(40 30% 94%)", font: "font-display" },
  { brand: "hsl(345 45% 35%)", bg: "hsl(30 25% 95%)", font: "font-hero" },
];

const on = (t: number, a: number, b: number) => t >= a && t < b;

export default function CinematicOrdersHero({ children, controlsLabel = "background film" }: { children: ReactNode; controlsLabel?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [t, setT] = useState(0.4);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (document.hidden) { last = now; return; }
      setT((v) => (v + (now - last) / 1000) % LOOP);
      last = now;
    }, 200);
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  // Scroll recede + pointer depth (CSS vars only).
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = el.offsetHeight || 1;
        el.style.setProperty("--hp", Math.min(1, Math.max(0, window.scrollY / h)).toFixed(3));
      });
    };
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--mx", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
      el.style.setProperty("--my", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine) el.addEventListener("pointermove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); el.removeEventListener("pointermove", onMove); };
  }, [reduced]);

  const time = reduced ? 1 : t;
  const theme = themes[time < 9.6 ? 0 : time < 10.8 ? 1 : time < 12 ? 2 : 0];
  const showStore = on(time, 8.2, 16.4);
  const showOrder = on(time, 12, 20);
  const showConnected = on(time, 16, 20.4);
  const added = on(time, 13, 20);
  const placed = on(time, 14.2, 20);

  return (
    <section
      ref={ref}
      aria-label="Loumilab Orders"
      data-page-hero className="cine-hero relative isolate -mt-16 flex min-h-[86svh] items-end sm:min-h-[100svh] overflow-hidden bg-ink text-inverse lg:-mt-20 lg:items-center"
    >
      {/* Layer B — cinematic environment */}
      <div aria-hidden className="cine-stage absolute inset-0 -z-10">
        <div className="cine-depth absolute inset-[-3%]">
          {photos.map((p, i) => {
            const visible = reduced ? i === 0 : on(time, p.from, p.to);
            return (
              <img
                key={i}
                src={p.src}
                alt=""
                width={1920}
                height={1088}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "auto"}
                style={{ objectPosition: p.pos }}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out",
                  visible ? (p.dim ? "opacity-50" : "opacity-100") : "opacity-0",
                  visible && !reduced && !paused && "cine-drift",
                )}
              />
            );
          })}
        </div>

        {/* Scenes 3–5: demo product screens */}
        <div className="cine-ui pointer-events-none absolute inset-0 hidden items-center justify-end pr-[6vw] md:flex">
          <div className="relative h-[min(560px,70vh)] w-[min(520px,42vw)]">
            {/* Storefront */}
            <div
              className={cn(
                "absolute left-0 top-0 w-[80%] overflow-hidden rounded-3xl border border-inverse/10 shadow-2xl transition-all duration-1000 ease-out",
                showStore ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                showConnected && "scale-[0.92] opacity-80",
              )}
              style={{ background: theme.bg, transformOrigin: "top left" }}
            >
              <div className="flex items-center justify-between px-5 py-3 transition-colors duration-700" style={{ background: theme.brand }}>
                <span className={cn("text-sm font-semibold text-inverse", theme.font)}>Mae's Bakehouse</span>
                <ShoppingBag className="h-4 w-4 text-inverse" />
              </div>
              <div className="relative h-36 overflow-hidden">
                <img src={cake} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <p className={cn("text-lg font-semibold text-ink transition-all duration-700", theme.font)}>Order fresh this week.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[{ i: cake, n: "Celebration cake", p: "$48" }, { i: cupcakes, n: "Cupcakes (12)", p: "$30" }, { i: cookies, n: "Cookie box", p: "$18" }].map((x, k) => (
                    <div key={x.n} className={cn("rounded-xl bg-background p-1.5 transition-shadow duration-500", added && k === 0 && "ring-2")} style={added && k === 0 ? { ["--tw-ring-color" as string]: theme.brand } : undefined}>
                      <img src={x.i} alt="" className="aspect-square w-full rounded-lg object-cover" />
                      <p className="mt-1 truncate text-[10px] font-medium text-foreground">{x.n}</p>
                      <p className="text-[10px] text-muted-foreground">{x.p}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-full py-2 text-center text-xs font-semibold text-inverse transition-colors duration-700" style={{ background: theme.brand }}>
                  {placed ? "Order placed ✓" : added ? "Checkout · $48.00" : "Add to order"}
                </div>
              </div>
            </div>

            {/* Merchant order card */}
            <div className={cn(
              "absolute -bottom-10 -right-4 w-[60%] rounded-3xl border border-inverse/15 bg-ink p-4 shadow-2xl transition-all duration-1000 ease-out",
              showOrder && placed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-inverse/60">Today · Orders</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">#1042 · Celebration cake</p>
                  <p className="text-xs text-inverse/60">Pickup Sat 10:00 AM</p>
                </div>
                <span className="rounded-full bg-inverse/10 px-2 py-1 text-[10px] font-medium">New</span>
              </div>
              <div className={cn("mt-4 grid grid-cols-3 gap-2 transition-opacity duration-1000", showConnected ? "opacity-100" : "opacity-0")}>
                {[{ I: Check, l: "Website" }, { I: CreditCard, l: "Paid" }, { I: Package, l: "Pickup" }].map(({ I, l }) => (
                  <div key={l} className="flex flex-col items-center gap-1 rounded-2xl border border-inverse/10 py-2">
                    <I className="h-3.5 w-3.5 text-inverse/80" />
                    <span className="text-[10px] text-inverse/70">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legibility: left/bottom fade to black */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/70 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* Layer A — functional content (renders immediately) */}
      <div className="section-container relative w-full pb-20 pt-32 lg:py-32">
        <div className="cine-copy max-w-xl">{children}</div>
      </div>

      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? `Play ${controlsLabel}` : `Pause ${controlsLabel}`}
          className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-inverse/25 bg-ink/60 text-inverse transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverse"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
    </section>
  );
}
