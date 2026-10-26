# Squarespace-style flow and experience, site wide

Borrow four things from the Squarespace vs. Square page across the whole site: comparison pages, its page flow, its visual style, and one clear action per page. The light theme, fonts, Loumilab Blue, no-glass rule and all working features stay the same.

## 1. Page flow (every main page)
Each main page follows one order:
1. Big headline, one short sentence, one main button.
2. A large product or people image right under it.
3. Three short benefit blocks (a headline and 1–2 lines each).
4. Details: features, pricing, proof.
5. A closing band that repeats the same main button.

Pages: Home, Services, Business Email, Products, Orders, Orders Pricing, Local, Work, About, How We Work, Resources hub, The Dot. hub, Contact.

## 2. Fewer choices
- One main button per page, with at most one quieter text link next to it.
  - Main site: "Start a Project".
  - Orders: "Build your free store".
  - Local: "List your business".
  - Business Email: "Get started".
- Repeated or competing buttons in the middle of pages become plain text links.

## 3. Visual style
- Bigger, bolder headlines with more white space between sections.
- Wide, rounded product images and screenshots, like the Squarespace editor image.
- Simple, even benefit blocks with no busy card decoration.
- Menu and footer stay as they are, apart from the comparison links below.

## 4. Comparison pages
- New pages at `/orders/compare/<competitor>`, each titled "Loumilab Orders vs. X". Every page has a headline, three benefit blocks, a side-by-side table (pricing, setup, platform fees, online ordering, scheduling, calendar sync, messaging, payouts, support), a short FAQ and a "Build your free store" button.
- Proposed first set: **Square, Shopify, Toast**. Tell me if you want a different set.
- Competitor facts are checked against their public pricing pages at build time. Each page shows a "Last checked" date and a short note that it is an independent comparison.
- Linked from the Orders page, the Orders pricing page and the footer. Added to search engine listings.

## 5. Checks
- Screenshots at phone, tablet and desktop widths for each page that changes.
- Confirm every page has one main button and that every existing link and form still works.
- The homepage still loads quickly.

## Technical details
- New `src/components/brand/flow/` with `FlowHero`, `BenefitTrio`, `ClosingCta`, and `src/components/orders/compare/CompareTable.tsx`. These sit alongside the existing story, Tiles and PhotoSplit pieces and do not replace them.
- Competitor data lives in `src/data/orders/competitors.ts` (fields, sources, checked date) and is rendered by one route: `src/pages/orders/Compare.tsx`.
- Routes go in `App.tsx`. SEO goes through SEOHead, and comparison routes are added to `scripts/prerender-heads.ts` and `generate-sitemap`.
- Small type and spacing tokens go in `src/index.css` and `tailwind.config.ts`.
- Front end only: no database or backend changes. Prices and fees always come from the existing shared fee and plan sources.
