import { STATUS_LABELS, type StorefrontStatus } from "@/lib/orders/setup";
import { cn } from "@/lib/utils";

const TONE: Record<StorefrontStatus, string> = {
  setup: "border-border bg-secondary text-muted-foreground",
  ready: "border-accent/20 bg-accent/10 text-accent",
  published: "border-transparent bg-foreground text-background",
  paused: "border-border bg-secondary text-foreground",
  restricted: "border-destructive/20 bg-destructive/10 text-destructive",
};

/** Single source of truth for how a store's lifecycle stage looks. */
const StoreStatusBadge = ({ status, className }: { status: StorefrontStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      TONE[status],
      className,
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "published" ? "bg-background" : status === "ready" ? "bg-accent" : "bg-current opacity-60",
      )}
    />
    {STATUS_LABELS[status]}
  </span>
);

export default StoreStatusBadge;
