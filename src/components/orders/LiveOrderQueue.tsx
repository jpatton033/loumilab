import { ArrowRight, MapPin, ShoppingBag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const LiveOrderQueue = ({ orders, storeSlug, onAdvance, pending, className }: Props) => {
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
        return (
          <li key={order.id} className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold">
                  {order.reference ? `Order ${order.reference}` : "Order"}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{placed(order)}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {order.customer_name} · {count} item{count === 1 ? "" : "s"} ·{" "}
                  <span className="inline-flex items-center gap-1">
                    {order.fulfilment === "delivery" ? <Truck size={13} /> : <MapPin size={13} />}
                    {order.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                  </span>
                </p>
              </div>
              <p className="font-display font-semibold">{formatCents(order.total_cents, order.currency)}</p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  TONE[order.status],
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              {next ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 rounded-full"
                  disabled={pending}
                  onClick={() => onAdvance(order, next)}
                >
                  {ORDER_STATUS_LABELS[next]} <ArrowRight size={14} />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" asChild className="h-10 rounded-full">
                  <Link to={`/orders/receipt/${order.public_token}`}>View</Link>
                </Button>
              )}
            </div>

            {(items.length > 0 || order.customer_notes || order.delivery_address) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {items.slice(0, 4).map((item) => (
                  <Badge key={item.id} variant="outline" className="rounded-full font-normal">
                    {item.quantity}× {item.name}
                  </Badge>
                ))}
                {items.length > 4 && <span>+{items.length - 4} more</span>}
                {order.delivery_address && <span>· {order.delivery_address}</span>}
                {order.customer_notes && <span>· “{order.customer_notes}”</span>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default LiveOrderQueue;
