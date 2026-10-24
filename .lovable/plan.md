# Merchant Help Desk and Account Assistance

## What exists today (reviewed)

- One admin (the "admin" app role). The separate staff-role list (super admin, finance, merchant support, operations, analyst) exists but has no one in it.
- The Admin workspace only lets in the "admin" role; staff roles can't reach it yet.
- Any "staff" person is treated the same everywhere: they can read every merchant, storefront and Stripe payout record.
- The audit log is written from the browser, so the actor's role and email are supplied by the page itself.

## Security concerns found

1. **Staff can edit any merchant field directly**, including owner, plan and order acceptance. Fine with one admin, unsafe once support staff are added.
2. **"Staff" is all-or-nothing.** No difference between viewing and changing.
3. **Audit entries can be shaped by the browser** (role "admin" is hardcoded; entries are optional per screen).
4. **Stripe payout records are readable by all staff**, more than support needs.

These get fixed as part of this work, without changing anything for merchants or for the current admin.

## What will be built

### 1. Three support levels
- **Support Viewer**: read-only view of merchant setup, onboarding progress, storefront, catalog, plan, and recent help requests. No contact details beyond business email, no payment amounts.
- **Support Specialist**: Viewer, plus *with merchant-granted access only* can make a short list of approved changes (store details, hours, pickup/delivery settings, menu items, Local listing text, re-sending welcome or setup emails).
- **Support Administrator**: Specialist, plus manage support staff, close/reassign tickets, revoke any session. The existing admin is automatically a Support Administrator.

Never available to any support level: passwords or sign-in methods, Stripe connection/payouts/refunds, plan or billing changes, fee settings, changing or transferring account owner, deleting the account, and customer payment details.

### 2. Merchant Help button
- A **Help** button in the merchant dashboard header opens a short form: topic (setup, storefront, payments, orders, calendar, other), message, and an optional "Allow Loumilab support to make changes for me" checkbox with a duration (1 hour, 24 hours, 7 days).
- Merchants see their open requests, replies, and a clear banner while support access is active, with a **Revoke access** button.
- Email notice to hello@loumilab.com on new requests (existing email system).

### 3. Admin Help Desk (new "Support" group in Admin)
- **Help Desk queue**: new / open / waiting on merchant / resolved, assignee, reply thread.
- **Merchant support view**: one page per merchant with a setup checklist (account, store details, catalog, payouts connected yes/no, published, Local listing, calendar), current settings, and recent activity. Payouts show status only, never amounts or bank info.
- **View as Merchant**: opens a read-only replica of the merchant dashboard inside Admin, with a fixed banner ("Viewing as Jay's Kitchen — read-only"). It reads data through the support view, not by signing in as the merchant, so no session or password is ever used.
- **Assisted changes**: when the merchant has granted access, Specialists see Edit controls only for the approved fields. Every change asks for a short reason.

### 4. Access grants
- A grant belongs to one merchant, lists the allowed change types, has an expiry, and can be revoked by the merchant or a Support Administrator at any moment.
- Staff can also *request* access from the ticket; the merchant approves in their dashboard.
- Expired or revoked grants stop working instantly because every change checks the grant on the server.

### 5. Audit log
- Every support action (opening a merchant view, View as Merchant session, each change with before/after values, grant created/revoked, ticket status change) is written by the server, not the browser.
- Shown in the existing Audit Log page, filterable by merchant and staff member. Merchants see a simple "Support activity" list for their own account.

## Not changing
- Merchant dashboard, onboarding, storefronts, checkout and fees behave exactly as today.
- The current admin keeps full access.

## Technical details

- **Roles**: extend `admin_role` enum with `support_viewer`, `support_specialist`, `support_admin` (keep existing values). New security-definer helper `support_level(_uid)` returning 0–3; existing `has_role(...,'admin')` and `super_admin` map to level 3.
- **Tables** (RLS on, GRANTs per policy, no FKs to auth.users):
  - `support_tickets` (merchant_id, opened_by, topic, status, assignee_id, timestamps)
  - `support_ticket_messages` (ticket_id, author_id, author_kind merchant/staff, body)
  - `support_access_grants` (merchant_id, granted_by, scopes text[], expires_at, revoked_at, revoked_by, ticket_id)
  - Merchant owners read/insert their own tickets/messages/grants and may revoke; staff read by level. No direct client UPDATE/DELETE on grants.
- **RPCs (security definer, all audit inside the function)**: `support_merchant_overview(_merchant_id)` (safe-field projection incl. checklist), `support_view_as_merchant(_merchant_id)` (read-only dashboard payload, logs session), `support_apply_change(_merchant_id, _scope, _patch jsonb, _reason)` (checks level ≥2 + active non-expired grant covering scope, whitelists columns per scope, writes before/after to `audit_logs`), `merchant_grant_support_access`, `revoke_support_access`, `support_ticket_set_status`, `support_request_access`.
- **Hardening of existing policies**:
  - Replace "Owners update own merchant OR staff" with owner-only UPDATE; staff edits to merchants go only through RPCs. Add a trigger blocking changes to `owner_id`, `plan_slug`, Stripe fields by anyone except service role / existing billing paths (verify current admin screens that edit merchants first and route them through an RPC).
  - Restrict `merchant_stripe_accounts` staff read to `support_level >= 3` or finance roles; support views get payout status via the overview RPC only.
  - `audit_logs` INSERT policy: force `actor_id = auth.uid()`; support actions written server-side with real role.
- **Admin access**: `ProtectedRoute` accepts any staff (`is_staff`), and admin nav items declare a minimum level so non-support sections stay hidden; every section's data is already server-gated, which is re-checked.
- **Frontend**: `src/lib/support/*` hooks; `HelpButton` + `HelpDrawer` in the merchant dashboard (reuses Sheet/Dialog, Textarea); `/admin/support`, `/admin/support/:ticketId`, `/admin/merchants/:id/support` reusing existing admin tables and the dashboard's section components in read-only mode.
- **Email**: new-ticket notice via existing `_shared/notify.ts`.
- **Tests**: scope whitelist (forbidden fields rejected), grant expiry/revoke logic, level-to-permission mapping.
- **AGENTS.md**: one rule — support access and changes go only through security-definer support RPCs gated by level and merchant grant, audited server-side.

## Open decision
Assigning support staff: Support Administrators add staff by email in Admin → Support → Team (the person must already have a Loumilab account).
