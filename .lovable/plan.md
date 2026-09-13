# Orders Homepage Hero Slideshow

Add a rotating benefit slideshow below the fixed headline area on `/orders`, modeled on the main site's `ProductShowcaseHero` but lighter (icon cards, no mockups).

## 1. Slide content

Create `src/data/orders/hero-slides.ts` with 5 benefit-driven slides:

- **No upfront fees** — "No upfront fees ever." / "Get started, get organized, and start selling."
- **Free forever** — "Free forever." / "No subscription. No hidden costs. Just a simple way to take orders."
- **No dead links** — "Never get another 404 unknown page again." / "Your store lives on a real, shareable link that always works."
- **Focus** — "Focus attention on what really matters." / "Your products, your customers, and your business — not building a website."
- **Every channel** — "One link. Every channel." / "Instagram, TikTok, Facebook, text, email, or your website — all in one place."

Each slide has: `id`, `eyebrow`, `headline`, `description`, `icon` (Lucide), optional `accent` HSL override, and per-slide `cta_primary` / `cta_secondary` labels + URLs.

## 2. Component

Build `src/components/orders/OrdersHeroSlideshow.tsx`:

- Receives the slide array as a prop; the fixed top frame stays in `Orders.tsx`.
- Each slide renders a large rounded-3xl icon card, headline, description, and slide-specific CTAs.
- 6-second auto-advance, pauses on hover, focus, and touch.
- Progress-bar tab navigation matching the main homepage hero style.
- Reduced-motion fallback to a simple crossfade and no auto-rotation.
- Subtle scroll handoff (soften/fade as the user scrolls down).
- Mobile swipe support and keyboard arrow navigation.

## 3. Orders page integration

Update `src/pages/Orders.tsx`:

- Keep the existing hero eyebrow, "Your business. Your storefront. Your orders.", description, and CTAs as the fixed top frame.
- Insert `<OrdersHeroSlideshow slides={ordersHeroSlides} />` below the current hero grid and before the Social commerce section.
- Remove the static "Create your store. Share your link. Take orders. Get paid." tagline so it does not compete with the rotating slides.

## 4. Design & motion

- Light theme, rounded-3xl cards, hairline borders, soft shadows per project tokens.
- Each icon sits in a colored circle using the slide accent color.
- Transitions: text rises and crossfades; icon card scales/fades in.
- `prefers-reduced-motion` disables auto-rotation and shortens transitions.
- No new dependencies; reuse existing `Button`, `Reveal` patterns and CSS custom properties.

## 5. QA

- Desktop, tablet, and mobile screenshots of the new hero area.
- Verify every slide CTA links correctly.
- Confirm reduced-motion behavior and keyboard/swiping navigation.
- Confirm build passes.

No backend changes; entirely frontend/config-driven.
