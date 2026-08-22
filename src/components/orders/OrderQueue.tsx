import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatMoney } from "@/data/orders/storefronts";
import type { MerchantOrder } from "@/data/orders/dashboard";
import { cn } from "@/lib/utils";

interface Props {
  orders: MerchantOrder[];
  /** When provided, each row exposes an advance-status control. */
  onAdvance?: (orderId: string) => void;
  className?: string;
}

const OrderQueue = ({ orders, onAdvance, className }: Props) => (
  <ul className={cn("divide-y divide-border", className)}>
    {orders.map((order) => (
      <li key={order.id} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">
            Order {order.number}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{order.placedAt}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {order.customer} · {order.items} item{order.items > 1 ? "s" : ""}
          </p>
        </div>
        <p className="font-display font-semibold">{formatMoney(order.totalCents)}</p>
        <OrderStatusBadge status={order.status} />
        {onAdvance && (
          <Button
            size="sm"
            variant="secondary"
            className="h-10 rounded-full"
            disabled={order.status === "Completed"}
            onClick={() => onAdvance(order.id)}
          >
            Advance <ArrowRight size={14} />
          </Button>
        )}
      </li>
    ))}
    {orders.length === 0 && (
      <li className="px-6 py-10 text-center text-sm text-muted-foreground">Nothing in this stage right now.</li>
    )}
  </ul>
);

export default OrderQueue;
