# Stripe Go-Live Readiness for Loumilab Orders

Goal: move the merchant payments setup from test mode to live, and make the app safe and clear when it runs against a live Stripe account.

## Current state (verified)

- Connect onboarding, status sync, Express dashboard links, and a signature-verified webhook are all implemented and deployed.
- The stored `STRIPE_SECRET_KEY` is the test key you saved; `STRIPE_WEBHOOK_SECRET` is set to your test-mode Connect endpoint secret.
- No merchants, no connected accounts, and zero webhook events recorded yet — nothing live has flowed through.
- Plans in the database already carry `platform_fee_bps`, and the Connect account creation requests `card_payments` and `transfers` capabilities. Customer checkout itself is not built yet, so no fee is charged anywhere today.

## What this plan does

### 1. Swap to live credentials (you + me)
- You create a live secret key in Stripe and a **live Connect webhook endpoint** pointing at the deployed webhook URL, subscribed to `account.updated` and `capability.updated`.
- I open the secure secret form so you paste the live secret key and the live webhook signing secret directly into the encrypted store (never in chat or code).
- The test key you pasted in chat earlier still needs to be rolled in Stripe.

### 2. Guard against mode mismatch
- Add a startup check in the shared Stripe helper that records whether the active key is live or test, and surface it in the connect response.
- Stop a live-mode webhook from being applied to a test-mode account record (and vice versa) by matching `livemode` before updating a merchant's account row.
- Log and store a clear error on the webhook event row when a signature or mode check fails, so the admin audit view shows it.

### 3. Harden the onboarding flow for real users
- Validate `returnUrl` against the published origin rather than only the request `origin` header, so returning from Stripe works on loumilab.com as well as the preview.
- Handle Stripe API failures in the dashboard card with a retryable message instead of a raw error string.
- Gate `accepting_orders` on `payout_status = 'payout_enabled'` so a merchant cannot flip orders on before payouts work.

### 4. Admin visibility before launch
- Add a small "Payments" status strip to the admin workspace showing live/test mode, connected-account count by payout status, and the last webhook event received. This is how you confirm the live wiring works without a Stripe dashboard round trip.

### 5. Verification
- Re-run the connect status call end-to-end with a live account after your key swap, confirm a real `account.updated` event lands in the webhook events table with `livemode = true`, and confirm the payout status advances.

## Not in this plan

Customer checkout (charging buyers) and merchant plan subscriptions are still not built — the storefront cart currently clears without charging. Your platform fee will be applied at that point via a destination charge application fee driven by each plan's `platform_fee_bps`. Say the word and I'll plan that as the next phase, including the exact fee percentage you want.

## Technical notes

- Files touched: `supabase/functions/_shared/stripe.ts`, `supabase/functions/stripe-connect/index.ts`, `supabase/functions/stripe-connect-webhook/index.ts`, `src/lib/orders/connect.ts`, `src/components/orders/PayoutSetupCard.tsx`, `src/pages/orders/Dashboard.tsx`, and a new admin payments status panel.
- One migration: a check/trigger enforcing that `merchants.accepting_orders` can only be true when the linked account is payout-enabled.
- No changes to `supabase/config.toml` project settings; the webhook already runs with `verify_jwt = false`.
