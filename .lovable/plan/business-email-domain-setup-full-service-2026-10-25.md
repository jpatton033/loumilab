# Business Email & Domain Setup — full service

A real, paid service on loumilab.com: choose a package, answer a short questionnaire, see the price, pay with Stripe, get a confirmation, and Loumilab handles setup from a new admin page. Orders, Local and other services stay as they are.

## What customers get

**Service page** at `/services/business-email` (linked from Services and the main Services page). Headline "Professional Email. Your Business. Your Domain.", providers (Google Workspace, Microsoft 365, Zoho Mail), package comparison, setup steps, FAQ, Get Started buttons that preselect a package. Clear note that domain, renewal, email subscription fees and taxes are paid separately to those providers.

Packages:
- Business Email Setup — $99 (already owns a domain)
- Business Email + Domain Setup — $149
- Add-ons: extra mailbox $25 each, extra device $25 each, standalone domain setup $49
- Migration "from $199" — always reviewed first, never charged at checkout
- 7 days limited post-setup support

**Questionnaire** at `/services/business-email/start` — contact, domain, email setup, notes, with short plain-language help for terms like DNS or registrar. Never asks for passwords or codes. Progress is saved on the device and on submit.

**Automatic check:** standard checkout only when no migration, up to 5 mailboxes, up to 3 extra devices, a chosen provider (or "Help me choose"), and domain access confirmed. Otherwise it is saved as a quote request and the customer gets a "we're reviewing it" email.

**Order summary** with itemized Loumilab charges, separate note on third-party costs, and six required acknowledgements before paying.

**Payment** through Stripe Checkout (Loumilab's own account, not merchant accounts). Price is calculated on the server. The order is marked paid only when Stripe confirms it, never from the return page alone.

**Private status page** reached by a long secret link sent in emails (request numbers alone never reveal anything). Shows status, summary and what Loumilab needs next.

**Emails to the customer:** payment confirmed (with request number, itemized summary, how to prepare access), quote request received, quote ready with pay link, setup started, action needed, completed (address, provider, how to sign in, renewals, 7-day support). No passwords ever sent.

## What Loumilab gets

**Admin → Services → Email Setup** (full admins only): list with search and filters by service status and payment status; each request shows all intake details, price snapshot, payment status, fulfillment checklist (domain, email, final verification), internal notes (never shown to customers), message log, and actions:
- change service status (New Request, Awaiting Quote, Awaiting Payment, Paid — Awaiting Setup, In Progress, Awaiting Customer Action, Testing & Verification, Completed, Canceled)
- issue a quote amount, which creates a Stripe payment link and emails it
- send "action needed" with a message
- mark Completed (sends the handoff email, keeps a completion record)

**Emails to hello@loumilab.com:** new paid order, new quote request, failed or expired payment, customer added information. Each sent once even if Stripe retries.

## Tracking and search
Page metadata, canonical, Service structured data, sitemap and prerender entry. Events: package chosen, form started, form submitted, checkout started, purchase (only after verified payment, from the status page). No names or emails sent to ad tools.

## Before taking real payments
- Add `checkout.session.completed`, `checkout.session.expired` and `checkout.session.async_payment_failed` to the existing Stripe webhook (likely already partly enabled).
- I'll test with Stripe test mode if a test key is available; otherwise the payment step stays unverified and I'll say so.
- Placeholder wording in the service terms gets added to the existing Terms page; please review it.

## Technical details
- Tables: `email_setup_requests` (intake JSON, package, add-ons, price snapshot cents, service_status, payment_status, quote_cents, stripe session/payment ids, access_token hash, completed_at), `email_setup_notes` (internal), `email_setup_events` (communications/status log), `email_setup_notifications` (unique key per request+kind for de-duplication). RLS on, staff-only reads via `is_admin`; no anon/authenticated access. Customers reach their record only through security-definer RPC `email_setup_status(token)` returning safe fields.
- Pure pricing rule in `supabase/functions/_shared/emailSetupPricing.ts`, shared by the site summary and the server, with a vitest covering $99/$149, add-ons, and each custom-review trigger.
- Edge functions: `email-setup-submit` (zod validation, eligibility, insert, returns token), `email-setup-checkout` (server price, idempotency key per request, Checkout session with metadata `kind=email_setup`), `email-setup-admin` (status, quote + Stripe payment link, notify, complete). Existing `stripe-connect-webhook` gets a branch for `kind=email_setup` that updates payment idempotently and sends emails through the existing Resend/Maileroo sender.
- Admin nav entry in `adminNav.ts`; routes in `App.tsx`; AGENTS.md rule for the new module.
