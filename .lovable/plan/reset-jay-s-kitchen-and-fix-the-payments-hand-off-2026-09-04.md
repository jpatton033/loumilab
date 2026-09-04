# Reset Jay's Kitchen and fix the payments hand-off

## What I found

Jay's Kitchen does have a payments account on Stripe's side, but nothing has ever been submitted to it: no business type, no bank account, no owner details, no terms acceptance. I generated a fresh Stripe setup link just now and Stripe returned a valid one, so the link itself is fine.

That matches what you described: the Stripe page never opens. The dashboard runs inside an embedded preview frame, and the code asks the browser to open Stripe in a new tab from inside a callback that happens *after* an awaited network request. Browsers treat that as a non-user action and silently block it. The fallback link exists, but the link Stripe issues expires after 5 minutes, so by the time it is clicked it can already be dead.

Jay's Kitchen currently has 1 store and 1 item; no orders, jobs, customers or subscriptions.

## What I'll do

**1. Full reset of Jay's Kitchen (you chose everything)**
- Remove the store, its catalogue item, the payments account record, and the business record for Jay's Kitchen.
- Close the unused Stripe account so no orphan remains on Stripe.
- Nothing else in the app is touched; no other business is affected.

**2. Fix the hand-off to Stripe so it actually opens**
- The button becomes a direct link that opens in a new tab on the click itself, so the browser never blocks it.
- The setup link is created the moment it is needed and, because Stripe links are short-lived, a stale one is regenerated automatically instead of failing.
- If the browser still refuses a new tab, the whole page navigates to Stripe rather than leaving a blank frame.
- On return, the payments card and Store Set-up refresh together as they do today.

**3. Re-onboard cleanly**
- After the reset, you sign up Jay's Kitchen again from Let's build, then Set up payments. Everything Loumilab already knows (business name, category, store address on the web, support email) is still pushed to Stripe automatically, so Stripe should only ask for business type, bank account, owner details and terms.

## Technical notes

- Data removal via a data-change statement scoped to merchant `141f036b-8dcc-4022-b362-4da08b881ff9`: `merchant_products`, `merchant_storefronts`, `merchant_stripe_accounts`, then `merchants` (no dependent orders/jobs/quotes/invoices exist). `merchants` denies DELETE to clients, so this runs server-side.
- Stripe: `DELETE /v1/accounts/acct_1UBPUJBYIrfu7E6l` (permitted — the account has no submitted details or balance).
- `src/components/orders/PayoutSetupCard.tsx`: replace the `window.open` call after `await` with an anchor rendered from a pre-fetched link plus a `target="_blank"` click, track link `expires_at`, and fall back to `window.top.location.href` on block. Keep the existing config-notice and refresh behaviour.
- `supabase/functions/stripe-connect/index.ts`: return the account link's `expires_at` alongside `url` so the client can tell a stale link from a live one. No schema changes.

## Verification

After the reset, confirm no Jay's Kitchen rows remain and the Stripe account is gone, then re-create the business and confirm the Stripe onboarding page actually opens in a new tab from the dashboard.
