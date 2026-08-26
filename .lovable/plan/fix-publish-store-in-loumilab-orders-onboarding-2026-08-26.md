# Fix "Publish store" in Loumilab Orders onboarding

## The problem

The last step of `/orders/get-started` does not save anything. Clicking "Publish store" only shows a toast ("Store draft saved… Publishing goes live when Orders launches") — no merchant account, storefront, or catalog is created. That message is left over from the pre-launch placeholder, so a merchant who completes onboarding ends up with nothing.

Everything needed on the backend already exists: merchant accounts, storefronts and catalog items can be created by a signed-in owner, and payouts already gate a merchant from accepting orders.

## What will happen instead

1. Merchant fills the wizard exactly as today (nothing changes in steps 1–7).
2. On "Publish store":
   - If not signed in, they are asked to sign in or create an account, and are returned to the review step with all their answers intact.
   - The store is created for real: merchant account (business name, contact email, industry, purchase models, selected plan), storefront (name, unique link, city, description, hours, pickup details), and each catalog item with a price.
   - The store is saved as a draft, not live — publishing happens automatically once payments setup is complete.
3. Success screen replaces the old placeholder text with the real state and next steps:
   - "Your store is created. Finish payments setup to go live."
   - Buttons: "Finish payments setup" and "Open dashboard"; the store link is shown with a "Draft — not visible yet" badge.
4. If the business name's link is already taken, a numeric suffix is added automatically so publishing never fails.
5. Re-running the wizard when the merchant already has a store updates the existing store rather than creating a duplicate.
6. Selected plan is recorded on the merchant account; subscribing to it happens later from the dashboard billing panel.
7. Once payouts become enabled, the storefront flips to live automatically — no extra step for the merchant.

## Technical notes

- `src/pages/orders/GetStarted.tsx`: replace the toast-only `publish()` with a mutation; add auth check via `supabase.auth.getUser()`, sign-in redirect carrying a return path back to `/orders/get-started`, draft persistence in `sessionStorage` so answers survive the round trip, submitting/error states on the button, and a real success panel.
- New helper in `src/lib/orders/store-admin.ts` (e.g. `useCompleteOnboarding`) that, in order: upserts `merchants` (owner_id = auth.uid(), `accepting_orders` false — the existing payout-gate trigger rejects true), inserts/updates `merchant_storefronts` with `is_published = false` and a slug uniquified on conflict, then inserts `merchant_products` for non-empty items (prices parsed to cents, blank prices skipped for service industries).
- Reuse existing `useMyMerchant` / `useMyStorefront` to detect an existing store and switch to update mode.
- Migration: extend the existing `sync_accepting_orders_on_payout_change` trigger so reaching `payout_enabled` also sets `merchant_storefronts.is_published = true` for that merchant's storefronts. No new tables or policies are needed.
- Remove the "Publishing goes live when Orders launches" copy and the matching draft note in the review step.
