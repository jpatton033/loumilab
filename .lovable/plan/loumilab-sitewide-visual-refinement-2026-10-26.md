# Loumilab sitewide visual refinement

Extend the new homepage look (Inter Tight headlines, centered heroes, black type) to every public page. Visual only: no changes to prices, fees, promotions, checkout, the store builder, Local sign-up, logins, newsletter, forms, tracking, published content or web addresses.

## Changes to saved rules
- Text goes from soft charcoal to near-black (#111111). Secondary text darkens to about #4A4A4A. The off-white background becomes a warm #F7F7F5 and borders a neutral #E5E5E5. Dark sections use #111111. Loumilab Blue stays as it is.
- Headings everywhere switch to the homepage headline font (Inter Tight), medium to semibold, all in one color. No blue or gradient words or punctuation in headings.
- Cards get smaller corners (about 16px instead of 24px), fewer shadows and plain thin borders. Buttons get one shared height and shape.
- The saved Visual Identity rules will be updated to match.

## Phase 1: Shared foundation
- Update the color, heading, button, card and form styles in one place so every page picks them up. Then review each page, so nothing that relied on the old colors looks wrong.
- One heading size ladder: hero 56–72px, section 36–48px, subheading 22–28px, body 16–18px. Phones scale down.
- One shared centered hero, based on the homepage, for the main landing pages.
- Cut back decorative dots and lines and blue headline punctuation, outside the logo. The dot stays in at most one quiet spot per page.
- Header: check that it matches on every public page. Footer: clearer headings, darker links, even spacing. Comparison pages stay out of the footer's Products column.

## Phase 2: Orders (priority 1)
- Hero: centered, black headline, tighter spacing, fewer decorations. The slideshow stays, restyled. Build Your Store stays the main button, and building a store before sign-up stays up front.
- Product screens: replace the repeated phone mockups with real screenshots in simple, consistent frames. These come from a demo store (the builder, a published storefront, the order dashboard, industry examples). A real customer store is used only with your OK.
- Features: fewer repeated cards and alternating text and screenshot sections. "Less managing. More business." and "Transparent. First and Always." are kept.
- Pricing and the pricing page: cards line up evenly, stronger text, a clear but quiet recommended plan, and a plain split between Loumilab's fee and card processing. All numbers come from the same source as now.
- The comparison and Business Tools pages get the same restyle.

## Phase 3: Services and Managed Business Technology
- The four service pages and the Domains page keep one shared order: hero, benefits, examples, process, questions, closing. They mix layouts, with alternating image and text sections and a dark process band, instead of identical card grids.
- Business Email: clear sections for what you get, what we handle, how setup works, what you pay (provider costs vs. Loumilab fees) and ongoing support.
- A small set of new photos for the service pages, showing varied people in real work settings. Each photo needs your approval.

## Phase 4: Local, Products, editorial and supporting pages
- Local: a cleaner search and category row, refined listing cards, and a clear split between finding businesses and listing your business for free.
- Products, About, Contact, How We Work, Work: the same hero, type and spacing.
- Resources: black headings, clearer card text, a better search and topic row, an even reading width.
- The Dot.: keeps its own publication feel, with better type and spacing and fewer banners and animations.

## Phase 5: Checks
- Screenshots of every changed page at 390, 768 and 1280px: no sideways scrolling, no clipped text, no awkward breaks.
- Check contrast and keyboard focus, and that motion turns off with reduced motion.
- Confirm that the store builder, contact form, newsletter signup, Local listing form and Business Email order still work, and that page titles still show.

## Needs your approval
- Real customer stores in screenshots (otherwise a demo store is used).
- New service photography.

## Technical details
- Tokens in `src/index.css` / `tailwind.config.ts`: `--foreground` 0 0% 7%, `--muted-foreground` 0 0% 29%, `--surface-subtle` 60 9% 97%, `--border` 0 0% 90%, `--surface-inverse` 0 0% 7%. `--radius` and a `.card-flat` utility are refined, and `h1–h3` use `font-headline` (Inter Tight).
- Button and Card variants are refined in `src/components/ui`, and the dashboard/admin are checked for regressions because they share the tokens.
- A new `FlowHero` centered variant becomes the shared landing hero. Screenshot frames go in `src/components/brand/flow`.
- Screenshots are captured from the demo store with Playwright and saved as optimized `.jpg` files in `src/assets/orders/screens/`.
- Remove blue heading punctuation and extra `DotMarker`/`DotThread` uses, and update the dot motion rule in AGENTS.md.
- Front end only.
