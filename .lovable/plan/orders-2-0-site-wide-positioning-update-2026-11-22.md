# Orders 2.0 — Site-Wide Positioning Update

Make "build and customize your own business website" the headline idea everywhere Orders appears, while keeping today's live prices, the "Get Started" button wording you confirmed, and everything merchants already use.

## Message used everywhere (natural variations, not repeated word-for-word)
- Positioning: "Your business. Your website. Your orders. One place."
- Four benefits: **Create** (no coding) · **Customize** (layout, colors, fonts, imagery, sections) · **Sell** (products or services, secure payments) · **Manage** (orders from one dashboard).
- Short description: "Build a customizable business website with integrated online ordering and payments."
- Tight spaces: "Custom Websites + Online Selling".

## Where it changes
1. **Main homepage, Orders & Local section** — new heading "Your business deserves a website that's yours." with supporting line; buttons "Get Started" and "Explore Orders". Replace the dashboard-style visual with a live, looping customization demo: pick a template, colors and fonts change, sections reorder, photos and products appear, finished site takes an order. Shows three distinct businesses (bakery, boutique, salon), not one template recolored. Other homepage sections untouched.
2. **Menus, Products page, product cards, search suggestions, footer** — new short/expanded Orders descriptions from one shared source.
3. **Orders page** — keep the new cinematic hero. Add a "What you can build" section after it: templates by industry, visual builder, section rearranging, colors/fonts/imagery, selling products or services, built-in orders. Custom domains shown with a "Coming soon" label (not live yet). Rewrite the three-step strip ("Build your menu / Share your link / Get paid") to website-first wording.
4. **Related services (light touch, only where relevant)**
   - Business Email: one line on pairing a branded email with an Orders website.
   - Domain search areas: "Connecting a domain to your Orders website is coming soon."
   - Technology Studio / Solutions: Orders as the ready-made option when a fully custom build isn't needed.
   - Workflow Optimization: one mention that Orders pairs a customer-facing site with order workflows.
5. **Supporting copy, FAQs, comparison page** — replace "ordering link / menu page" phrasing with the before→after examples from the brief. Historical articles and The Dot. issues are not touched.
6. **Search and sharing descriptions** — Orders, Products and homepage titles/descriptions updated (e.g. Orders: "Custom Business Websites with Online Ordering | Loumilab Orders").

## Kept as-is (needs your approval separately)
- Plan names Starter/Business/Premium and the live progressive fees stay. The proposed Launch/Build/Grow with 5% / 2.5% / 1.5% is not shown anywhere.
- Custom domains on every plan are not promised until that feature works.
- Main button stays "Get Started" and still opens setup before sign-up.

## Technical details
- Central copy in `src/data/products.ts` (tagline/expanded/short) and a new `src/data/orders/positioning.ts` (benefits, before/after strings) consumed by navigation, Products, SiteSearch, Footer, Index, Orders, comparisons.
- Homepage demo: new `src/components/orders/showcase/CustomizeDemo.tsx` rendering the real storefront renderer with three sample designs; transform/opacity only, pause control, reduced-motion shows the finished state, paused offscreen.
- Orders "What you can build" section reuses brand flow components; `Coming soon` badge for domains.
- SEO: update `SEOHead` props and `scripts/prerender-heads.ts` staticMeta for `/`, `/orders`, `/products`.
- Verify with Playwright at 390 / 778 / 1280px; click every changed button/link; grep for leftover "ordering link"/"digital menu" phrasing in public pages.
