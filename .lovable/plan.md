# Finish the Help Desk and Support Team

## Cause of the "not found" pages
The Help Desk pages were built, but the links that connect the four addresses to them are missing from the app's page list. That's why Admin → Support → Help Desk and Support Team show the 404 page.

## What will be done
1. **Reconnect the pages**: Help Desk (`/admin/support`), a single request (`/admin/support/<id>`), Merchant support view (`/admin/support/merchant/<id>`), and Support Team (`/admin/support-team`). Support staff and full admins can open them; everyone else is sent to sign-in.
2. **Open a merchant from the directory**: add a "Support view" button on each row in Merchants & Contacts so staff can help a merchant even without a request.
3. **Audit Log filters**: filter by merchant and by staff member, and a "Support actions only" toggle.
4. **Merchant "Support activity" list**: in the merchant's Help panel, show what support viewed or changed on their account (time, staff role, what changed). It reads through a new server check that only returns the merchant's own entries.
5. **Check it end to end** in the preview as the admin: open each page, open a merchant support view and View as merchant, add and remove a Support Team member.

## Not changing
Merchant dashboard, onboarding, storefronts and existing permissions stay as built.

## Technical details
- `src/App.tsx`: re-add the four `<Route>`s with `ProtectedRoute supportLevel={1}` before the `*` route (the lazy imports already exist).
- `MerchantsDirectory.tsx`: link to `/admin/support/merchant/:id`.
- `AuditLog.tsx` + `useAuditLog`: optional `target_id`, `actor_email`, and `action like 'support.%'` filters.
- New security-definer RPC `merchant_support_activity()` returning `audit_logs` rows where `target_type='merchant'`, `target_id` = caller's merchant, `action like 'support.%'` (no actor email, role only); rendered in `HelpDrawer`.
