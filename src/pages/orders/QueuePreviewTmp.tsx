import { useState } from "react";
import LiveOrderQueue from "@/components/orders/LiveOrderQueue";
import OrderSummaryPanel from "@/components/orders/OrderSummaryPanel";
import type { LiveOrder, LiveOrderStatus } from "@/lib/orders/orders";

const statuses: LiveOrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
  "failed",
];

const orders: LiveOrder[] = statuses.map((status, i) => ({
  id: `o${i}`,
  reference: `#10${40 + i}`,
  public_token: `t${i}`,
  customer_name: i % 3 === 0 ? "Maximiliana Featherstonehaugh-Wellington" : "Jordan M.",
  customer_email: "a@b.com",
  customer_phone: null,
  fulfilment: i % 2 ? "delivery" : "pickup",
  delivery_address: i % 2 ? "1487 Northwest Kensington Boulevard, Apartment 12B, Charlotte NC" : null,
  customer_notes: i % 3 === 0 ? "Severe peanut allergy — please keep separate from all nut products" : null,
  status,
  currency: "USD",
  subtotal_cents: 24000 + i * 1000,
  delivery_fee_cents: 0,
  tip_cents: 300,
  tax_cents: 0,
  total_cents: 124000 + i * 1000,
  paid_at: new Date(Date.now() - i * 3600000).toISOString(),
  failure_reason: null,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  order_items: [
    { id: `i${i}a`, name: "Buttermilk Fried Chicken Sandwich", quantity: 2 + i, unit_price_cents: 1200, line_total_cents: 2400, product_id: null },
    { id: `i${i}b`, name: "Fries", quantity: 1, unit_price_cents: 400, line_total_cents: 400, product_id: null },
    { id: `i${i}c`, name: "Lemonade", quantity: 3, unit_price_cents: 300, line_total_cents: 900, product_id: null },
    { id: `i${i}d`, name: "Mac", quantity: 1, unit_price_cents: 600, line_total_cents: 600, product_id: null },
    { id: `i${i}e`, name: "Wings", quantity: 6, unit_price_cents: 900, line_total_cents: 5400, product_id: null },
  ],
}));

const QueuePreviewTmp = () => {
  const [sel, setSel] = useState<string[]>([]);
  return (
    <div className="space-y-6 p-4">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <LiveOrderQueue
          orders={orders}
          onAdvance={() => undefined}
          selectedIds={sel}
          onToggleSelect={(id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
      </div>
      <OrderSummaryPanel orders={orders} businessName="Jay's Kitchen" />
    </div>
  );
};

export default QueuePreviewTmp;
