# Confirming Stripe links for Orders plans

## What I found

No plan tier is linked to Stripe yet — not just Business and Premium. A query of the plans table shows every row has empty `stripe_product_id`, `stripe_price_monthly_id`, and `stripe_price_annual_id`:

```text
launch   / Starter  · $0    · no subscription · no Stripe IDs
starter  / Business · $19   · subscription    · no Stripe IDs
business / Premium  · $49   · subscription    · no Stripe IDs
custom   / Custom   · —     · no subscription · no Stripe IDs
```

The admin table shows "Not linked yet" for Business and Premium only because Starter and Custom don't require a subscription (they render "—"), so the label is accurate.

This is not currently broken for merchants: the billing function provisions the Stripe product and price on demand the first time a merchant subscribes to a plan, then writes the IDs back. So checkout works, but nothing is linked until the first real subscribe attempt, and admins have no way to verify pricing exists in Stripe before launch.

## What to build

Give Super Admins explicit, verifiable Stripe linkage instead of waiting for the first merchant.

1. **Admin "Link to Stripe" action** on each subscription plan row in Plans & Fees. It calls a new admin-only action that provisions/reuses the Stripe product and monthly price (plus the annual price when annual billing is on) and saves the IDs.
2. **Richer status column**: show Linked (monthly), Linked (monthly + annual), Price out of date (Stripe amount no longer matches the plan), or Not linked yet — instead of a single boolean, plus the Stripe mode (test vs live) so it's obvious which environment the IDs belong to.
3. **Auto-relink on price edits**: when an admin changes a monthly/annual amount, mark the plan as needing relink and let the same action re-create the price.
4. **Verify all tiers** by running the link action for Business and Premium and confirming the saved IDs resolve in Stripe.

## Technical notes

- Reuse the existing `ensurePrice` logic from the merchant billing function; extract it to a shared module and add an admin-authorised action (`ensure_prices`) that runs it for a given plan without touching merchant/subscription records.
- Guard the action with the existing staff/finance-admin role check, and log it to the audit log with the resulting product/price IDs.
- Add a read-only status check that retrieves each saved price from Stripe and compares `unit_amount` and `recurring.interval` to the plan row, so the admin column can flag drift.
- Free and Custom tiers stay unlinked by design (no recurring charge); the column keeps showing "—" for them.

## Out of scope

Plan slugs still read `launch`/`starter`/`business` while the display names are Starter/Business/Premium, and the static pricing mirror in the code uses the old names. That naming mismatch is untouched here — happy to clean it up separately.
