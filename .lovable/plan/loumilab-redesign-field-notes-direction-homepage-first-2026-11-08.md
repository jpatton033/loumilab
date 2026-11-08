# Loumilab Redesign — "Field Notes" direction, homepage first

## Creative direction
A studio notebook come to life: warm paper backgrounds, deep forest and olive bands, sand accents, with Loumilab Blue kept as the main accent for buttons, links and the Blue Dot. Same logo. Feels like an evolution, not a new brand.

Palette: paper #F3EFE6, forest #2F3A2A, olive #6B7A4B, sand #C9B99A, Loumilab Blue #2563EB.

## Phase 1 (this pass): homepage + shared foundation
1. **New colors site-wide** — swap white/off-white for warm paper, charcoal dark bands become deep forest. Every page picks this up automatically, but only the homepage gets new layouts now.
2. **Homepage, rebuilt as a story:**
   - Opening: large headline with an art-directed photo that slowly unmasks as you scroll (image reveal), the Blue Dot landing as the full stop.
   - "Three ways we help" as an asymmetric, magazine-style spread instead of equal cards.
   - Pinned scroll sequence: Design, Build, Innovate, Secure — one word and image change as you scroll.
   - Products band in deep forest (Orders, Local) with images that drift slightly as you scroll.
   - Editorial strip for Knowledge Center and The Dot.
   - Closing invitation in forest with one "Start a Project" button.
3. **Imagery** — 5–6 new AI-generated, art-directed photos (warm, natural light, real-feeling workspaces and small businesses; consistent film-like grade). No stock-looking people shots.
4. **Navigation polish** — warmer dropdowns with a short line under each item.
5. **Search** — a proper search panel (press / or click the icon): searches pages, services, products, Knowledge Center articles and The Dot. issues, grouped results, keyboard friendly.
6. Motion stays calm, plays once, and turns off for visitors who prefer reduced motion.

Then you review before I continue.

## Later phases (after your review)
Solutions and service pages, Products, Companies, About/Contact, Knowledge Center, The Dot., remaining pages — each with its own personality inside the same system.

## Not changing
Logo, routes, forms, checkout, Orders setup, admin, SEO setup, backend.

## Technical details
- Update tokens in `src/index.css` / `tailwind.config.ts` (background, card, surface-inverse etc.); update memory visual-identity (warm palette replaces white).
- New homepage sections in `src/components/brand/story` extensions; scroll reveals via IntersectionObserver + CSS, sticky sequence with CSS position: sticky; reduced-motion respected; dot motion via existing `brand/dot`.
- Search: command-palette dialog (existing shadcn `cmdk`) over static data (navigation, services, products) plus a published-article/issue query; mounted in Navbar.
- Images generated into `src/assets/story/`, lazy-loaded.
- Verify at 390/768/1280, no overflow, no console errors.
