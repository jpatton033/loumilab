import { formatMoney, type Storefront } from "@/data/orders/storefronts";
import StorefrontHeader from "./StorefrontHeader";

interface Props {
  store: Storefront;
  /** Optional cart summary rendered at the bottom of the screen. */
  cart?: { count: number; subtotalCents: number };
  /** Index of the item highlighted as "just added". */
  highlightIndex?: number;
}

/** The storefront as customers see it on a phone — reused inside PhoneFrame mockups. */
const StorefrontScreen = ({ store, cart, highlightIndex }: Props) => (
  <div className="flex h-full flex-col bg-background">
    <div className="px-5 pb-4 pt-3">
      <StorefrontHeader store={store} compact />
    </div>

    <div className="space-y-3 px-5">
      {store.products.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-colors duration-500 ${
            highlightIndex === i ? "border-accent/40 bg-accent/5" : "border-border bg-card"
          }`}
        >
          {p.image && (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              width={1024}
              height={768}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">{formatMoney(p.priceCents)}</p>
          </div>
          <span className="rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background">
            Add
          </span>
        </div>
      ))}
    </div>

    <div className="mt-4 px-5 pb-5">
      <div className="flex items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-background">
        <span className="text-xs font-medium">
          {cart && cart.count > 0 ? `${cart.count} item${cart.count > 1 ? "s" : ""} in cart` : "Pickup order"}
        </span>
        <span className="font-display text-sm font-semibold">
          {cart && cart.count > 0 ? formatMoney(cart.subtotalCents) : "Checkout"}
        </span>
      </div>
    </div>
  </div>
);

export default StorefrontScreen;
