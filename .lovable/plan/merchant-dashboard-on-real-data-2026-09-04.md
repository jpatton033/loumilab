# Merchant dashboard on real data

The merchant dashboard already exists at `/orders/dashboard` with the right shape: setup checklist, payouts, catalog, estimates, payments. Two of its three headline promises are still sample data — the order list and the metric cards show a fixed demo restaurant, and Analytics is a placeholder card. Real storefront orders are already being recorded (paid checkouts write to the orders table, and merchants are already allowed to read and update their own). Payouts became real in the last change.

This plan wires orders and analytics to that live data, keeps the demo experience for visitors who aren't signed in, and rounds out the dashboard so a merchant can run their day from it.

## 1. Live orders

- New shared data layer for merchant orders: fetch a signed-in merchant's orders with their line items, newest first.
- Replace the sample queue with the real one when a merchant is signed in: reference, customer, items, total, how it was paid, when it came in, current stage.
- Stage buttons write back to the database (paid → preparing → ready → out for delivery → completed), so a status change persists and the customer's receipt page reflects it.
- Filters count real orders. Failed, cancelled and refunded orders are visible but not advanceable.
- Live updates so a new paid order appears without a refresh, alongside the existing notification component.
- Empty state that explains what will appear here and links to the storefront.

## 2. Real headline metrics

Replace the three fixed cards with figures calculated from paid orders:

- Today's revenue, with the change against the same day last week.
- Orders today, with how many are still awaiting action.
- Average order value, with the change against last week.

## 3. Store analytics

Build out the Analytics tab (still gated to the plans that include it):

- Revenue trend for the last 30 days, plus a 7-day and 30-day total.
- Orders volume and average order value over the same window.
- Best sellers: top catalog items by revenue and by quantity.
- Where orders come from: pickup vs delivery split, and tips collected.
- Repeat customers: share of orders from returning customers, and top customers by spend.
- Everything reads from existing paid orders — no tracking scripts, no new data collection.

## 4. Consistency pass

- The metric cards, orders tab and analytics all use one currency formatter and one date window so numbers agree.
- Visitors without a merchant account keep the current sample dashboard, clearly labelled as a preview.
- Copy stays plain: no payment-processor jargon in front of merchants.

## Technical notes

- New `src/lib/orders/orders.ts`: `useMerchantOrders(merchantId)` selecting from `orders` with a nested `order_items` join; `useAdvanceOrder` mutation updating `status`; `useMerchantAnalytics(merchantId)` deriving windows client-side from the same fetched rows (single query, memoised) so there is no extra round trip.
- Reuse the `order_status` enum ordering for the queue (`pending, paid, failed, cancelled, preparing, ready, out_for_delivery, completed, refunded`); advanceable path is `paid → preparing → ready → out_for_delivery → completed`, with delivery skipped for pickup orders.
- Existing RLS already covers this: "Merchants view their orders", "Merchants update their orders", "Order items follow order visibility". No migration, no new tables, no new secrets.
- Realtime subscription on `orders` filtered by `merchant_id`, invalidating the orders query key.
- New `src/components/orders/AnalyticsPanel.tsx` and a small chart built with the project's existing chart primitives; `MetricCard` reused for the headline row.
- `src/data/orders/dashboard.ts` demo data stays, used only when there is no merchant record.
