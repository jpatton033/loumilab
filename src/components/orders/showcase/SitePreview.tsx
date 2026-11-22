import { useEffect, useRef, useState, type ReactNode } from "react";
import SiteRenderer, { siteCardStyle } from "@/components/orders/builder/SiteRenderer";
import type { Design } from "@/lib/orders/builder/schema";
import type { SampleProduct } from "@/lib/orders/builder/presets";
import { cn } from "@/lib/utils";

/** A sample website drawn by the same renderer live stores use. Sample products, no cart. */
export const SitePreview = ({ design, storeName, products, viewport, className }: {
  design: Design; storeName: string; products: SampleProduct[]; viewport: "desktop" | "mobile"; className?: string;
}) => (
  <div className={cn("mx-auto overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-[max-width] duration-500", viewport === "mobile" ? "max-w-[390px]" : "max-w-full", className)}>
    <div className="flex items-center gap-1.5 border-b border-border bg-secondary px-4 py-2.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
      <span className="ml-3 truncate text-xs text-muted-foreground">{storeName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.loumilab.com</span>
    </div>
    <div className="pointer-events-none select-none" aria-hidden>
      <SiteRenderer design={design} store={{ name: storeName }} viewport={viewport}
        renderProducts={({ featured }) => {
          const list = featured ? products.slice(0, featured) : products;
          return (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {list.map((p) => (
                <div key={p.id} className="overflow-hidden" style={siteCardStyle}>
                  {p.image && <img src={p.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                  <div className="p-4"><p className="font-semibold">{p.name}</p><p className="mt-1 text-sm opacity-70">{p.price}</p></div>
                </div>
              ))}
            </div>
          );
        }} />
    </div>
  </div>
);

/** Mounts children only once scrolled near, so the homepage stays light. */
export const MountWhenNear = ({ children, minHeight = 600 }: { children: ReactNode; minHeight?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || on) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el); return () => io.disconnect();
  }, [on]);
  return <div ref={ref} style={on ? undefined : { minHeight }}>{on ? children : null}</div>;
};
