import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/data/orders/storefronts";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  subtotalCents: number;
  ctaLabel?: string;
  onCheckout?: () => void;
  /** Sticky bottom bar (storefront) vs inline card (marketing demo). */
  variant?: "fixed" | "inline";
  className?: string;
}

const CartBar = ({ count, subtotalCents, ctaLabel = "Review order", onCheckout, variant = "fixed", className }: Props) => {
  const content = (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3 pl-5 shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex">
          <ShoppingBag size={20} className="text-foreground" />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {count}
            </span>
          )}
        </span>
        <span className="text-sm text-muted-foreground">
          {count === 0 ? "Your cart is empty" : `${count} item${count > 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display font-semibold">{formatMoney(subtotalCents)}</span>
        <Button size="sm" disabled={count === 0} onClick={onCheckout} className="h-11 rounded-full px-5">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );

  if (variant === "inline") return <div className={className}>{content}</div>;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-all duration-300",
        count === 0 ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">{content}</div>
    </div>
  );
};

export default CartBar;
