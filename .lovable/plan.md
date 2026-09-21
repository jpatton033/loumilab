# Accurate Super Admin numbers, live Orders data, and merchant counts

Three things are out of sync today, all confirmed by reading the code and the live data:

- The Super Admin Orders section reads demo/mock data instead of your real merchants, stores and orders.
- The Overview page shows Orders as "Preview — mock data" and has no merchant numbers at all.
- The Daily Brief still states that customer checkout and plan subscriptions "are not live yet", and reports orders, revenue, payouts, refunds, disputes and subscriptions as unavailable — even though there is a real paid order, a connected payout account and processed Stripe events.

## What changes

### 1. Merchant counts on the Overview
Add two new cards at the top of the Super Admin Overview:

- **Live merchants** — merchants whose store is published and accepting orders, with a hint showing total signed up.
- **New merchants (30 days)** — merchants who signed up in the last 30 days, with the change against the previous 30 days.

Both read live data. A small supporting line shows how many are still finishing setup (not yet published or payments not verified), so the difference between signed up and live is obvious.

### 2. Orders section becomes live
Replace the demo panels in the Orders admin section with real data: merchant roster with plan and payout state, published stores, recent real orders with status and totals, and fee/revenue totals calculated from actual paid orders. The "Preview" tag is removed from the sidebar and the mock-data notice disappears. Where there is genuinely nothing yet (for example no subscriptions billing), the panel says so plainly rather than showing a zero that looks like a failure.

### 3. Daily Brief reports reality
- Orders, Revenue, Payouts, Refunds and Disputes stop being "unavailable" placeholders and are generated from real order and Stripe data for the reporting window: order count, sales, average order, tips, taxes, delivery vs pickup mix, platform fee revenue, payouts, refunds and disputes.
- Subscriptions stays honest: it reports real subscription rows and, while none exist, says no plans are billing yet instead of claiming the capability is missing.
- The executive summary drops the hardcoded "checkout and subscriptions are not live" sentence and instead summarises the actual window.
- The Merchants section gains the same live/new merchant framing used on the Overview, so the dashboard and the brief agree on every number.

### 4. Consistency check
Verify the same definition is used everywhere (Overview cards, Orders section, Daily Brief) so a number never differs between two screens, and confirm test-mode Stripe records are labelled as such rather than counted as live revenue.

## Technical notes

- New shared count helpers in `src/lib/admin/queries.ts`: live merchants (`merchant_storefronts.is_published` joined to `merchants.accepting_orders`), total merchants, 30-day and prior-30-day signups; extend `AdminCounts` and the metrics in `src/pages/admin/Overview.tsx`.
- `src/pages/admin/Orders.tsx`: drop `dashboardMetrics` / `demoOrders` from `src/data/orders/dashboard`, query `merchants`, `merchant_storefronts`, `orders`, `order_items`, `merchant_stripe_accounts`, `merchant_subscriptions` instead; remove the `tag: "Preview"` entry in `src/components/admin/adminNav.ts`.
- Daily Brief: convert `ordersCollector`, `revenueCollector`, `payoutsCollector`, `refundsCollector`, `disputesCollector` and `subscriptionsCollector` in `supabase/functions/_shared/ops-brief/collectors/pending.ts` into real collectors (new files under `collectors/`), aggregating `orders` (paid_at within the window, `livemode`), `platform_fee_cents`, `tip_cents`, `tax_cents`, `delivery_fee_cents`, plus Stripe webhook events for refunds/disputes. Website traffic and SEO stay marked unavailable — no analytics source is connected.
- `supabase/functions/_shared/ops-brief/build.ts`: remove the hardcoded "not live yet" sentence from `buildExecutive` and derive the summary from the collected sections; add "Live merchants" to the executive metrics.
- Redeploy `ops-brief-run`, then generate a preview brief and read the output to confirm the figures match direct database queries.
