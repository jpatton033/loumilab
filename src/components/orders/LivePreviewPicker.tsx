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
  const [touched, setTouched] = useState(false);
  const running = auto && !hovering && visible && !touched;

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
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => { cart.clear(); setIndex((i) => (i + 1) % ENTRIES.length); }, INTERVAL_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, index]);

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
              {i === index && auto && (
                <span className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-background/20" aria-hidden="true">
                  <span key={index} className="live-preview-progress block h-full bg-accent"
                    style={{ animationDuration: `${INTERVAL_MS}ms`, animationPlayState: running ? "running" : "paused" }} />
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setAuto((a) => !a); setTouched(false); }}
          aria-label={auto ? "Pause automatic store tour" : "Play automatic store tour"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:text-accent">
          {auto ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" onClick={() => pick(index + 1)} aria-label="Next example store"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:text-accent sm:flex">
          <ChevronRight size={18} />
        </button>
      </div>

      <div key={entry.store.id} role="tabpanel" aria-label={`${entry.store.name} demo storefront`}
        onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
        onFocusCapture={() => setTouched(true)} onPointerDown={() => setTouched(true)}
        className="mt-6 motion-safe:animate-fade-in rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:p-10">
        <StorefrontHeader store={entry.store} demo />
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
