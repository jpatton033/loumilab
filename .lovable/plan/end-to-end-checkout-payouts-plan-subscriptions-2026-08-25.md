# End-to-End Checkout, Payouts & Plan Subscriptions

Goal: a customer can buy from a real merchant storefront, the money lands in the merchant's bank account minus the Loumilab fee, and merchants can subscribe to Business or Premium.

Decisions locked: merchant absorbs the platform fee, Stripe Tax calculates and collects tax automatically, guest checkout with optional sign-in, subscriptions included.

## Current state (verified)

- Stripe Connect onboarding works: Express accounts are created, `payout_status` is synced from Stripe by the `stripe-connect` function and the webhook, and a database trigger blocks `accepting_orders` unless payouts are enabled.
- The service side of commerce exists: `merchant_jobs`, `merchant_quotes`, `merchant_invoices` with public tokens — but nothing charges a card. Invoices have `stripe_checkout_session_id` and `stripe_payment_intent_id` columns that are never written.
- Storefronts at `/orders/store/:slug` render from local mock data (`src/data/orders/storefronts.ts`). No products, carts, or orders exist in the database.
- `orders_plans` has `stripe_product_id` / `stripe_price_*` columns, all empty. No subscription state is stored anywhere.

So: payouts are wired, payments are not.

## Phase A — Real storefronts and orders

New tables (all with grants, row-level security, merchant-scoped policies):

- `merchant_storefronts` — slug, name, location, description, logo, hours, pickup/delivery settings, published flag. Public read only when published and the owning merchant is accepting orders.
- `merchant_products` — name, description, price, image, availability, category, display order (reuses `merchant_services` where a merchant is service-led).
- `orders` — merchant, storefront, guest contact details, optional `customer_user_id`, fulfilment type (pickup/delivery), status, money breakdown, Stripe references, public token.
- `order_items` — snapshot of name, unit price and quantity at purchase time so later price edits never rewrite history.

Storefront and dashboard switch from mock data to these tables. A "Store" module in the merchant dashboard manages storefront details and the product list. Existing mock storefronts are seeded as demo data so `/orders/store/sunday-kitchen` keeps working.

## Phase B — Customer checkout

New edge function `orders-checkout`:

1. Receives storefront slug plus cart line item IDs and quantities — never client prices.
2. Re-reads every product server-side, rejects unavailable items, and recomputes the subtotal.
3. Reads the merchant's plan to get the platform fee rate and computes the fee on the discounted merchandise subtotal only (never on tax or tips).
4. Creates a `pending` order row plus items, then a Stripe Checkout Session on the merchant's connected account (direct charge) with `automatic_tax` enabled and `application_fee_amount` set to the Loumilab fee.
5. Refuses to run unless the merchant's payout status is `payout_enabled` and the storefront is published.

Frontend: cart bar opens a checkout sheet collecting name, email, phone and pickup/delivery choice, then redirects to Stripe. A signed-in customer gets those fields prefilled and the order linked to their account. Return lands on `/orders/receipt/:token` showing the confirmed order, and a cancel return restores the cart.

Webhook additions in `stripe-connect-webhook`: on `checkout.session.completed` mark the order `paid`, persist the payment intent, amounts, tax and fee, and email the merchant plus the customer. `payment_intent.payment_failed` marks it failed. All keyed to the existing idempotent event table.

## Phase C — Quotes and invoices actually collect money

The service flow already produces quotes and invoices with public tokens; they get real payment:

- Public pages `/orders/quote/:token` (approve or decline) and `/orders/invoice/:token` (pay).
- Approving a quote creates the deposit invoice automatically.
- New edge function `orders-invoice-checkout` builds a Checkout Session for an invoice by public token, with the same server-side fee math and Stripe Tax.
- Webhook marks the invoice `paid`, records `paid_at`, and advances the linked job (deposit paid → scheduled, balance paid → completed).

## Phase D — Merchant plan subscriptions

- New table `merchant_subscriptions` — plan slug, Stripe customer and subscription IDs, status, interval, current period end, cancel-at-period-end, and the fee rate in force.
- New edge function `orders-billing` with actions: create a subscription Checkout Session for a plan (monthly or annual), open the Stripe billing portal, and report current status.
- Plan Stripe products and prices are provisioned on demand from `orders_plans` and the IDs written back, so admins can still edit pricing in `/admin/plans`.
- Subscription webhook events (`customer.subscription.*`, `invoice.payment_failed`) update the merchant's plan; a cancellation or failed payment drops the merchant to Starter without deleting data.
- The platform fee used at checkout is always read from the merchant's active plan, so upgrading immediately lowers their fee.
- Dashboard gains a Billing section: current plan, fee rate, upgrade or downgrade, manage payment method.

## Phase E — Payouts, admin visibility, launch checks

- Payouts remain automatic through Stripe Express. The dashboard adds a Payouts panel reading balance and payout history from the connected account via a new `orders-payouts` function, plus a link to the Express dashboard.
- Admin gets Orders, Payments and Subscriptions views: order and invoice volume, fees earned, subscription status per merchant, and failed webhook events.
- The Daily Operations Brief picks up new signals: paid order count, gross volume, fees earned, failed payments, subscriptions at risk.
- Launch checklist in admin: live keys present, webhook endpoint receiving events, at least one merchant payout-enabled, Stripe Tax active, test order completed end to end.

## Technical notes

- Direct charges on the connected account with `application_fee_amount`. Stripe collects processing fees from the merchant, Loumilab takes its application fee, and Stripe pays the merchant out automatically.
- All money math and fee rates resolve server-side. Client-supplied prices, quantities beyond bounds, fees and plan values are never trusted.
- Every money-moving state change happens in the signature-verified webhook, deduped on Stripe event ID, never in the browser redirect.
- Stripe Tax requires each product to carry a tax code; a sensible default per industry is set with a merchant-editable override.
- Stripe mode (live/test) is already derived from the secret key and cross-mode records are rejected — checkout and subscriptions honour the same guard.
- Guest orders are readable only by public token; customer accounts see their own order history through a policy on `customer_user_id`.

## Suggested order of work

Phase A, then B (this is the point where money first moves), then C, then D, then E. Each phase is shippable on its own.
