import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BEATS = [
  { label: "Name it", note: "Your name and logo appear." },
  { label: "Stock it", note: "Products drop into place." },
  { label: "Shape it", note: "Menu sections and pickup times." },
  { label: "Share it", note: "Your first order arrives." },
];

const PRODUCTS = [
  { name: "Brown butter cookies", price: "$18" },
  { name: "Sunday lasagna tray", price: "$42" },
  { name: "Lemon pound cake", price: "$26" },
];

/** A store outline assembling in four beats as the section scrolls by. */
const StorefrontAssembly = () => {
  const ref = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState(-1);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) { setBeat(3); return; }
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const travel = Math.max(r.height - vh * 0.6, 1);
        const p = Math.min(Math.max((vh * 0.55 - r.top) / travel, 0), 1);
        setBeat(p <= 0 ? -1 : Math.min(3, Math.floor(p * 4.2)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const on = (n: number) => beat >= n;
  const piece = (n: number) =>
    cn("transition-all duration-700 [transition-timing-function:var(--ease-brand)]", on(n) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3");

  return (
    <section ref={ref} aria-labelledby="assembly-heading" className="relative lg:min-h-[220vh]">
      <div className="section-container py-20 lg:sticky lg:top-20 lg:flex lg:min-h-[calc(100vh-5rem)] lg:items-center lg:py-0">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 id="assembly-heading" className="font-hero text-4xl font-semibold leading-[1.02] tracking-[-0.035em] lg:text-6xl">
              From an idea to a storefront.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              No account, no setup call. Just start, and watch it take shape.
            </p>
            <ol className="mt-10 space-y-5">
              {BEATS.map((b, i) => (
                <li key={b.label} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-500", on(i) ? "scale-125 bg-accent" : "bg-border")}
                  />
                  <div>
                    <p className={cn("font-display text-lg font-semibold transition-colors", on(i) ? "text-foreground" : "text-muted-foreground")}>{b.label}</p>
                    <p className="text-sm text-muted-foreground">{b.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div
            role="img"
            aria-label="A sample storefront assembling: store name, products, pickup times, then a new order"
            className={cn("relative mx-auto w-full max-w-md rounded-[2rem] border bg-card p-6 shadow-[var(--shadow-lift)] transition-colors duration-700", on(3) ? "border-accent/40" : "border-dashed border-border")}
          >
            <div className={cn("flex items-center gap-4", piece(0))}>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent font-hero text-xl font-semibold text-accent-foreground">S</span>
              <div>
                <p className="font-display text-xl font-semibold">Sunday Kitchen</p>
                <p className="text-sm text-muted-foreground">Home-cooked · Akron, OH</p>
              </div>
            </div>

            <div className={cn("mt-6 flex gap-2", piece(2))}>
              {["Baked goods", "Trays", "Weekend"].map((t) => (
                <span key={t} className="rounded-full border border-border px-3 py-1 text-xs font-medium">{t}</span>
              ))}
            </div>

            <ul className="mt-5 space-y-3">
              {PRODUCTS.map((p, i) => (
                <li
                  key={p.name}
                  style={{ transitionDelay: on(1) && !reduced ? `${i * 120}ms` : "0ms" }}
                  className={cn("flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3", piece(1))}
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="font-display text-sm font-semibold">{p.price}</span>
                </li>
              ))}
            </ul>

            <p className={cn("mt-5 text-sm text-muted-foreground", piece(2))}>Pickup Fri–Sun · 4–9 PM</p>

            <div
              className={cn(
                "absolute -right-3 -top-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-lift)] sm:-right-8",
                piece(3)
              )}
            >
              <p className="flex items-center gap-2 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" /> New order · $44
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pickup Saturday 5 PM</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorefrontAssembly;
