export const ORDER_STATUSES = ["New", "Confirmed", "Preparing", "Ready", "Completed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface MerchantOrder {
  id: string;
  /** Human-facing order number */
  number: string;
  customer: string;
  totalCents: number;
  status: OrderStatus;
  placedAt: string;
  items: number;
}

export const dashboardMetrics = [
  { id: "revenue", label: "Today's Revenue", value: "$486.50", delta: "+12% vs last Friday" },
  { id: "orders", label: "Orders", value: "27", delta: "6 awaiting confirmation" },
  { id: "average", label: "Average Order", value: "$18.02", delta: "+$1.40 this week" },
];

export const demoOrders: MerchantOrder[] = [
  { id: "o_1048", number: "#1048", customer: "Jordan M.", totalCents: 2800, status: "Preparing", placedAt: "6:12 PM", items: 2 },
  { id: "o_1049", number: "#1049", customer: "Ashley T.", totalCents: 1600, status: "New", placedAt: "6:18 PM", items: 1 },
  { id: "o_1050", number: "#1050", customer: "Marcus B.", totalCents: 4200, status: "Ready", placedAt: "6:24 PM", items: 3 },
  { id: "o_1051", number: "#1051", customer: "Tasha R.", totalCents: 1800, status: "Confirmed", placedAt: "6:31 PM", items: 1 },
  { id: "o_1052", number: "#1052", customer: "Devon K.", totalCents: 3300, status: "Completed", placedAt: "5:47 PM", items: 2 },
];

export const nextStatus = (status: OrderStatus): OrderStatus => {
  const i = ORDER_STATUSES.indexOf(status);
  return ORDER_STATUSES[Math.min(i + 1, ORDER_STATUSES.length - 1)];
};
