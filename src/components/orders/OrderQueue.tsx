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
      <li key={order.id} className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-5">
          <div className="min-w-0">
            <p className="font-display font-semibold break-words">
              Order {order.number}
              <span className="ml-2 whitespace-nowrap text-sm font-normal text-muted-foreground">
                {order.placedAt}
              </span>
            </p>
            <p className="break-words text-sm text-muted-foreground">
              {order.customer} · {order.items} item{order.items > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:justify-end">
            <p className="min-w-[5.5rem] font-display font-semibold tabular-nums md:text-right">
              {formatMoney(order.totalCents)}
            </p>
            <OrderStatusBadge status={order.status} className="shrink-0 whitespace-nowrap" />
            {onAdvance && (
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-full shrink-0 rounded-full md:w-auto"
                disabled={order.status === "Completed"}
                onClick={() => onAdvance(order.id)}
              >
                Advance <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </li>
    ))}
    {orders.length === 0 && (
      <li className="px-6 py-10 text-center text-sm text-muted-foreground">Nothing in this stage right now.</li>
    )}
  </ul>
);

export default OrderQueue;
