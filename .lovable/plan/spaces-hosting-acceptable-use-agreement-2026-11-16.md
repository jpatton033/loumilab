# Spaces Hosting & Acceptable Use Agreement

Store the full 22-section agreement (Part II, verbatim) as Version 1.0 in **draft**, add acceptance at Spaces signup, a viewer, Account Settings access, admin publishing, and server-side enforcement that only switches on once you publish it.

## What customers will see (after you publish)
- **Spaces sign-up** (`/spaces/sign-in`, create-account mode only): an unchecked box right above "Create account" with the exact wording, three separate links (Terms, Agreement, Privacy). Create account stays disabled until checked; Orders sign-up untouched.
- **Agreement viewer**: accessible modal showing the whole agreement with headings/numbering, version and effective date, Print / Save as PDF, closes without losing typed sign-up details. No forced scrolling.
- **Google sign-in / existing customers**: a one-time prompt in the Spaces dashboard ("Review and accept") before deploy/publish actions. Existing apps stay untouched and viewable; only governed actions wait for acceptance. Never re-prompted once accepted.
- **Spaces Account Settings → Legal & Agreements**: current agreement plus every version the customer accepted, with date. No new menu item.

## While still in draft
- Nothing is shown or enforced for customers; the sign-up box appears only once a version is published.
- No acceptance records are created for anyone, including existing customers.

## Admin (Admin → Spaces → Legal agreements)
- Review draft text, version, content hash; set effective date; publish (super admins only, audited).
- Acceptance stats, historical versions, list of customers who still need to accept the current version.
- Published versions are locked; changes require a new version (material change flag forces re-acceptance).

## Enforcement
- Backend deploy, rollback-to-public, visibility-to-public and import/publish actions in the Spaces service refuse with a clear message when a published agreement exists and the user has not accepted its current required version.
- Build/compile (Phase 2) gets the same check wired in but stays off.
- Official Loumilab Project rules unchanged.

## Terms & Privacy review
A written list of recommended updates (source code, build execution, artifacts, logs, providers, secrets, retention, customer data, security responsibilities) saved to Files. Existing Terms/Privacy are not changed.

## Technical details
- Tables: `legal_documents` (id, slug, title), `legal_document_versions` (version, content, sha256 hash, effective_date, status draft/published/retired, requires_reacceptance, approved_by, published_at; immutable once published via trigger), `legal_acceptances` (user_id, version_id, hash, accepted_at = now(), method signup/prompt, workspace_id nullable; no client insert/update/delete).
- RLS: published versions readable by all; drafts staff-only; acceptances readable by owner and staff only.
- RPCs (security definer): `legal_current_version(slug)`, `legal_accept(version_id, hash)` (rejects if hash or version isn't the current published one), `legal_needs_acceptance(slug)`, `legal_publish_version` (spaces_is_super), `legal_admin_stats`.
- Sign-up: checkbox carries the displayed version id + hash; after the account is created (or on first Spaces session for OAuth/email-confirm flows) the pending acceptance is submitted via `legal_accept`; the Spaces dashboard gate covers any gap, so access never relies on the browser checkbox.
- `spaces-api`: shared `requireSpacesAgreement(user)` before governed actions; no-op while no version is published.
- Seed: V1.0 inserted as draft with the exact Part II text; test asserts all 22 sections stored and hash matches.
- Tests: hash/version mismatch rejected, user cannot write acceptances, enforcement off while draft, on after publish (checked in a rolled-back transaction, no lasting records).
