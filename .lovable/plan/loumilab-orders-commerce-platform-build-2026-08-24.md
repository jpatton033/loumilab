# Loumilab Orders — Commerce Platform Build

This is a multi-phase build. Below is the audit of what exists today, the one blocking decision, and the phased plan. Phase 1 is what gets built first; each later phase is approved on its own.

## Audit — what exists vs. what must be created

Exists and will be reused:
- Auth with roles (`admin` / `user`), profiles, RBAC via `has_role`, protected routes, sign-in/sign-up with Google.
- Super Admin shell at `/admin/*` (sidebar, overview, inquiries, newsletter, hero CMS, knowledge center) — new Orders modules drop into the same nav config.
- Marketing page `/orders`, onboarding wizard `/orders/get-started`, merchant dashboard `/orders/dashboard`, storefront template `/orders/store/:slug`.
- Contact/lead intake pattern (`contact_submissions` + rate-limit trigger + Maileroo email function) — the Custom Project intake reuses this pattern.
- Email sending via the existing edge function.

Does not exist (must be created):
- Any merchant, store, product, order, payment, subscription, fee, refund, dispute, payout, promotion, webhook, or audit-log table. Every Orders screen today renders from local mock files in `src/data/orders/*` — no database, no cart persistence, no money movement.
- Any Stripe integration, keys, or webhook endpoint.
- Entitlement engine, plan/fee configuration, admin permission tiers.

## Blocking decision: which Stripe integration

The requirements need Stripe Connect: connected merchant accounts, embedded onboarding/identity/banking components, application (platform) fees, transfers and payouts, plus Stripe Billing for Loumilab's own subscriptions.

Lovable's built-in seamless Stripe payments cannot do this — it is a single-seller integration with no Connect, no connected accounts, and no merchant payouts. So this build requires connecting your own Stripe account (secret key stored as a backend secret) with Connect enabled, in test mode first.

What is needed from you before Phase 2 begins:
- A Stripe account (test mode is fine to start) with Connect enabled.
- The test secret key, which I will store as a backend secret — never in frontend code.

Phase 1 below needs no Stripe key and can start immediately.

## Phase 1 — Pricing, plans, entitlements, Custom intake

1. Four public tiers on `/orders` pricing: Launch ($0 + 5%), Starter ($19/mo + 3.9%), Business ($49/mo + 2.9%), Custom (no price). Badge on Business is "Best for Growing Businesses" — no "Most Popular". No 10-product cap anywhere. CTAs: Start Selling / Choose Starter / Choose Business / Build With Loumilab (+ Request a Consultation).
2. Plans move out of code into a database table, so prices, platform percentages, annual pricing, features, badges, CTAs, order, and public/active flags are Super Admin editable without a deploy. Annual price and annual-billing on/off are configurable fields, seeded with roughly 1–2 months of savings as a suggestion only.
3. Centralized entitlement engine: a single module resolves a merchant's effective plan into named entitlements (`orders.scheduling`, `orders.delivery`, `discounts.enabled`, `analytics.level`, `branding.remove_loumilab`, `staff.max_users`, `exports.enabled`, ...). No `plan === "business"` checks in components.
4. Custom Project Intake at `/orders/custom` collecting every listed field, with secure attachment upload, rate limiting, admin email notification, and a Super Admin "Custom Projects" module with the lead pipeline statuses (New → Contacted → Discovery → Proposal → Approved → In Development → Completed / Declined).
5. Super Admin "Plans" and "Fees" modules: edit plans, set global platform percentages with future effective dates, and record every change to the audit log.
6. Audit log table plus admin permission roles (Super Admin, Finance, Merchant Support, Operations, Analyst) enforced database-side, so later phases write into an existing framework instead of retrofitting it.

At the end of Phase 1 the pricing, plan configuration, entitlements, lead capture, and admin governance layer are real. No button implies money has moved.

## Phase 2 — Merchants, storefronts, orders (no money yet)

Real tables for merchants, staff, stores, categories, products, variants, modifiers, availability, pickup settings, delivery settings, customers, addresses, orders, order items, discounts. The onboarding wizard, storefront, and merchant dashboard switch from mock data to the database. Order lifecycle statuses implemented with pickup/delivery-specific transitions. Strict per-merchant isolation enforced with row-level security, not hidden UI.

## Phase 3 — Stripe Connect and live checkout

Connected accounts with embedded onboarding, identity, banking and payout components inside Loumilab Orders ("Payments securely powered by Stripe"). Payout status states (Not Started → ... → Payout Enabled) gate order acceptance. Checkout with server-side money math: platform fee calculated on the discounted merchandise subtotal only, excluding tax and tips; tips and tax tracked separately; Stripe processing fee tracked separately from the Loumilab fee; full transaction breakdown persisted per order. Fee Strategy setting (merchant absorbs / customer pays where permitted / split by percentage) built as a configurable service-fee allocation, with payment-method surcharges disabled by default. Idempotent webhook processing with signature verification and a webhook event table.

## Phase 4 — Subscriptions, refunds, disputes, payouts

Stripe Billing for Starter/Business monthly and annual, with upgrade (immediate on confirmation), downgrade (end of period, admin-overridable), and cancellation that drops to Launch without deleting data. Refund-request workflow where merchants request and only Loumilab approves, with per-refund platform-fee retention decision and full economics shown before confirming. Dispute management with evidence upload and deadline alerts. Payout visibility. Merchant and admin notifications (in-app + email, SMS-ready).

## Phase 5 — Admin depth, reporting, launch gate

Remaining Super Admin modules (Merchants, Orders, Payments, Subscriptions, Revenue, Payouts, Refunds, Disputes, Promotions, Customers, Delivery, Support, Risk, Analytics, Stripe status, Webhooks, Audit Logs, System Settings), merchant-level fee overrides with reason/approval/expiry, Loumilab-funded promotions, secure "Support View" impersonation with banner and session logging, financial metrics (GMV, MRR/ARR, refund and dispute rates, churn), CSV exports, and a live-mode launch checklist that must pass before "Enable Live Payments" appears.

## Technical notes

- All money math, fee percentages, and entitlement checks resolve server-side in edge functions or database functions. Client-submitted prices, fees, or plan values are never authoritative.
- Every new public table gets explicit grants, row-level security, and policies scoped to merchant ownership or admin role; audit logs are insert-only for ordinary admins.
- Stripe secrets live only in backend secrets; webhook handlers verify signatures and dedupe on Stripe event ID so a repeated event cannot duplicate an order, fee, transfer, refund, or subscription.
- Existing auth, roles, admin shell, and email infrastructure are extended — no second auth or payment system.
- Test mode throughout; live mode stays off until the checklist passes.

## Confirm to start

Approve to begin Phase 1. In parallel, tell me when your Stripe account with Connect is ready so Phase 3 isn't blocked.
