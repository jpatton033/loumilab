# Cloudflare domain search for Business Email and Spaces

## What customers get
- A "Find your domain. Build what's next." search on the Business Email page: type a name or keyword, see suggested domains with registration and renewal prices from Cloudflare, a Premium tag when applicable, and a clear "Suggestion — not yet confirmed" label.
- Selecting a domain runs a fresh live check and shows one of: Available, Unavailable, Premium, Unsupported, Verification required, Provider unavailable — with Cloudflare's real price (no Loumilab markup).
- "Request Domain Setup" opens the existing Business Email start form with the domain filled in, plus a note that requesting does not reserve or guarantee the domain. Nothing is purchased automatically.
- Spaces → app → Domains: two options — "Find a new domain" (same search, leading to the setup request) and "Connect a domain you own" (DNS instructions, ownership check, HTTPS and routing status, using the existing Cloudflare hosting setup). Customer DNS is never changed without their approval.
- Admin → Domains: connection status, account readiness, last successful request, recent errors, daily usage, rate-limit settings, and "Registration automation: off".

## Confirmed from Cloudflare's docs (Sep 2026)
- Search (cached, discovery only) and Check (live registry, up to 20 domains) both return registration and renewal price, currency and tier; Check returns a reason when not registrable.
- The API is in beta and only covers some extensions; others return "extension not supported via API".
- Requirements: account ID, a token with Registrar permission, a billing payment method, a default registrant contact, and acceptance of the Domain Registration Agreement in the Cloudflare dashboard.
- No published per-call fee was found; I will treat usage as limited and report anything found during live tests.

## Credentials
Your Cloudflare connection is already linked to the project, so no token goes in chat or code. The current token likely lacks Registrar permission. If the first live check returns "permission denied", I will ask you to add the Registrar permission to that token (or reconnect with a new one) and give exact dashboard steps. The account ID is read from the connection itself.

## Steps
1. Backend: one new staff-safe function handling search, check, and connection status; validates and normalizes input, 8-second timeouts, safe logs, strict response checks.
2. Protection: per-visitor/per-account limits (e.g. 20 searches and 40 checks per hour, adjustable by admins), short cache for suggestions only, never for checks; usage counters and error log tables, staff-read only.
3. Business Email page search + results + selection carried into the start form and saved on the request for admin review.
4. Spaces Domains tab with both options; existing-domain connection reuses the hosting provisioning with a verification step.
5. Admin Domains page.
6. Live tests: keyword and full-name search, available/taken/premium/unsupported/invalid inputs, missing permission, rate limit, intake handoff, Spaces search, cross-account protection, mobile and desktop.

## Not included
- Automatic domain purchase or renewal.
- Any Loumilab fee on domain prices.

## Technical details
- Function `domain-search` via the Cloudflare connector gateway (`/client/v4/accounts/{id}/registrar/domain-search` and `/domain-check`); 403 mapped to "Registrar permission missing".
- Tables: `domain_search_usage` (hashed visitor key, counts), `domain_provider_events` (status, error, timestamp), `domain_settings` (limits); RLS staff-only, writes only from the function.
- Business Email request gets a `requested_domain` + `domain_check` snapshot column.
- Spaces custom domains: `spaces_custom_domains` (app, hostname, verification token, status), managed only via `spaces-api` with `spaces_can_manage_app`.
- Pure status-mapping and normalization helpers with tests.
