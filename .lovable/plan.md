# Loumilab Orders — Merchant Journey Refinement

A refinement pass on the existing merchant experience: same visual identity, navigation, plans and pricing. The goal is one continuous, understandable path from registering to publishing, with the industry adapting the wording rather than duplicating the system.

## What exists today (verified)

- `/orders/get-started` is an 8-step wizard (industry, purchase models, business info, store details, catalog, hours, plan, review) that saves a browser draft and only creates real records at the very end, after a sign-in detour.
- The final button says "Publish store" but actually creates a draft; `merchant_storefronts.is_published` is a single boolean, and a database trigger flips it (and `merchants.accepting_orders`) to true automatically once Stripe payouts are enabled.
- `StorePanel` exposes a raw "Published" switch, so an empty store can be made public.
- The dashboard shows demo metrics and a demo order queue, links "View storefront" to the demo store, and has no setup progress at all.
- Payments/payouts already work correctly through Stripe Connect Express — Loumilab never stores bank details. That stays as-is.
- `logo_url` exists on storefronts and `image_url` on products, but there is no upload UI and no storage bucket for merchant branding.
- Catalog editing requires a price above zero, which blocks quote-priced services.
- Industry terminology, modules and workflow already resolve from `orders_industries`. This is the mechanism the whole refinement builds on.

## The refined journey

```text
Register  ->  Set up store  ->  Ready to publish  ->  Published
(account)     (guided steps)    (merchant clicks)     (live, pausable)
```

### 1. Registration first

Account creation moves to the front of `/orders/get-started`. An unauthenticated visitor sees a short "Create your merchant account" step (email/password plus Google, reusing the existing sign-in flow) before the wizard. From then on every answer saves to their merchant record, so they can leave and resume from the dashboard instead of relying on the browser draft. Existing signed-in merchants skip straight into setup with their saved answers loaded.

### 2. Welcome email

The moment the merchant account is created, Loumilab Orders sends one short branded email: welcome, registration confirmed, the three next steps (add what you sell, connect payments, publish), a button back to the dashboard, and a clear line that the storefront is not publicly visible until setup is finished and they publish. Built with the existing Loumilab Orders email shell so it matches receipts and estimates.

### 3. Setup steps

The wizard keeps its current look, order and preview, with these additions and label changes:

- Industry and how customers buy — unchanged.
- Business information — unchanged.
- Store details — plus **store branding**: logo upload with live preview in the phone frame, falling back to the existing monogram.
- What you sell — industry-worded (Menu items, Products, Services, Packages, Appointments), with an image per item and prices optional where the industry quotes each job.
- Fulfilment preferences — pickup and/or delivery with fee and minimum for industries that deliver; service address and scheduling wording for trades. Only the options that apply to the chosen industry appear.
- Payments — starts Stripe Connect setup from inside the wizard, and can be resumed on the dashboard.
- Plan — unchanged, still read from the database.
- Preview and finish — full storefront preview exactly as a customer will see it, then a checklist of what's still outstanding and a **Publish** button that is only enabled when everything required is done.

Step chips show completed, current and remaining, and the merchant can jump back to any completed step.

### 4. Store status

`is_published` is replaced by an explicit lifecycle so the dashboard and Super Admin can describe a store honestly:

- **Setup incomplete** — missing details, catalog or payments. Not public.
- **Ready to publish** — everything required is done, merchant hasn't launched yet. Not public.
- **Published** — publicly visible and taking orders.
- **Paused** — merchant temporarily closed it; the page explains it's not accepting orders right now.
- **Restricted** — payouts became disabled or the account needs attention; publishing is blocked until resolved.

Publishing becomes a deliberate merchant action rather than an automatic side effect of Stripe approval, and the raw switch in the store panel is replaced by a publish/pause control that states the reason when it can't be used. A store already live stays live.

### 5. Dashboard setup panel

A single card at the top of the merchant dashboard, in the existing card style, showing store status and the outstanding items with a link straight to each one: business details, branding, what you sell, payments and payouts, fulfilment, publish. Once everything is green the card collapses into a one-line status with a publish or view-store action. Payments readiness is described in plain language ("Payouts active", "A few details still needed") with the existing Stripe link for anything technical. The dashboard also stops pointing at the demo store and uses the merchant's real storefront and real orders when they have them.

### 6. Products and services across industries

One catalog system, industry-adapted rather than duplicated: the item form's labels, price behaviour and fields resolve from the industry config, images upload to the same bucket for every type, and food keeps its polished menu presentation. Nothing industry-specific is hardcoded, so adding an industry stays a database row.

## Scalability

The merchant-to-storefront relationship stays one-to-many in the schema so additional locations, fulfilment methods and plan capabilities can be added later, but the interface continues to show a single store because that's all that is supported today.

## Preserved as-is

Authentication and roles, merchant ownership and data isolation, the Stripe Connect integration and fee logic, existing customer ordering and checkout, receipts, estimates and invoices, subscription tiers and pricing, Super Admin controls, and mobile responsiveness.

## Technical notes

- Migration: add a `storefront_status` enum plus column to `merchant_storefronts`, backfilled from `is_published`; keep `is_published` in sync for existing readers. Adjust `sync_accepting_orders_on_payout_change` so enabling payouts moves a store to "ready to publish" (not live) and losing payouts moves a published store to "restricted", while leaving `accepting_orders` behaviour intact. Add a `merchant-media` storage bucket with owner-scoped policies for logos and item images.
- New `supabase/functions/orders-merchant-welcome` using `_shared/notify.ts`; triggered on merchant record creation from the wizard.
- Refactor `src/pages/orders/GetStarted.tsx` into a step-per-file structure under `src/components/orders/onboarding/`, with progress persisted through a `useMerchantSetup` hook rather than only `sessionStorage`.
- New `src/lib/orders/setup.ts` computing the checklist and derived status from merchant, storefront, catalog and Stripe rows — one source of truth shared by the wizard, the dashboard panel and the publish guard.
- Extend `store-admin.ts` with logo/image upload helpers, optional pricing, and a `publishStorefront` / `pauseStorefront` mutation that re-checks requirements server-side.
- Verify with desktop and mobile screenshots of the full journey for a food merchant and a trades merchant, plus a check that the demo storefront, existing customer checkout and the payouts panel are unchanged.
