import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, type StoreProduct } from "@/data/orders/storefronts";
import { cn } from "@/lib/utils";

interface Props {
  product: StoreProduct;
  quantity?: number;
  onAdd: (product: StoreProduct) => void;
  className?: string;
  /** Service catalogs quote per job — show the price as a starting point. */
  priceIsStarting?: boolean;
  /** Overrides the default "Add" action label. */
  actionLabel?: string;
}

const StoreProductCard = ({
  product,
  quantity = 0,
  onAdd,
  className,
  priceIsStarting = false,
  actionLabel,
}: Props) => {
  const unavailable = product.availability !== "available";


  return (
    <article
      className={cn(
        "group overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-500",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={768}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-[var(--gradient-surface)]" aria-hidden="true" />
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
            {product.availability === "sold_out" ? "Sold out" : "Unavailable"}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h3 className="font-display font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          <p className="mt-3 font-display font-semibold">
            {priceIsStarting && <span className="text-sm font-normal text-muted-foreground">From </span>}
            {formatMoney(product.priceCents)}
          </p>
        </div>
        <Button
          size="sm"
          variant={quantity > 0 ? "secondary" : "default"}
          disabled={unavailable}
          onClick={() => onAdd(product)}
          aria-label={`${actionLabel ?? "Add"} ${product.name}`}
          className="mt-0.5 h-11 min-w-[76px] shrink-0 rounded-full px-4"
        >
          {quantity > 0 && !actionLabel ? (
            `${quantity} added`
          ) : actionLabel ? (
            actionLabel
          ) : (
            <>
              <Plus size={15} /> Add
            </>
          )}
        </Button>

      </div>
    </article>
  );
};

export default StoreProductCard;
