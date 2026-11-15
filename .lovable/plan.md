# Spaces — Official Loumilab Project designation

## What you get
- **Two kinds of apps:**
  - **Official Loumilab Project** — only when a Loumilab admin verifies it.
  - **Independent Project** — the default for everything else, including apps uploaded by Loumilab staff.
- **A quiet badge** for official apps: a small check icon with the words "Official Loumilab Project". It appears only on the app's details, Passport and management views.
- **Plain wording for independent apps:** they show "Independent project · Owned by <workspace>", never a warning.
- **Passport keeps ownership and hosting separate.** Lines like "Owned by Loumilab" and "Hosted on Loumilab Spaces" always appear as separate items.
- **New Admin page: Spaces → Official projects.** It lets authorized staff:
  - review who owns each app
  - grant or revoke official status, with a required note
  - see the full verification history
  - see whether the app's address is allowed

## Who can verify
- Super admins only, by default.
- A super admin can give "verify Spaces projects" permission to specific staff, and take it back later. Every grant and removal is logged.
- Customers, workspace owners and app admins can never verify their own apps.

## Rules that can't be bypassed
- Official status lives only in a staff-only record and is changed only by protected backend actions. The app's own settings, its spaces.json file and anything sent from the browser are ignored.
- Importing, exporting, copying or re-uploading an app never carries the badge over. A new app always starts as Independent.
- Each grant points to an internal Loumilab ownership record, with the product name, a responsible person and a note. Each grant and revoke goes into the audit log.
- Public exports and the Passport show only "Verified by Loumilab on <date>". Internal notes and the staff member's name stay private.

## Addresses
As you chose, all apps use `name.loumilab.com`. Product names stay reserved for Loumilab: orders, spaces, local, admin, www, mail, click, notify, send and rsend. Customer apps can never take them.
- An official badge doesn't unlock these names on its own. A super admin must also approve the name separately.
- An official badge never lets an app run on the signed-in loumilab.com site. Official apps are still served the same safe, separate way as customer apps.

## Technical details
- Staff-only `spaces_official_designations` table (app, ownership reference, product, verified by/at, revoked by/at, note), plus `spaces_designation_events`, which can only be added to, never edited. Both have RLS turned on, with no direct customer access.
- `spaces_verifier_grants` lists the staff allowed to verify. Only a super admin can add or remove someone (checked by `has_admin_role(...,'super_admin')`).
- Security-definer RPCs:
  - `spaces_grant_official`, `spaces_revoke_official`, `spaces_set_verifier` and `spaces_approve_reserved_name`, each checked on the server and written to `audit_logs`.
  - `spaces_app_designation(app_id)` returns only the safe public fields.
- `spaces-api` import, export and copy actions never write designation data. `spacesSpec.ts` drops any `official` or `verified` keys found in spaces.json.
- `guard_customer_slug` refuses reserved product names unless a super admin has approved that name for that app.
- UI:
  - a shared `OfficialBadge`, used in the Dashboard details, Passport and management views
  - a new `src/pages/admin/SpacesOfficial.tsx` page, plus its sidebar link
- Tests cover these cases:
  - the app owner can't verify their own app
  - a non-super-admin can't add a verifier
  - an imported spaces.json with `official: true` stays Independent
  - revoking removes the badge
