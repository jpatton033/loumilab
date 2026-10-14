# Roadmap

## The Dot. monitoring fixes
- [ ] Restore confirmed unpublishing without sending emails or clearing send history.
- [ ] Preserve safe editor formatting in public issues and verify both fixes.

## The Dot. editorial workspace
- [x] Mail-style issue desk, filters and persistent writing templates.
- [x] Shared rich text editing, safe legacy-compatible display and explicit save states.
- [x] Verify authenticated draft/template flows without broadcasting.

## The Dot. email refinements
- [x] Shorten issue emails to title, subtitle and full-issue link while preserving the brand frame.
- [x] Add the permanent subscription invitation to Mail preview and outgoing emails.
- [x] Verify rendered emails and send the two admin-only tests.

## Payments
- [ ] Complete the Stripe Connect platform profile (loss liability) in the Stripe dashboard — owner action, blocks merchant onboarding.
- [x] Admin readiness check that reports whether Stripe Connect onboarding can be handed to merchants.
- [x] Retry option for merchants while the platform profile is pending.
- [x] Real payout balance, schedule and transfer history on the merchant Payments & Payouts page.
- [x] "View in Stripe" link to the merchant's Stripe Express dashboard.

## Merchant dashboard
- [x] Live order queue with stage buttons, filters and real-time updates.
- [x] Headline metrics from real orders (today's revenue, orders, average order).
- [x] Analytics tab: 30-day revenue trend, best sellers, pickup vs delivery, returning customers.

## Merchant journey continuity
- [x] Wizard resumes at the first unfinished step; dashboard links deep-link to a step.
- [x] Payments setup happens inside the wizard and returns to the same step.
- [x] One publish control everywhere, with confirmation of the exact store link and an outstanding-items guard.
- [x] Store link element with view, preview, copy and share.
- [x] Store-created and store-published emails, each sent once.
- [x] Owner-aware storefront banner with publish and back-to-dashboard.
- [x] Mobile: sticky next-action bar, scrolling chip rows, full-width wizard buttons.

## Loumilab Local Importer
- [x] Pass 1: staging, CSV/manual/URL entry, duplicate + suppression checks, review queue, publishing, Unclaimed profile, claims, corrections/removals, sources registry, settings + kill switch.
- [x] Pass 2: website extraction via Firecrawl (local-import-run) + discovery leads
- [ ] Pass 3: budget dispatch, retention cleanup, freshness re-checks — depends on Pass 2.
