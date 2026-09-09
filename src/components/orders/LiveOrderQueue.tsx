import { ArrowRight, MapPin, ShoppingBag, StickyNote, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCents } from "@/lib/orders/storefront";
import {
  ORDER_STATUS_LABELS,
  nextOrderStatus,
  type LiveOrder,
  type LiveOrderStatus,
} from "@/lib/orders/orders";
import { cn } from "@/lib/utils";

const TONE: Partial<Record<LiveOrderStatus, string>> = {
  paid: "bg-accent/10 text-accent border-accent/20",
  preparing: "bg-muted text-foreground border-border",
  ready: "bg-foreground text-background border-foreground",
  out_for_delivery: "bg-muted text-foreground border-border",
  completed: "bg-secondary text-muted-foreground border-border",
  cancelled: "bg-secondary text-muted-foreground border-border",
  refunded: "bg-secondary text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-secondary text-muted-foreground border-border",
};

const placed = (order: LiveOrder) =>
  new Date(order.paid_at ?? order.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface Props {
  orders: LiveOrder[];
  storeSlug?: string;
  onAdvance: (order: LiveOrder, status: LiveOrderStatus) => void;
  pending?: boolean;
  className?: string;
  /** When set, each row shows a tick box for building a prep summary. */
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

const LiveOrderQueue = ({
  orders,
  storeSlug,
  onAdvance,
  pending,
  className,
  selectedIds,
  onToggleSelect,
}: Props) => {
  const selectable = Boolean(selectedIds && onToggleSelect);

  if (!orders.length) {
    return (
      <div className={cn("px-5 py-12 text-center sm:px-6", className)}>
        <ShoppingBag size={20} className="mx-auto text-muted-foreground" />
        <p className="mt-3 font-display font-semibold">No orders here yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Every order placed on your storefront lands here the moment it is paid, with the customer's
          details and what they asked for.
        </p>
        {storeSlug && (
          <Button variant="outline" asChild className="mt-5 rounded-full">
            <Link to={`/orders/store/${storeSlug}`}>Open your storefront</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {orders.map((order) => {
        const next = nextOrderStatus(order);
        const items = order.order_items ?? [];
        const count = items.reduce((s, i) => s + i.quantity, 0);
        const checked = selectedIds?.includes(order.id) ?? false;
        return (
          <li key={order.id} className={cn("px-5 py-4 sm:px-6", checked && "bg-secondary/50")}>
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-5">
              <div className="flex min-w-0 items-start gap-3">
                {selectable && (
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleSelect?.(order.id)}
                    aria-label={`Select order ${order.reference ?? ""}`}
                    className="mt-1 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-display font-semibold break-words">
                    {order.reference ? `Order ${order.reference}` : "Order"}
                    <span className="ml-2 whitespace-nowrap text-sm font-normal text-muted-foreground">
                      {placed(order)}
                    </span>
                  </p>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">
                    <span className="break-words">{order.customer_name}</span> · {count} item
                    {count === 1 ? "" : "s"} ·{" "}
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      {order.fulfilment === "delivery" ? <Truck size={13} /> : <MapPin size={13} />}
                      {order.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:justify-end">
                <p className="min-w-[5.5rem] font-display font-semibold tabular-nums md:text-right">
                  {formatCents(order.total_cents, order.currency)}
                </p>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
                    TONE[order.status],
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                {next ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10 w-full shrink-0 rounded-full md:w-auto"
                    disabled={pending}
                    onClick={() => onAdvance(order, next)}
                  >
                    <span className="truncate">{ORDER_STATUS_LABELS[next]}</span>
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="h-10 w-full shrink-0 rounded-full md:w-auto"
                  >
                    <Link to={`/orders/receipt/${order.public_token}`}>View</Link>
                  </Button>
                )}
              </div>
            </div>

            {(items.length > 0 || order.customer_notes || order.delivery_address) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {items.slice(0, 4).map((item) => (
                  <Badge key={item.id} variant="outline" className="max-w-full rounded-full font-normal">
                    <span className="truncate">
                      {item.quantity}× {item.name}
                    </span>
                  </Badge>
                ))}
                {items.length > 4 && <span>+{items.length - 4} more</span>}
                {order.delivery_address && <span className="break-words">{order.delivery_address}</span>}
                {order.customer_notes && (
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 font-medium text-accent">
                    <StickyNote size={12} className="shrink-0" />
                    <span className="break-words">{order.customer_notes}</span>
                  </span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default LiveOrderQueue;
