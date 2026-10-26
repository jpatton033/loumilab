# Footer: cleaner Products column

## What changes
**Products column** shows only Loumilab's own products, each linking to its main page:
- Loumilab Orders: /orders
- Loumilab Local: /orders/local
- Vurtti: its existing outside site
- "All products" (/products) at the end

Removed from this column:
- The three "Orders vs. Square / Shopify / Toast" links.
- "Free Business Tools", which already appears under Resources. This removes the duplicate.

**Comparison pages stay where they are.** Their web addresses, search titles and descriptions, and sitemap entries don't change. They can still be reached from:
- The Orders pricing page, through its "Compare: vs. Square · vs. Shopify · vs. Toast" line, unchanged.
- Each comparison page, through its "Also compare" links, unchanged.
- The Orders homepage closing section. The single "Compare Orders vs. Square" link becomes a quiet line: "Compare alternatives: Square · Shopify · Toast".

**Rest of the footer, reviewed:** brand and email, Technology Studio, Managed Business Technology, Products, Resources, Company, plus the bottom row with Terms, Privacy and Cookie settings. The grouping already matches the redesign, so only the Products column changes. Phone, tablet and desktop use the same columns.

The top menu, tracking and product features are not touched.

## Checks
- Footer screenshots at 390px and 1280px.
- Confirm the comparison pages still load and the Orders page line works.

## Technical details
- `src/components/Footer.tsx`: remove the `compare` array. The Products column uses `navMenus` product items without Business Tools, plus the menu's own `footer` link ("View all products", shown as "All products").
- `src/pages/Orders.tsx`: closing section link becomes three links built from `src/data/orders/competitors.ts`.
- No changes to the sitemap, the prerender list, or SEO.
