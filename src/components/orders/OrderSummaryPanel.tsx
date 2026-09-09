import { useState } from "react";
import { ChevronDown, ClipboardList, Clock, MapPin, Printer, StickyNote, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/orders/storefront";
import {
  ORDER_STATUS_LABELS,
  buildQueueSummary,
  describeWaiting,
  type LiveOrder,
} from "@/lib/orders/orders";
import { cn } from "@/lib/utils";

interface Props {
  /** The orders currently in view, or just the ticked ones. */
  orders: LiveOrder[];
  businessName?: string;
  /** True when the merchant has ticked a subset of orders. */
  isSelection?: boolean;
  onClearSelection?: () => void;
  className?: string;
}

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-hero text-2xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const OrderSummaryPanel = ({ orders, businessName, isSelection, onClearSelection, className }: Props) => {
  const summary = buildQueueSummary(orders);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const printedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (!summary.total) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border bg-card px-5 py-12 text-center shadow-[var(--shadow-soft)] sm:px-6",
          className,
        )}
      >
        <ClipboardList size={20} className="mx-auto text-muted-foreground" />
        <p className="mt-3 font-display font-semibold">Nothing to prepare right now</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Choose a different filter, or come back when the next order lands.
        </p>
      </div>
    );
  }

  return (
    <div
      id="prep-summary"
      className={cn(
        "space-y-5 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display font-semibold">Preparation summary</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {businessName ? `${businessName} · ` : ""}
            {isSelection ? `${summary.total} selected` : `${summary.total} in view`} · {printedAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {isSelection && onClearSelection && (
            <Button variant="ghost" size="sm" className="rounded-full" onClick={onClearSelection}>
              Clear selection
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
            <Printer size={14} /> Print or save
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Orders"
          value={String(summary.total)}
          hint={`${summary.needsAttention} need attention`}
        />
        <Stat label="Items to prepare" value={String(summary.totalItems)} />
        <Stat
          label="Pickup / delivery"
          value={`${summary.pickup} / ${summary.delivery}`}
          hint="Pickup first, then delivery"
        />
        <Stat
          label="Estimated sales"
          value={formatCents(summary.salesCents, summary.currency)}
          hint="Excludes cancelled and refunded"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.byStatus.map(({ status, count }) => (
          <span
            key={status}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            {ORDER_STATUS_LABELS[status]}
            <span className="text-foreground">{count}</span>
          </span>
        ))}
      </div>

      {summary.oldestWaiting && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm">
          <Clock size={15} className="shrink-0 text-muted-foreground" />
          <span className="font-medium">
            Longest wait:{" "}
            {summary.oldestWaiting.reference
              ? `Order ${summary.oldestWaiting.reference}`
              : summary.oldestWaiting.customer_name}
          </span>
          <span className="text-muted-foreground">
            waiting {describeWaiting(summary.oldestWaiting.paid_at ?? summary.oldestWaiting.created_at)} ·{" "}
            {summary.oldestWaiting.fulfilment === "delivery" ? "Delivery" : "Pickup"}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border bg-secondary/50 px-4 py-3">
          <p className="font-display text-sm font-semibold">What to make</p>
        </div>
        <ul className="divide-y divide-border">
          {summary.items.map((item) => {
            const open = openItem === item.name;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => setOpenItem(open ? null : item.name)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40"
                >
                  <span className="min-w-[2.5rem] font-hero text-xl font-semibold tabular-nums">
                    {item.quantity}×
                  </span>
                  <span className="min-w-0 flex-1 break-words text-sm font-medium">{item.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {formatCents(item.revenueCents, summary.currency)}
                  </span>
                  <ChevronDown
                    size={15}
                    className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && (
                  <ul className="space-y-1 border-t border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                    {item.orders.map((o) => (
                      <li key={`${item.name}-${o.id}`} className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{o.quantity}×</span>
                        <span className="break-words">{o.customer_name}</span>
                        {o.reference && <span>· {o.reference}</span>}
                        <span className="inline-flex items-center gap-1">
                          ·{" "}
                          {o.fulfilment === "delivery" ? <Truck size={11} /> : <MapPin size={11} />}
                          {o.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          {!summary.items.length && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              These orders have no itemised lines.
            </li>
          )}
        </ul>
      </div>

      {summary.notes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-accent/30">
          <div className="flex items-center gap-2 border-b border-accent/20 bg-accent/10 px-4 py-3 text-accent">
            <StickyNote size={15} className="shrink-0" />
            <p className="font-display text-sm font-semibold">
              Notes and special instructions ({summary.notes.length})
            </p>
          </div>
          <ul className="divide-y divide-border">
            {summary.notes.map((n) => (
              <li key={n.id} className="px-4 py-3 text-sm">
                <p className="font-medium break-words">
                  {n.customer_name}
                  {n.reference && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{n.reference}</span>
                  )}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {n.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                  </span>
                </p>
                <p className="mt-1 break-words text-muted-foreground">{n.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrderSummaryPanel;
