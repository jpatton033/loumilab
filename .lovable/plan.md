# Loumilab homepage refresh, in the style of Apple.com

Rebuild only the main homepage in the Apple.com style. It becomes a series of large, centered sections that each fill the screen, with short headlines, two quiet links ("Explore" and "Learn more"), and strong photography. Orders, Local and every other page stay as they are. The light theme, fonts and Loumilab Blue also stay.

## What Apple.com does that we'll borrow
- One idea per section. Each opens with a large centered headline and one sentence under it, followed by two text links (filled blue for the main one, outlined for the second).
- Full-width "product tiles" stacked one after another, then a two-by-two grid of smaller tiles.
- Very little body copy. The photos carry the story.
- Soft fade-in as each section scrolls into view, and nothing moves on its own.
- Generous spacing, slim gaps between tiles, and rounded corners on the grid tiles only.

## New homepage order
1. **Hero.** Centered "We build what's next." with one line about what Loumilab does and two actions: Start a project and Explore products. A large photo of people building something sits below it. The hero slides you manage in Admin stay available, shown as a slim strip under the photo instead of taking over the hero.
2. **Loumilab Orders tile.** Full width, warm and merchant-focused. "Sell anywhere. Take orders in one place." with Explore Orders and See pricing, over the baker and kitchen photos.
3. **Loumilab Local tile.** Full width, community-focused. "Discover what's cooking near you." with Explore Local and List your business, over the market photo.
4. **Statement.** "Technology should move businesses forward." in large type on a plain background, as a breathing moment.
5. **Two-by-two grid** for capabilities, written as outcomes: Design (products people enjoy), Build (software that holds up), Innovate (new ideas, shipped), Secure (security from day one). Each tile gets its own photo or a simple visual, plus a Learn more link to Services.
6. **People sequence.** A swipeable row of founders, teams and makers. It reuses the story row already built.
7. **Vurtti and What's next.** Two half-width tiles: Vurtti (a Loumilab company, opens its own site) and "We're always building."
8. **Resources.** Three recent articles in an editorial layout with large titles, plus "Visit Resources".
9. **Closing.** "Have something worth building?" with Start a project and Contact.

The previous homepage sections (brand statement, philosophy, About teaser, the duplicate photo split) are folded into the sections above, so nothing reads twice.

## Navigation and footer
- The navigation gets an Apple-like Products menu, with Orders and Local shown side by side as part of one Loumilab family. Services, Resources and Contact stay.
- The footer stays the same, plus a Local link if it's missing.

## Photos
Reuse the photos we already have. Add about 3 new ones: a hero team-building scene, a creative professional at work, and a security/engineering moment for the grid. All load as you scroll, except the hero photo, which loads first so the page opens quickly.

## Phones and tablets
Tiles stack, headlines scale down but stay large, and the two links stay side by side. Photos crop taller on phones, and the grid becomes one column.

## Checks
Screenshots at phone, tablet and desktop widths. I'll also check hover and focus states, reduced-motion settings, and that the hero still loads quickly.

All new headlines are drafts for you to review.

## Technical details
- New `src/components/brand/apple/ProductTile.tsx` (full-bleed tile: eyebrow, headline, line, two CTAs, image, tone variant) and `GridTile.tsx`, built on top of `src/components/brand/story`.
- Rewrite of the composition in `src/pages/Index.tsx`. `ProductShowcaseHero` is kept, but rendered as the compact strip under the new hero, so the admin hero data stays in use.
- Resources section uses the existing `usePublishedArticles` query (limit 3).
- `Navbar.tsx` Products menu: Orders and Local listed side by side, using `src/data/products.ts` (add Local there if it's missing).
- Frontend only. AGENTS.md gets a rule that homepage product tiles use the shared tile components.
