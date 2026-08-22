# Loumilab Brand Evolution & Website Redesign

Evolve Loumilab from a web-development agency site into a light, premium **digital product & technology studio** site with a scalable product ecosystem (Vurtti as a Loumilab company, Loumilab Orders as an in-house product).

Confirmed decisions: Vurtti links to `https://www.vurttidocs.com`; the full site converts to the new light theme in this pass; the saved "dark luxurious" brand rule is replaced by the new light palette.

## 1. Design system (light evolution)

- Rewrite the token layer in `src/index.css` + `tailwind.config.ts`: white / off-white / very light gray surfaces, deep charcoal typography, existing Loumilab blue accent used sparingly, soft shadows, subtle gradients, rounded containers.
- Keep Space Grotesk / Urbanist typography and the existing logo — this reads as an evolution, not a new company.
- Dark styling remains only for the admin dashboard area.
- Reusable primitives: `Container`, `SectionHeader`, `Eyebrow`, `ProductCard`, `CapabilityCard`, `CaseStudyCard`, `Badge`, button variants (primary charcoal, secondary outline, ghost), `Reveal` motion wrapper.

## 2. Remove the loading screen

- Delete `IntroAnimation.tsx` and its mount. Visitors land straight on the homepage.
- The "Powered by Loumilab" idea survives only as a fast, subtle hero text reveal — nothing that gates or delays rendering.

## 3. Navigation + Products mega menu

- Nav: logo (left) → Services, Products, Work, About, Insights, Contact → "Start a Project" CTA (right).
- Logo returns to `/`; on the homepage it smooth-scrolls to top.
- Products mega menu driven by a single data file (`src/data/products.ts`) with two groups:
  - **Built by Loumilab** — Loumilab Orders → `/orders`
  - **Loumilab Companies** — Vurtti → `https://www.vurttidocs.com` (external-link icon, new tab)
- Adding a future product = one entry in that file; menu, footer, and product sections all read from it.
- Accessible: keyboard operable, focus-visible rings, ARIA menu semantics, mobile accordion variant.

## 4. Homepage

Sections in order:

1. **Hero** — "We Build What's Next." + "Loumilab designs, builds, launches, and secures digital products and technology businesses." CTAs: Explore Loumilab (primary), Start a Project (secondary). Behind it: a lightweight CSS/SVG technical motif (grid, soft gradient wash, subtle node lines) — no stock photography, no new 3D dependency on mobile.
2. **Brand statement** — editorial type: "More than a digital agency." + supporting copy, then the scroll-revealed sequence **Design. Build. Launch. Secure.**
3. **What Loumilab Does** — four capability cards: DESIGN / BUILD / INNOVATE / SECURE with the supplied concise copy.
4. **Built by Loumilab** — "We don't just build technology for clients. We build our own." Large cards: Vurtti (Compliance Technology, "A Loumilab Company", Visit Vurtti ↗) and Loumilab Orders ("Sell anywhere. Take orders in one place.", Explore Orders →), plus a quiet third "What's Next — We're always building." card.
5. **Technology philosophy** — "Technology should solve something." typography-only section.
6. **About teaser** — technology partner *and* product builder.
7. **Conversion** — "Have something worth building?" / "Let's turn the idea into something real." Start a Project + Contact Loumilab.

## 5. Loumilab Orders

- New route `/orders` with a product landing page: product hero, feature grid, how-it-works, and a "Join the waitlist / Contact" CTA that reuses the existing contact flow.
- Routing structured so `/orders/pricing`, `/features`, `/demo`, `/login`, `/signup` can be added later as nested routes; those pages are **not** built now and no backend work is added.
- Orders gets a light sub-brand accent while staying visibly inside the Loumilab system.

## 6. Existing pages

- `/services` — reorganized around Design / Build / Innovate / Secure, keeping the current service detail and ongoing-partnership content.
- `/work` — "Selected Work" with large case-study cards and category filters (Websites, Software, Digital Products, Automation, Consulting, Security). Existing project entries are reused; no new fabricated results.
- `/about` — rewritten to the new positioning (partner + product operator).
- `/products` — kept as the ecosystem overview and driven by the same product data; it stays indexed.
- `/contact` — restyled only. The submission logic, edge function, rate limiting, and grants are untouched.
- `/how-we-work` — kept and restyled so its indexed URL stays live.
- `/insights` — new light editorial placeholder page ("Insights coming soon"), linked in the nav, marked `noindex` until real articles exist. Say the word if you'd rather drop it from the nav for now.
- `/login`, `/admin` — functionality untouched; login gets minimal restyling, dashboard keeps its current look.

## 7. SEO, performance, accessibility

- No existing route is removed or renamed, so all indexed URLs keep working. `/orders` and `/insights` are added to `public/sitemap.xml`; `robots.txt` keeps its current rules plus `Disallow: /insights` while it is a placeholder.
- Every page keeps a unique `SEOHead` title/description/canonical + Open Graph; existing JSON-LD is preserved and Loumilab's Organization schema is updated with the product/subsidiary relationship.
- Performance: drop the intro screen entirely, drop the three.js hero scene from the homepage critical path in favor of the lightweight motif, keep eager/high-priority loading for the single above-fold image, lazy-load below-fold visuals, and set explicit dimensions to avoid layout shift.
- Motion system: short fade-and-rise reveals on one shared easing curve, restrained hover transforms, full `prefers-reduced-motion` support, no animation blocking navigation.
- Accessibility: semantic landmarks, single H1 per page, contrast-checked charcoal-on-light pairs, visible focus states, labeled form fields, ARIA on the mega menu.

## 8. Technical notes

- New: `src/data/products.ts`, `src/components/brand/*` primitives, `src/pages/Orders.tsx`, `src/pages/Insights.tsx`, routes in `src/App.tsx`.
- Removed: `src/components/IntroAnimation.tsx`; `HeroScene` / `VideoHero` / `HeroSlideshow` retired from the homepage if unused after the rebuild.
- Rewritten: `index.css` tokens, `tailwind.config.ts` theme, `Navbar.tsx`, `Footer.tsx` (four-column: Loumilab / Services / Products / Connect + "© Loumilab — Building Secure Digital Innovations.").
- No database, auth, or edge-function changes. No fake stats, clients, testimonials, or awards anywhere.
- Verified on desktop, tablet, and mobile widths with screenshots before hand-off.
