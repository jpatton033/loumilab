# Sync Payments & Payouts with Store Set-up

## What's actually happening

I checked the live payments record for Jay's Kitchen. It was refreshed from Stripe minutes ago and Stripe still reports:

- Details submitted: **no**
- Outstanding: business category, business website, business type, bank account, owner name/DOB/email, terms acceptance

So the checklist isn't stale data — the Stripe onboarding form itself was never completed and submitted on Stripe's side. What was completed is the **Loumilab store set-up** (business name, branding, catalogue, fulfilment). The two are currently disconnected, which is why it feels like being asked twice.

Two real problems to fix:

1. **Nothing from the store is handed to Stripe.** The connected account is created with only a business name, so Stripe asks for the website, category and business type that Loumilab already has.
2. **The two panels can disagree.** The Payments card loads its status once on mount and never refreshes the Store Set-up checklist, so after returning from Stripe the checklist can still show the old state until a full page reload.

## What I'll change

**1. Pre-fill Stripe from the store (removes most outstanding items)**
- On account create and on every "Continue setup", push the data Loumilab already holds to Stripe: business name, contact email, storefront public URL, product/service description, support email/phone, business type, and an industry-derived merchant category (MCC) mapped from the merchant's Loumilab industry.
- Result: the merchant only sees the items Stripe legally requires them to enter themselves — bank account, owner identity/DOB, and terms acceptance.

**2. Keep the two sections in sync**
- Payments card and the Store Set-up checklist read one shared, cached payments status, so both always show the same answer.
- When the merchant returns from Stripe onboarding, automatically re-sync from Stripe and refresh both panels — no manual reload.
- Add a light "Refresh status" affordance plus a "last checked" timestamp.

**3. Fluid, honest copy**
- Group the outstanding list into "Loumilab has this" (pre-filled, ticked) vs "Stripe needs this from you" (bank account, ID, terms), so it reads as a short finish line rather than a wall of missing fields.
- Store Set-up's Payments row mirrors the same short summary and links straight into the Stripe step.

## Technical notes

- `supabase/functions/stripe-connect/index.ts`: build a shared `business_profile` payload (name, url, mcc, product_description, support email/phone) plus `business_type` and `email`; apply on `accounts.create` and via `accounts.update` before creating each account link. Source storefront slug/description from `merchant_storefronts`, industry from `merchants.industry_slug`.
- New industry→MCC map in `supabase/functions/_shared/` derived from `orders_industries` slugs, with a safe default.
- `src/lib/orders/connect.ts`: expose the status fetch as a react-query hook keyed under `["orders","payouts"]`; split `friendlyRequirements()` into platform-provided vs merchant-required buckets.
- `src/lib/orders/setup.ts`: read payout status from that shared hook/cache instead of its own query so both panels can't diverge; invalidate `["orders"]` after any connect action.
- `src/components/orders/PayoutSetupCard.tsx`: detect return-from-Stripe (return URL param), auto re-sync, refresh checklist, render the grouped requirement lists and last-synced time.

No schema changes. Stripe functions redeployed after the edit.
