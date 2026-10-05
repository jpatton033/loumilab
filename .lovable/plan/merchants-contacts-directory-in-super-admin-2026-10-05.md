# Merchants & Contacts directory in Super Admin

## Why sign-ups are hard to find today

- Sign-in details (email, verified status, last sign-in, sign-up date) live only in the private accounts store. The admin app cannot read it, and the person's profile keeps only a display name.
- The admin Orders page lists only people who have a merchant record. Anyone who signed up but stopped before adding a business does not appear. Today there are 5 accounts, 4 merchant records, and 1 account with no business.
- The relationship answer (owner or manager) is saved only for signed-out Local submissions. It is lost when a signed-in person starts a listing.
- Marketing email choice is stored only as a newsletter sign-up, matched by email, and is never shown next to the merchant.

## What you get

A new **Merchants & Contacts** page under Orders in the admin sidebar. It has one row per person, including sign-ups with no business, which show "Business not added".

Columns: contact name, business name, account email, business phone, city/state, product (Local / Orders / Both / None yet), relationship (Owner / Authorized representative / Unknown), signup date, email verified, onboarding progress (Account only, Business added, Listing drafted, Store set up, Payouts ready, Live), Local listing status, Orders store status, marketing email (Subscribed / Not subscribed / Unsubscribed), and last sign-in.

- Search by name, business, email, phone or city.
- Filters for product, onboarding stage, verified/unverified, listing status, store status and "no business yet". Sort by signup date or last sign-in.
- Clicking a row opens a detail panel with two clearly labelled sections:
  - **Account contact (private)**: the person's name, login email, the email and phone used for registration, mailing address and relationship.
  - **Public business contact**: the phone, email and website shown on the Local listing or store.
- Quick actions: copy email, open in Loumilab Mail, open the Local listing or storefront, and edit contact details (each edit is recorded in the Audit Log).
- Export the filtered list as a CSV file. Cells are protected against spreadsheet formula tricks.
- Overview tile: "New sign-ups (30 days)", including people who haven't added a business yet.

Private details stay admin-only and never appear on public listings. Existing accounts, listings and stores are not changed. The update only adds new information and fills in what's missing.

## Fixing the underlying connections

- Save the relationship answer on the merchant record when a signed-in person registers for Local or Orders. Fill it in for existing records where a visitor submission or approved claim already gave the answer, and leave it "Unknown" otherwise.
- Save the person's name at signup (from Google, or from the sign-up form) to their profile, and fill this in for existing accounts where available.

## Technical details

- Migration: add `relationship` (text, nullable, owner/manager) to `public.merchants`. Backfill it from `local_claims` and visitor `local_candidates` where emails match. Update `handle_new_user` to copy `raw_user_meta_data->>'full_name'/'name'` into `profiles.display_name`, and backfill existing profiles.
- New security-definer RPC `admin_merchant_directory()`, gated by `is_staff(auth.uid())`. It starts from `auth.users` and LEFT JOINs `profiles`, `merchants`, `merchant_storefronts`, `merchant_local_profiles`, `merchant_stripe_accounts` and `newsletter_subscribers`/`suppressed_emails` by lowercased email. It returns `email_confirmed_at`, `last_sign_in_at`, `created_at` and a computed onboarding stage. Execute is revoked from anon/public. No auth tables are exposed directly.
- `src/lib/orders/local.ts` (`useCreateLocalMerchant`) and the Orders setup create path pass the chosen relationship. The Join page already collects it.
- New `src/lib/admin/directory.ts` (query hook, filters, CSV via the existing safe-CSV helper) and `src/pages/admin/MerchantsDirectory.tsx`, reusing table, Sheet, Badge and `StoreStatusBadge`. Contact edits reuse `ordersAdmin` mutations plus an audit insert.
- Route `/admin/merchants` sits under the existing ProtectedRoute. Add a nav entry in `adminNav.ts` and the Overview tile in `queries.ts`.
- Record a rule in AGENTS.md: admin people data comes only through the staff-gated directory RPC.
