# Merchant fee controls, delivery surcharges and after-delivery tips

Three additions to Loumilab Orders, all merchant-controlled and all priced on the server so nothing can be tampered with from a customer's browser.

## 1. Delivery surcharges

Merchants keep their flat delivery fee and gain two extra tools in Store set-up → Fulfilment:

- **Service surcharge** — one named flat charge added to delivery orders (label + amount, e.g. "Service fee $2.50").
- **Distance tiers** — an optional list of bands (up to X miles → fee). When tiers exist they replace the flat delivery fee; the surcharge still applies on top.

Distance is taken from the delivery address at checkout. Customers see each charge on its own line in the checkout summary and on the receipt, so there are no surprise totals.

## 2. Who covers the fees

New "Fees" section in Store set-up:

- A slider for the share of fees the customer pays, 0–100%.
- Live preview: "On a $40 order the customer pays $1.86 and you absorb $1.24."
- Covers both the Loumilab platform fee and Stripe's processing estimate (2.9% + 30¢), so the merchant sees the true cost.
- Customer-paid share appears at checkout as a single "Service fee" line, never as hidden markup.

Super Admin gets a per-merchant override (special deals) in the admin merchant view: a fixed customer share and/or a custom platform fee, with a reason recorded in the audit log. The override wins over the merchant's own setting.

Loumilab's own fee stays calculated on the item subtotal only — never on tax, tips, delivery or service fees.

## 3. Tip after the order arrives

- The receipt page stays live after payment. Once the order reaches a completed or delivered state, the buyer sees "Add a tip for your driver" with preset amounts and a custom option, open for 24 hours.
- The tip is charged as a separate payment straight to the merchant's connected account, with **no Loumilab fee on tips** — the merchant keeps 100% minus Stripe's own processing cost.
- The tip screen states plainly that Stripe's processing fee applies to a separate tip charge, so nobody is misled.
- Merchants see tips separately in the dashboard and analytics, so tips never inflate revenue or fee figures.
- One tip per order; repeat attempts are blocked; the receipt shows the tip once paid.

## Technical notes

Schema (migration, with GRANTs and RLS):

- `merchant_storefronts`: `service_fee_cents`, `service_fee_label`, `delivery_tiers jsonb` (`[{max_miles, fee_cents}]`), `customer_fee_share_bps`.
- `merchants`: `fee_share_override_bps` (nullable, admin only), existing `platform_fee_bps` override path reused.
- `orders`: `service_fee_cents`, `customer_fee_cents`, `merchant_fee_cents`, `tip_paid_at`, `tip_stripe_payment_intent_id`; existing `tip_cents` reused for the final tip.
- New `public.get_order_tip_context(_token uuid)` security-definer function so an unauthenticated buyer can see tip eligibility without exposing the order row.

Server:

- New `_shared/pricing.ts` computes delivery fee (tier lookup), surcharge, customer fee share and platform fee from database values only. `_shared/fees.ts` keeps `platformFeeCents` on merchandise; the split logic lives in the new module and is used by `orders-checkout`.
- `orders-checkout` adds surcharge and service-fee line items, records the split fields, and keeps `application_fee_amount` merchandise-only.
- New `orders-tip` function: validates the public token, order state, 24-hour window and single-tip rule, then creates a Checkout session on the connected account with `application_fee_amount: 0`, metadata `{order_id, kind: "order_tip"}`.
- `stripe-connect-webhook` handles the tip session, sets `tip_cents`, `tip_paid_at` and the payment intent id.
- Distance for tiers uses a geocode lookup; if it can't be resolved, the store's flat delivery fee is used and the reason is logged.

Client:

- `StorePanel.tsx`: fulfilment surcharge/tier editor and the new Fees section with live preview.
- `CheckoutSheet.tsx`: itemised delivery, surcharge and service-fee rows from a server-computed quote rather than local arithmetic.
- `Receipt.tsx`: tip panel, status handling, confirmation state.
- Admin merchant view: fee override control writing to `audit_logs`.
- Dashboard analytics separates tips from revenue.
