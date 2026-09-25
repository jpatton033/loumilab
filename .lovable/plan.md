# SEO review: Loumilab and Loumilab Orders

## What the review found

The basic checks all pass. The home page is reachable, search engines see fully rendered pages, robots.txt and the sitemap are valid, the title, description, social preview and site icon are set, and Google Search Console is verified.

Private Orders pages (dashboard, receipts, quotes, invoices, the custom-request confirmation) are already hidden from search.

The gaps are mostly in Orders. Search engines aren't being shown several public Orders pages, and Orders gives them less detail than it could.

1. **Sitemap is missing Orders pages.** "Get started", "Custom build", Orders Terms, Orders Privacy, published merchant storefronts and Knowledge Center articles aren't listed. Only /orders is.
2. **Merchant storefronts have no business details for search.** Each live store has a title and description, but nothing tells Google it's a local business that takes orders, where it is, or what it sells.
3. **The Orders product description has no pricing.** It never mentions the Free plan or the paid plans, so Google can't show "Free" or prices in results.
4. **Legal page titles are generic.** Orders Terms and Privacy appear as "Terms & Conditions — Loumilab", which reads like the studio's terms, not the Orders product's.
5. **Robots file doesn't block the private Orders pages.** They are hidden page by page, but crawlers still waste visits on them. Also, "/insights" is blocked by a rule that's no longer needed.
6. **The AI-assistant summary (llms.txt) lists only the Orders homepage.** It doesn't mention getting started, pricing or the Terms and Privacy pages.
7. **The Orders homepage has no breadcrumb trail for search results** (Loumilab > Orders), and neither do storefronts.

## What I'll change

- Generate the sitemap automatically on every build. It will include all public pages, every published and live storefront, and every published Knowledge Center article, so new stores and articles show up without manual edits.
- Add business details to each live storefront for search engines: name, location, a "place an order" link and menu items. Paused stores stay hidden from search, as they are now.
- Add Free and paid plan pricing to the Orders product details, using the same pricing the pricing table shows.
- Rename the Orders legal pages to "Loumilab Orders Terms & Conditions" and "Loumilab Orders Privacy Policy".
- Add breadcrumbs to the Orders homepage, Get started, and storefront pages.
- Tidy robots.txt: block the Orders dashboard, receipt, quote and invoice links, and admin. Keep everything public open.
- Expand llms.txt with the public Orders pages.

Not included: rewriting marketing copy or keyword research. I can do those next with keyword data if you want.

These changes reach loumilab.com the next time you publish.

## Technical details

- `scripts/generate-sitemap.ts` runs from `predev` and `prebuild`. It keeps the static routes, then uses the public client to pull published storefront slugs (the same filter as the public store view) and published `kc_articles` slugs. It writes `public/sitemap.xml`. `lastmod` comes only from each row's own `updated_at`. Static entries have none.
- Storefront.tsx: pass `jsonLd` with `[LocalBusiness/Restaurant (by industry) {name, description, address locality from location, url, potentialAction OrderAction}, BreadcrumbList]` only when the store is public.
- Orders.tsx `ordersJsonLd`: add an `offers` array built from `src/data/orders/pricing.ts`, plus a BreadcrumbList.
- Legal.tsx: build the title from a product-specific label.
- robots.txt: add `Disallow: /orders/dashboard`, `/orders/receipt/`, `/orders/quote/`, `/orders/invoice/`, `/sign-out` and `/reset-password`. Remove `/insights`. Keep the `Sitemap:` line.
- Afterward, run a new SEO scan and check the generated sitemap output.
