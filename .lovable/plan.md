# Merchant contact details in Super Admin and Loumilab Mail

Today the admin portal shows a business name, plan and store location for each merchant — no email, no phone, no person's name, no postal address. This adds proper merchant contact records and surfaces them where you need them.

## New details collected per merchant

- Contact name (the person to speak to)
- Mailing address: street, suite/unit, city, state/region, ZIP/postal code, country
- Email and phone already exist and will now be shown

## Where merchants enter it

A "Business contact & mailing address" card in the merchant's own dashboard settings area, alongside their existing business details. It is optional so nobody is blocked, with a gentle prompt when the address is empty. Merchants can edit it any time.

## Where you see it in Super Admin

In the Orders section's merchant list, each merchant expands to show:

- Business name, contact name, account holder's display name
- Contact email (click to copy, click to email) and phone
- Full mailing address (click to copy as one block)
- Store name, store location, plan, live/paused/setting-up state, payout state, signed-up date
- A search box to find a merchant by business name, contact name, email or city

You can also correct any merchant's contact name, email, phone or address from the admin side; each change is written to the audit log.

## Loumilab Mail

- The Contacts picker's Merchants group will show the contact name and business name, not just the business name, and stay searchable by either.
- Merchant entries include the phone and city as a small hint line so you pick the right one.
- New "Merchants — live stores only" and "Merchants — still setting up" groups for quicker targeted sends.
- `{{business_name}}` and `{{contact_name}}` merge fields join the existing `{{first_name}}` / `{{email}}`, filled from the merchant record when the recipient matches a merchant.

## Technical notes

- Migration: add `contact_name`, `address_line1`, `address_line2`, `city`, `region`, `postal_code` (all nullable text) to `public.merchants`; `country` already exists. No new table, no policy changes — existing merchant-owner and `is_staff` policies already cover reads and writes. Staff already hold update rights for admin corrections.
- `src/lib/admin/ordersAdmin.ts`: select the new columns plus `contact_email`, `phone`, `owner_id`; join `profiles` on `owner_id` for the display name; extend `AdminMerchantRow`.
- `src/pages/admin/Orders.tsx`: merchant rows become expandable detail panels with copy/mailto actions and a client-side search filter; add an inline edit dialog that updates `merchants` and inserts an `audit_logs` row (`action: "merchant.contact_updated"`).
- `src/lib/admin/mail.ts`: `useMailContacts` selects the extra merchant fields, sets `label` to `Contact name · Business name`, adds a `hint` field and the two new merchant groups; `Contact["group"]` union widened. Merge-field substitution in `supabase/functions/admin-email-send/index.ts` gains `{{business_name}}` / `{{contact_name}}` resolved from a merchants lookup by recipient email.
- `src/components/admin/mail/RecipientField.tsx`: render the hint line and the new group filter chips.
- Merchant-side form lives in the existing settings/store area of `src/pages/orders/Dashboard.tsx` (new `MerchantContactCard` component), saving through the existing merchant update path.
