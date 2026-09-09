# Orders queue: cleaner rows + a Summary view

Two changes to the merchant dashboard order list: fix the crowded rows so nothing overlaps on any screen size, and add a Summary view that tells a busy merchant exactly what to prepare right now.

## 1. Fix the crowded order rows

Today each order is one long horizontal row: name, time, items, total, status chip and the action button all sit on a single line and squeeze into each other when text is long or the screen is narrow.

New row structure:

- Mobile: order number and time on the first line, customer and pickup/delivery underneath, then total and status side by side, then a full-width action button.
- Tablet and up: a fixed grid — order details take the flexible space, total and status get their own columns of reserved width, the action button sits at the end and never shrinks.
- Total stays in the heavier display type; status stays a pill. Long names, addresses and notes wrap instead of pushing anything sideways.
- Item chips and notes stay on their own line below, wrapping freely.

```text
mobile                          tablet / desktop
Order #1049  6:18 PM            Order #1049 6:18 PM      $42.00  [Ready]  [Out for delivery >]
Jordan M. · 2 items · Pickup    Jordan M. · 2 items · Pickup
$42.00            [Ready]       2x Wings  1x Mac  "no onions"
[ Preparing            > ]
```

Checked with every status: Awaiting payment, New, Preparing, Ready, Out for delivery, Completed, Cancelled, Refunded, Payment failed — at phone, tablet and desktop widths. The same treatment is applied to the sample/demo queue so both look identical.

## 2. New Summary view

A toggle above the queue: **Orders** | **Summary**. Orders is the existing list, unchanged in behaviour.

Summary shows, for the orders currently in view:

- Orders in the queue, and a count for each status
- Pickup vs delivery split
- Orders needing attention (new and preparing)
- Total items to prepare
- Consolidated item list — "8 Burgers, 5 Fries, 3 Lemonades" — largest first
- Estimated sales total for the selection
- Oldest order still waiting, with how long it has been waiting
- Every customer note and special instruction gathered in one flagged list

Merchant actions:

- Filter by status and by pickup/delivery, plus a date range (today / last 7 days / last 30 days)
- Tick individual orders in the Orders list to build a consolidated prep summary for just those
- Tap an item to expand it and see which orders and customers it belongs to
- Print / save the prep summary as a clean sheet (print stylesheet, no navigation or buttons)
- Updates itself as orders arrive or change status, same as the queue does now

Optimised for phone and tablet: single-column stacked cards, large tap targets, sticky view toggle.

## Notes on data

Orders don't currently record a promised pickup or delivery time, so "earliest promised time" is shown as the oldest order still waiting (based on when it was paid) and how long it has been open. If you want customers to choose a time at checkout, that's a separate change to the storefront and the order record — say the word and I'll plan it.

## Technical detail

- `src/components/orders/LiveOrderQueue.tsx` — responsive grid row, `min-w-0`/wrapping, reserved columns for total and status, optional selection checkbox.
- `src/components/orders/OrderQueue.tsx` — same row treatment for the demo data path.
- New `src/components/orders/OrderSummaryPanel.tsx` — summary cards, consolidated items with expandable order/customer breakdown, notes list, print button.
- New pure helper `buildQueueSummary(orders)` in `src/lib/orders/orders.ts` (unit-testable, no new queries) deriving counts, fulfilment split, item aggregation, sales total and oldest-waiting order.
- `src/pages/orders/Dashboard.tsx` — view toggle, fulfilment + date-range filter state alongside the existing status chips, selection state passed to both views.
- Print styles scoped via a `print:` utility block; no new dependency.
- No database, edge function, RLS or query changes; `useMerchantOrders` realtime subscription already keeps both views current.
