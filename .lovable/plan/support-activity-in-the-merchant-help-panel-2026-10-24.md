# Support activity in the merchant Help panel

A basic Support activity list already exists in the merchant's Help panel (added with the Help Desk). It shows what kind of action happened and when, but not *what* changed. This plan finishes it.

## What merchants will see
In Help → **Support activity**, newest first, each entry shows:
- **Date and time**
- **What happened**, in plain words: "Support viewed your account", "Support viewed your dashboard (read-only)", "You allowed support access for 24 hours", "Access revoked", "Support asked for access to Menu items".
- **For changes, what changed**: each field as "Delivery fee: $3.00 → $4.50", "Hours: — → Mon–Fri 9–5", "Item shown: On → Off", plus the note support gave.
- A "Show more" button once there are more than 10 entries.

## Kept private
- No staff names, emails or roles. Every entry just says "Loumilab support".
- Only the merchant's own account. The server already filters this, so a merchant can't see other accounts' activity.

## Technical details
- `merchant_support_activity()` RPC: stop returning `actor_role` (replace with `by_merchant boolean`), and keep returning `old_value`/`new_value` (field-level diffs written by `support_apply_change`) and `reason`.
- New pure formatter `src/lib/support/activity.ts`: maps action → label, field keys → friendly labels, cents fields → dollars, booleans → On/Off, empty → "—".
- `HelpDrawer.tsx`: render the formatted entries, with no role shown, and paginate at 10.
- Test `src/test/supportActivity.test.ts`: cents formatting, boolean formatting, and that output never includes staff identifiers.
