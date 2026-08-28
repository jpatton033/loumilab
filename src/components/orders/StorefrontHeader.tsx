import { Clock, MapPin, ShoppingBag } from "lucide-react";
import type { Storefront } from "@/data/orders/storefronts";
import { cn } from "@/lib/utils";

interface Props {
  store: Pick<Storefront, "name" | "location" | "description" | "monogram" | "acceptingOrders" | "hours" | "pickupInfo"> & {
    /** Merchant-uploaded logo; falls back to the monogram tile. */
    logoUrl?: string | null;
  };
  compact?: boolean;
  className?: string;
}

/** Shared storefront header — used by the live template, the demo, and onboarding preview. */
const StorefrontHeader = ({ store, compact = false, className }: Props) => (
  <div className={cn("flex flex-col gap-4", className)}>
    <div className="flex items-center gap-4">
      {store.logoUrl ? (
        <img
          src={store.logoUrl}
          alt={`${store.name} logo`}
          className={cn(
            "shrink-0 rounded-2xl border border-border object-cover",
            compact ? "h-11 w-11" : "h-14 w-14",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-foreground font-display font-semibold text-background",
            compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-base"
          )}
          aria-hidden="true"
        >
          {store.monogram}
        </div>
      )}
      <div className="min-w-0">
        <h1 className={cn("truncate font-display font-semibold", compact ? "text-base" : "text-2xl")}>
          {store.name}
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin size={13} /> {store.location}
        </p>
      </div>
    </div>


    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
          store.acceptingOrders
            ? "border-accent/20 bg-accent/10 text-accent"
            : "border-border bg-secondary text-muted-foreground"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", store.acceptingOrders ? "bg-accent" : "bg-muted-foreground")} />
        {store.acceptingOrders ? "Accepting Orders" : "Not Accepting Orders"}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        <Clock size={12} /> {store.hours}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        <ShoppingBag size={12} /> {store.pickupInfo}
      </span>
    </div>

    {!compact && <p className="max-w-xl text-muted-foreground">{store.description}</p>}
  </div>
);

export default StorefrontHeader;
