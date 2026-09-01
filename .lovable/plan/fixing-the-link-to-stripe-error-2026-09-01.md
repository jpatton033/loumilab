# Fixing the "Link to Stripe" error

## What actually happened

The button works; Stripe rejected the call. The function log for `orders-plans-stripe` shows a 401 from Stripe:

```text
StripeAuthenticationError: Invalid API Key provided: mk_1TuvE***************HWZ8
```

The stored payment secret starts with `mk_`. Stripe secret keys start with `sk_test_` / `sk_live_` (or `rk_` for restricted keys). `mk_` is a Stripe **meter/other** identifier, not an API secret — so every server-side Stripe call in the project (plan linking, merchant checkout, invoices, payouts, Connect onboarding) is currently failing authentication the same way.

Two secondary problems make this worse than it needs to be:

1. **The app believes Stripe is configured.** The check is only "is the key non-empty", so an obviously-malformed key passes and the failure surfaces as a raw Stripe error.
2. **Live/Test badge is wrong.** Mode is derived from the key containing `_live_`, so this bad key reports "Test mode" — misleading in the admin UI.

## The fix

1. **Replace the payment secret** with a real Stripe secret key. This is the actual unblock — I'll request the new value securely and store it, then re-run the link action to confirm.
2. **Validate the key shape at startup**: treat a key that isn't `sk_`/`rk_` prefixed as not configured, so the admin UI says "Payments aren't configured yet — the Stripe secret key looks invalid" instead of leaking a Stripe auth dump.
3. **Report mode from the key prefix** (`sk_live_`/`rk_live_` → Live, otherwise Test) and show "Unknown" when the key is invalid, so the Plans & Fees badge can't claim an environment it can't reach.
4. **Friendlier admin error**: map Stripe `StripeAuthenticationError` in `orders-plans-stripe` to a plain-English message pointing at the payment key, rather than a 500 with the raw exception.
5. **Verify end to end** by calling the status action and then linking Business and Premium, confirming the column flips to "Linked (monthly)" or "Linked (monthly + annual)".

## Technical notes

- `supabase/functions/_shared/stripe.ts`: tighten `stripeConfigured`, derive `stripeMode` from the key prefix, export an `unknown` mode case for the invalid state.
- `supabase/functions/orders-plans-stripe/index.ts`: catch Stripe auth errors and return a 503 with an actionable message; keep other errors as-is.
- `src/lib/orders/planStripe.ts` / `src/pages/admin/Plans.tsx`: widen the mode type to include the unconfigured case and render the friendlier message.
- No database or schema changes.

## Starter and Custom tiers stay unlinked

These tiers do not need a Stripe product/price link.

- **Starter** has no recurring subscription charge, so there is no subscription to bill.
- **Custom** is negotiated directly, so it also has no self-serve recurring price.
- The **platform fee percentage** is still collected on every customer order transaction via Stripe Connect's `application_fee_amount` at checkout. That is independent of subscription billing and does not require a plan price link.
- The Plans & Fees table will continue showing "—" for Starter and Custom link status, and only Business and Premium should be linked.

## What I need from you

A valid Stripe secret key for the environment you want to launch in (live if you're going live, test if you're still rehearsing). I'll ask for it through the secure secret prompt — don't paste it into chat.