# Loumilab Orders — Product Page & Product Shells

Build Loumilab Orders as a real Loumilab product surface: a premium, mobile-first product page at `/orders`, plus front-end shells for onboarding, a merchant storefront, and a merchant dashboard. No database or payment work in this pass — everything runs on mock data through components designed to swap to live data later.

Positioning stays simple: **Create your store. Share your link. Take orders. Get paid.**

## What gets built

### Routes
```text
/orders                        product page (marketing)
/orders/get-started            merchant onboarding wizard (6 steps, mock)
/orders/dashboard              merchant dashboard shell (mock data)
/orders/store/:slug            dynamic storefront template (mock data, demo slug "sunday-kitchen")
```
One storefront template renders every merchant from data — no per-merchant pages, ever.

### `/orders` page sections
1. **Hero** — eyebrow "LOUMILAB ORDERS", headline "Your business. Your storefront. Your orders.", supporting copy, CTAs "Create Your Store" and "See How It Works". Phone mockup showing a sample storefront with subtle, looping order notifications (New Order — $24.00, Order #1042 Confirmed, Payment Received, Ready for Pickup).
2. **Social commerce** — "Your followers are already customers." with a scroll-animated flow: Social channels → Loumilab Orders store → Order + payment → Merchant dashboard.
3. **How it works** — the four numbered steps, revealed on scroll.
4. **Interactive storefront demo** — Sunday Kitchen (Baltimore, MD, "Accepting Orders") with Chicken Alfredo $18, Seafood Mac & Cheese $16, Honey Old Bay Wings $15. Add buttons update a live sample cart. No real transaction.
5. **Merchant dashboard showcase** — "Everything in one place." Desktop mockup with Today's Revenue $486.50, Orders 27, Average Order $18.02, and the order queue (#1048 Jordan M. $28.00 Preparing, #1049 Ashley T. $16.00 New, #1050 Marcus B. $42.00 Ready).
6. **Order lifecycle** — New → Confirmed → Preparing → Ready → Completed, animated on scroll.
7. **Built for social sellers** — six-card grid (Food Sellers, Pop-Ups, Creators, Local Businesses, Service Businesses, Side Hustles) with generated imagery and premium hover motion.
8. **Features** — ten-item grid covering storefront, product/menu management, payments-ready, dashboard, statuses, mobile management, pickup options, availability, notifications-ready, analytics.
9. **Customer journey** — cinematic phone-mockup scroll sequence from Instagram to order confirmation, carried visually rather than by copy.
10. **Pricing** — layout driven entirely by one config file supporting free / monthly / transaction-fee / premium combinations, with an editable "Start Selling" CTA. No billing logic.
11. **Final CTA** — "Stop taking orders through DMs." then the animated "Start taking Orders." and "Your storefront is only a few minutes away.", CTAs Create Your Store / Learn More, and a quiet "Orders by Loumilab" line.

### Onboarding shell (`/orders/get-started`)
Six steps — Create Account, Business Information, Order Settings (delivery marked "coming soon"), Add First Product, Store Preview, Publish. Progress indicator, local state only, live preview of the storefront in step 5, and a completion screen that links to the demo store and dashboard. Under five minutes to complete by design.

### Dashboard shell (`/orders/dashboard`)
Metric cards, an order queue with status controls that update locally, and status tabs (New / Confirmed / Preparing / Ready / Completed). Mobile-first: the queue reads as a touch-friendly card list on phones. Deliberately simple — not enterprise POS.

### Storefront template (`/orders/store/:slug`)
Store header (logo, name, location, accepting-orders badge, hours, pickup info), product grid with large images and thumb-sized Add buttons, a persistent unobtrusive cart bar, and a simple checkout summary screen. Loads fast, minimal navigation, near-app feel.

## Design

Premium, bright, minimal, product-led — Apple/Samsung storytelling without imitation. Existing Loumilab light tokens, Space Grotesk / Urbanist, oversized headlines, generous whitespace, rounded-3xl cards, hairline borders, soft shadows, subtle blue accent and gradient washes. No logo or brand changes. All motion uses the existing `Reveal` primitive and shared easing, and respects reduced motion.

Generated imagery: three dish photos for the demo storefront and six lifestyle images for the audience grid, art-directed bright and premium to match the site.

## Navigation

"Orders" becomes a top-level nav item — Services, Products, Orders, Work, About, Insights, Contact — while remaining inside the Products mega menu and the footer. Mobile nav gets the same entry.

## Security posture (architecture only)

Components are structured so merchant data access is server-authoritative later: slug-based public store reads separated from authenticated merchant writes, dashboard routes ready to sit behind the existing `ProtectedRoute` and role checks, all inputs validated at the form layer, and no secrets in front-end code. Payments will be handled by the provider — card data never touches Loumilab. No tables, policies, or keys are added now.

## Technical notes

- New data/config: `src/data/orders/storefronts.ts` (mock merchants + products), `src/data/orders/pricing.ts` (single source for plans), `src/data/orders/dashboard.ts`, `src/data/orders/audiences.ts`.
- New components under `src/components/orders/`: `PhoneFrame`, `StorefrontHeader`, `ProductCard`, `CartBar`, `OrderStatusBadge`, `OrderQueue`, `MetricCard`, `FlowDiagram`, `PricingTable`, `OnboardingStep`. These are the same components the real product will use.
- New pages: `src/pages/orders/GetStarted.tsx`, `Dashboard.tsx`, `Storefront.tsx`; `src/pages/Orders.tsx` rewritten.
- A small `useCart` hook holds demo cart state so it can later back real checkout.
- Edits: `src/App.tsx` (routes), `src/components/Navbar.tsx` and `Footer.tsx` (Orders link), `public/sitemap.xml` (`/orders/get-started`), `src/data/products.ts` (status/copy alignment). `robots.txt` disallows `/orders/dashboard`.
- SEO: unique title/description/canonical plus SoftwareApplication JSON-LD on `/orders`; onboarding, dashboard, and demo store are `noindex` while mock.
- Verified with desktop and mobile screenshots across all four routes.
