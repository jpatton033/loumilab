# Loumilab Orders — Multi-Industry Expansion + Tier Restructure

Loumilab Orders becomes industry-adaptive: one platform where the selected industry changes terminology, modules and workflow, and the plan tier changes how much functionality is available. Food stays the flagship and the marketing focus.

## What the audit found

Confirmed by reading the database and code before writing this plan:

- Public plans today are **Launch ($0 + 5%), Starter ($19/mo + 3.9%), Business ($49/mo + 2.9%), Custom (no price, "Custom agreement")**. Business already carries the badge "Best for Growing Businesses".
- `orders_plans` already stores prices, fees, features, entitlements, badges and CTAs, and `/admin/plans` already edits them. `src/lib/orders/entitlements.ts` already resolves entitlements from a plan row.
- `merchants` already has `business_type` (free text, used only by the custom-project lead form) and `plan_slug`. There is no industry table.
- Merchant storefronts, the merchant dashboard and the order queue still render from mock files (`src/data/orders/storefronts.ts`, `dashboard.ts`). Real merchants, Stripe Connect accounts, plans, audit logs and the admin shell are database-backed.
- No products, services, jobs, quotes, invoices, appointments or payments tables exist yet.

## Tier rename (fees preserved exactly)

Names shift up one step; the fee attached to each price point does not change.

```text
Launch    $0   + 5%    ->  Starter   $0   + 5%
Starter   $19  + 3.9%  ->  Business  $19  + 3.9%
Business  $49  + 2.9%  ->  Premium   $49  + 2.9%
Custom    Custom agreement (unchanged, stays for enterprise/bespoke)
```

Slugs stay as they are (`launch`, `starter`, `business`, `custom`) so existing merchant records, Stripe product/price links and subscription rows keep pointing at the same plan. Only the display name, positioning, badge, feature list and entitlements change. "Best for Growing Businesses" moves to the $19 Business tier as the recommended plan; Premium gets the advanced feature set.

Feature lists and entitlements are rewritten to match the three-tier spec (Starter essentials, Business full operations, Premium staff/permissions/automation), all as data in `orders_plans` — no fee percentage is hard-coded in components.

## Industries

New `orders_industries` table, Super Admin managed: name, slug, icon, description, ordering, active flag, plus a config blob holding terminology, default modules and workflow stages. Seeded with the full list, food-related industries first: Food & Catering, Restaurant / Food Service, Bakery / Desserts, then Electrician, Plumbing, Cleaning, Landscaping, Handyman, Beauty / Barber, Automotive / Mobile, Photography / Creative, Retail / Custom Products, Professional Services, Other.

Each industry config carries:

- **Terminology** — Menu vs Services vs Products, Order vs Job, Preparation Time vs Appointment, Special Instructions vs Job Notes, Pickup vs Service Address.
- **Modules** — which dashboard and storefront sections are relevant.
- **Workflow** — the stage list, e.g. food `New → Confirmed → Preparing → Ready → Completed`; trades `Request → Estimate → Approved → Deposit → Scheduled → In Progress → Invoiced → Completed`.

`merchants` gains `industry_slug` (defaulting existing merchants to Food & Catering) and `purchase_models` for the hybrid question (products, services, appointments, custom quotes, recurring, combination). Adding HVAC, pest control, tutoring and similar later is a row plus config — no new code.

## Onboarding

An industry step goes in near the beginning, before business details, with food options first and Food & Catering preselected. A second question captures how customers purchase. Every later step then renders industry-correct labels — an electrician never sees "Menu" or "Preparation time". The plan picker reads the renamed tiers from the database instead of the static mirror file.

## Adaptive dashboard and storefront

Same visual design, same components, same branding — labels and section sets resolve from the industry config, and availability resolves from entitlements:

- Food: Orders | Menu | Customers | Payments | Analytics
- Trades/home services: Jobs | Services | Customers | Schedule | Estimates | Payments | Analytics
- Hybrid: Orders | Jobs | Products & Services | Customers | Schedule | Payments | Analytics

Storefront likewise: Menu / Order / Pickup for food, Services / Request Service / Get an Estimate / Book for trades, Services / Book / Property Details / Schedule for cleaning. The existing food storefront and demo store keep working exactly as they do now.

Locked capabilities are shown, not hidden — a tasteful inline state ("Estimates are available with Loumilab Business...") using existing type and surface tokens. No popups.

## Quotes, estimates, deposits and invoices — functional

Because these are requested as working features, this pass adds the minimum real commerce spine for the service side:

- `merchant_services` (catalog of products or services, industry-neutral), `merchant_jobs` (a transaction/job with workflow status, customer, address, notes, attachments), `merchant_quotes` (line items, totals, expiry, customer approval), `merchant_invoices` (deposit and remaining balance), and `merchant_customers`.
- Customer-facing request → quote → approve flow on the storefront; merchant-facing create quote → send → track approval → collect deposit → schedule → invoice balance in the dashboard.
- Deposits and balance payments run through the existing Stripe Connect setup as destination charges with the platform fee resolved server-side from the merchant's plan row. Fees are never taken from client-submitted amounts.
- Every table gets explicit grants, row-level security scoped to merchant ownership, plus staff/admin read paths.

Food ordering stays on its current mock flow in this pass — nothing about existing food storefronts, orders, pickup/delivery or Stripe changes.

## Super Admin

- New **Industries** module: add, rename, reorder, activate/deactivate, set icon, description, default modules, terminology and workflow.
- **Plans & Fees** extended with the new entitlement fields: scheduling, quotes, deposits, invoicing, recurring, promotions, analytics level, staff limits, role permissions, custom workflows, branding level, priority support, product/service limits.
- All industry and plan edits write to the existing audit log.

## Homepage and marketing

Food remains dominant. `/orders` keeps its hero, imagery and audience grid; one subtle supporting line is added ("Built for food sellers. Ready for your business.") and the audience grid gains service-business entries positioned below the food ones. The pricing comparison table is rebuilt against the new three tiers in the existing visual style, reading rows from plan entitlements.

## Technical notes

- Migrations: `orders_industries`, `merchants.industry_slug` + `purchase_models`, plan row updates (names, badges, features, entitlements — fees untouched), and the service commerce tables with grants, RLS and updated-at triggers.
- New `src/lib/orders/industries.ts` (industry queries + terminology resolver) and a `useIndustryTerms()` hook. `entitlements.ts` extends its key list; access resolves as industry config × plan entitlements, never `plan === "business"`.
- `src/data/orders/pricing.ts` static mirror is reduced to copy only, or removed once onboarding reads plans from the database, so tier names live in one place.
- Money math, fee percentages and entitlement enforcement resolve server-side in edge functions from the plan row.
- Verified after build with desktop and mobile screenshots for the six combinations (Food and Electrician on each of Starter, Business, Premium), plus a check that the existing demo food storefront, dashboard and Stripe payout panel are unchanged.

## Sequence

1. Industry table, merchant columns, plan rename + entitlement rewrite (migration).
2. Terminology/entitlement engine and upgrade-prompt component.
3. Onboarding industry + purchase-model steps.
4. Adaptive dashboard and storefront.
5. Service commerce spine: services, jobs, quotes, deposits, invoices with Stripe.
6. Super Admin Industries + extended Plans, pricing comparison, marketing copy.
7. Test matrix and mobile verification.
