# Loumilab site-wide visual refinement: cinematic continuity

## Decisions you made
- **Colors:** the brief's palette applies to the whole site. Deep black becomes the main background. Midnight blue, forest green, dark teal, burgundy and copper show up as soft light and imagery, not as solid colored sections. This replaces the saved "off-white + black only" rule and the "rich colors only on Spaces" rule. Loumilab Blue stays reserved for the Blue Dot and small details.
- **Reading pages:** The Dot. and Knowledge Center articles keep a dark editorial top with a light, easy-to-read text area.
- **Imagery:** new AI photos only (no new films), one or two per major page. The homepage hero film stays as it is.

## What stays the same
- Homepage hero: same film, headline, buttons and menu behavior. The only change is how its bottom edge blends into the next section.
- Every page address, form, checkout, sign-in, store builder, calculator, dashboard, tracking tag, search listing and backend feature.
- Satoshi headlines (period in the headline color), Space Grotesk body text, no italics, no glass effects, no intro animation.
- Store builder, dashboards, checkout and admin keep their current plain look. No cinematic effects there.

## Site-wide visual system
- **Color:** new dark color names (obsidian, charcoal, midnight, forest, teal, burgundy, copper, warm ivory, soft white), added as shared settings so every page draws on the same set.
- **Atmosphere:** I'll take the soft-light pieces from Spaces (glows, chapters, framed scenes) and make shared Loumilab versions. Color moves between sections through overlapping light and photo edges, never through background color changes as you scroll.
- **Composition:** I'll add a few new layouts: full-width editorial image, large statement text, an off-center image-and-text pair, and a layered product view. These replace repeated two-column layouts and card grids.
- **Motion:** gentle parallax, image reveals and match-cut-style changes between images, built on the existing scroll-motion tools. No scroll hijacking, no repeated fade-ins, and it turns off when a visitor's device asks for reduced motion.
- **Navigation:** same structure and prominent "Start a Project" button, with the same hover and dropdown timing on every page.

## Homepage, section by section
1. Hero to content: the film's last colors (deep black with midnight/teal light) carry into the first section with no hard edge.
2. Technology Studio: website development, custom software, AI and automation, cybersecurity and workflow optimization shown as a large editorial list with architectural photos (no laptop photos).
3. Workflow Optimization gets its own feature: a visual of a tangled process turning into a clean one, with a short explanation.
4. Orders: "Less managing. More business." A business owner photo next to one well-designed product view, replacing the repeated phone screens.
5. Managed Business Technology: Business Email and Domains get their own section with a person-focused photo.
6. Products and companies: Orders, Local, Spaces and Vurtti in matching frames, each with its own accent. Nothing unreleased is described as available.
7. The Dot. and Knowledge Center: magazine-style layout with one consistent image treatment.
8. Closing: the "Start a Project" call to action, picking up colors from earlier sections.

## Other pages
- **Technology Studio pages** (services hub, development, software, AI, cybersecurity, workflow): photo opening, a large statement, a story-style section showing how we work, and clear explanations and buttons.
- **Business Email and Domains:** same visual language. Prices, terms and the order form stay clear and on plain backgrounds.
- **Orders, Local, Spaces and other product pages:** the shared atmosphere with each product's own accent. Pricing and the fee calculator stay easy to read.
- **About, Contact, Start a Project:** person-focused storytelling; forms stay on plain, readable backgrounds.
- **The Dot. and Knowledge Center:** dark editorial top pages and article lists, better category browsing, and a light reading area for articles.
- **All other public pages** (comparisons, legal, unsubscribe, status pages, etc.) get checked and brought in line.

## Photography
- Roughly 15–20 new AI photos: muralists, craftspeople, musicians, business owners, teams and architecture, set in city, suburban, rural, industrial and creative places.
- People of many backgrounds, ages, abilities and faiths, shown naturally, with no stereotypes and no group tied to one kind of job.
- No laptops, coffee cups, plants, staged offices or phone mockups as the main subject.
- Photos are compressed and sized for fast loading, as they are now.

## Rollout (continuing without re-asking, in this order)
1. Shared color and atmosphere system, plus the homepage.
2. Technology Studio pages, Workflow, Orders, Business Email and Domains.
3. Remaining public pages.
4. The Dot. and Knowledge Center.
5. A final check of every public page on computer, tablet and phone: overflow, contrast, keyboard use and reduced motion.

## Risks
- Dark backgrounds can make text hard to read (it has happened before). Every section will be checked on a computer and a phone for readable text.
- Pages with forms or prices could get harder to use, so those areas stay on plain backgrounds.
- Credits: new photos are needed for each phase. If credits run low, I'll reuse existing photos and tell you.

## Technical details
- Tokens: add `--obsidian`, `--charcoal`, `--midnight`, `--forest`, `--teal`, `--burgundy`, `--copper`, `--ivory` to `src/index.css` and `tailwind.config.ts`. Make the Spaces-only `--spaces-*` tokens point to these shared tokens, and keep the `dot` token separate.
- New `src/components/brand/atmosphere` (Glow, Chapter, EditorialImage, Statement, OffsetPair, LayeredProduct), generalized from `src/components/spaces/flow`. Motion reuses `story/Scene.tsx` `--p` utilities (transform/opacity/clip only).
- `PageHero` and `ToDark` updated so a page opens on a photo and blends into an atmospheric dark section.
- `Index.tsx` hero markup stays as is; only the gradient at its bottom edge changes.
- Article body wrapper stays on the light surface. Admin, the dashboard, `/orders/get-started`, checkout and the Spaces app are left alone.
- Update memory: the Core palette rule and the Spaces palette-scope rule in AGENTS.md.
