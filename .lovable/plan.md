# Payments & Payouts: real payment status, visible schedule, clear breakdown

## What I checked

- Your live order (£/$1.00 test purchase, 5 Sep) is still recorded as **pending** — it has a live Stripe checkout session ID but no payment record and no paid time.
- Only **one** Stripe notification has ever reached Loumilab (an account-link event from 5 Sep). No `checkout.session.completed` notification has ever arrived, which is why the order never flipped to Paid. Orders are charged on the merchant's own connected account, so Stripe only sends that notification if the webhook is set to include connected accounts — this needs confirming in Stripe, so step 1 is to verify it rather than assume.
- Your payments account is fully verified (payouts enabled), so the payouts area *should* be loading. The schedule line is rendered only as small grey footnote text and falls back to a generic sentence when Stripe returns no schedule value — so even when it loads it doesn't read as "here is my schedule". Whether Stripe returned a schedule for your account is unconfirmed; step 2 checks the live response.

## Plan

### 1. Make payment confirmation reliable (fixes "Awaiting payment")
- Confirm in Stripe whether the webhook includes connected-account events and the checkout event; report back what I find.
- Regardless of that, stop depending on the notification alone: add a **payment reconciliation** step that asks Stripe directly about the checkout session of any order still awaiting payment (on dashboard load/refresh, and on the receipt page). If Stripe says it was paid, the order is finalised through the same existing logic — totals, fee, receipt emails — and it can never double-apply.
- Reconcile the existing stuck order so it correctly shows Paid.

### 2. Show the payout schedule properly
- Check the live payouts response for your account.
- Give the schedule its own labelled block alongside Available / In transit: "Payout schedule", in plain words (e.g. "Every business day, 2 days after the sale"), with the next expected payout date when Stripe gives one.
- If Stripe returns no schedule object, derive it from the connected account settings instead of falling back to vague wording; only if genuinely unavailable show "Set in Stripe" with the View in Stripe button.

### 3. Clear payment breakdown for merchants
- Recent sales gets a per-order breakdown a merchant can open: items subtotal, delivery fee, tip, tax, **customer total**, Loumilab fee, Stripe processing fee, and **net to you**.
- Summary row above it for the period: gross, Loumilab fees, Stripe fees, net.
- Each order shows its payment status in plain words (Paid, Awaiting payment, Failed, Refunded) with the paid date.

## Technical notes

- New shared finaliser reused by `stripe-connect-webhook/handlers.ts` and a new reconcile action (`orders-checkout` or a small `orders-order-sync` function) that retrieves the session with `{ stripeAccount }` and applies the same idempotent update keyed on `stripe_payment_intent_id`.
- `supabase/functions/orders-payouts/index.ts`: return the raw `interval`/`delay_days`/anchor alongside the sentence, plus Stripe balance-transaction fee totals for the fee breakdown.
- `src/components/orders/PaymentsPanel.tsx`: schedule block, summary row, expandable per-order breakdown; net = total − platform fee − Stripe fee.
- No schema change needed unless the Stripe fee is stored per order; if we want it persisted I'll add one nullable column via migration.

## Verification

Confirm the stuck order reads Paid with a full breakdown, the schedule block shows real wording, and a fresh test order settles to Paid without manual action.
