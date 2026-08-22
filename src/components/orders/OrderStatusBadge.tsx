import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/data/orders/dashboard";

const styles: Record<OrderStatus, string> = {
  New: "bg-accent/10 text-accent border-accent/20",
  Confirmed: "bg-secondary text-foreground border-border",
  Preparing: "bg-muted text-foreground border-border",
  Ready: "bg-foreground text-background border-foreground",
  Completed: "bg-secondary text-muted-foreground border-border",
};

const OrderStatusBadge = ({ status, className }: { status: OrderStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
      styles[status],
      className
    )}
  >
    {status}
  </span>
);

export default OrderStatusBadge;
