import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { demoShowcaseStores, demoStorefront, type Storefront } from "@/data/orders/storefronts";
import { useCart } from "@/hooks/use-cart";
import StorefrontHeader from "./StorefrontHeader";
import StoreProductCard from "./StoreProductCard";
import CartBar from "./CartBar";
import { cn } from "@/lib/utils";

/** Demo-only: nothing here touches real stores, orders, payments or tracking. */
interface DemoEntry {
  store: Storefront;
  type: string;
  service?: { action: string; checkout: string };
}

const ENTRIES: DemoEntry[] = [
  { store: demoStorefront, type: "Home kitchen" },
  { store: demoShowcaseStores[1], type: "Florist" },
  { store: demoShowcaseStores[0], type: "Bakery" },
  { store: demoShowcaseStores[4], type: "Hair salon", service: { action: "Book", checkout: "Sample booking" } },
  { store: demoShowcaseStores[2], type: "Electrician", service: { action: "Request", checkout: "Sample request" } },
  { store: demoShowcaseStores[3], type: "Handyman", service: { action: "Request", checkout: "Sample request" } },
  { store: demoShowcaseStores[5], type: "Cleaning", service: { action: "Book", checkout: "Sample booking" } },
];

const INTERVAL_MS = 3500;

const LivePreviewPicker = () => {
  const [index, setIndex] = useState(0);
  const cart = useCart();
  const entry = ENTRIES[index];

  const rootRef = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const running = auto && !hovering && visible;

  const go = (next: number) => {
    const i = (next + ENTRIES.length) % ENTRIES.length;
    if (i === index) return;
    cart.clear();
    setIndex(i);
  };
  const pick = (next: number) => { setAuto(false); go(next); };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const advance = () => { cart.clear(); setIndex((i) => (i + 1) % ENTRIES.length); };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); pick(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); pick(index - 1); }
  };

  return (
    <div ref={rootRef} className="mt-12">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => pick(index - 1)} aria-label="Previous example store"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:text-accent sm:flex">
          <ChevronLeft size={18} />
        </button>
        <div role="tablist" aria-label="Example stores" onKeyDown={onKey}
          className="flex flex-1 gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {ENTRIES.map((e, i) => (
            <button key={e.store.id} type="button" role="tab" aria-selected={i === index}
              tabIndex={i === index ? 0 : -1} onClick={() => pick(i)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2.5 text-left transition-colors",
                i === index ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-accent/50"
              )}>
              <span className="block text-sm font-semibold leading-tight">{e.store.name}</span>
              <span className={cn("block text-xs", i === index ? "text-background/70" : "text-muted-foreground")}>{e.type}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAuto((a) => !a)}
          aria-label={auto ? "Pause automatic store tour" : "Play automatic store tour"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:text-accent">
          {auto ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" onClick={() => pick(index + 1)} aria-label="Next example store"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:text-accent sm:flex">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div key={`${index}-${auto}`}
            className={cn("h-full rounded-full bg-accent", auto ? "live-preview-progress" : "w-full opacity-30")}
            onAnimationEnd={advance}
            style={auto ? { animationDuration: `${INTERVAL_MS}ms`, animationPlayState: running ? "running" : "paused" } : undefined} />
        </div>
        {!auto && <span className="shrink-0 text-xs text-muted-foreground">Tour paused — press play to resume</span>}
      </div>

      <div key={entry.store.id} role="tabpanel" aria-label={`${entry.store.name} demo storefront`}
        className="mt-6 motion-safe:animate-fade-in rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:p-10">
        <StorefrontHeader store={entry.store} demo />
        <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
          onFocusCapture={() => setAuto(false)} onPointerDown={() => setAuto(false)}>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {entry.store.products.map((p) => (
            <StoreProductCard key={p.id} product={p}
              quantity={cart.lines.find((l) => l.product.id === p.id)?.quantity ?? 0}
              onAdd={cart.add}
              priceIsStarting={!!entry.service}
              actionLabel={entry.service?.action} />
          ))}
        </div>
        <CartBar variant="inline" className="mt-8" count={cart.count} subtotalCents={cart.subtotalCents}
          ctaLabel={entry.service?.checkout ?? "Sample checkout"} onCheckout={cart.clear} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Demo store — no payment is processed and no order is sent.</p>
          <Link to="/orders/get-started" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
            Build a store like this <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LivePreviewPicker;
