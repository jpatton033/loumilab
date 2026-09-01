# Fix: "Edge Function returned a non-2xx status code" on Link to Stripe

## What is actually happening

Calling the plan-linking function returns **503** with:

> The saved Stripe secret key is not valid (it must start with `sk_` or `rk_`).

The value saved as the project's Stripe key is a **publishable key (`pk_live_…`)**. Publishable keys are front-end only — Stripe rejects them for any server-side call, so no plan can be linked and no checkout can be created until the real secret key is saved.

This is a credential problem, not a bug in the linking flow. Nothing in the app can work around it.

## Steps

1. **Replace the payment key.** Open a secure form to re-enter `STRIPE_SECRET_KEY`, with a hint that the value must begin with `sk_live_` (or `sk_test_` while testing). In Stripe: Developers → API keys → "Secret key" → Reveal → copy. Do not use the publishable key.
2. **Harden the check so a paste mistake is obvious.** Trim surrounding whitespace and quotes before validating the key, and make the error message name the problem precisely — "a publishable key was saved; the secret key is required" when the value starts with `pk_`, instead of the generic invalid-key text.
3. **Show the state in Admin → Plans & Fees.** The environment badge already shows "Stripe key invalid"; extend it to explain in one line which key type is stored, so this is diagnosable without reading logs.
4. **Verify.** Call the linking function again and confirm it returns a status payload instead of 503, then link Business and Premium and confirm each row flips to "Linked".

## Technical notes

- `supabase/functions/_shared/stripe.ts` — trim the env value, keep the `sk_`/`rk_` shape check, add a `publishable key` detection flag alongside `stripeKeyMalformed`.
- `supabase/functions/orders-plans-stripe/index.ts` — use the more specific message in the 503 response.
- `src/pages/admin/Plans.tsx` — surface the specific key-state message on the badge.
- No database or schema changes.
