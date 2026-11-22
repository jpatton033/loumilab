# Orders Cinematic Hero — "Built Around Your Business."

## What changes
Replace the current photo hero at the top of /orders with a full-screen cinematic hero. Headline, supporting copy and both buttons appear instantly; the film plays behind them.

**Foreground (shows immediately)**
- Headline: "Your business. Your website. Your orders. One place."
- Supporting line from the brief.
- Primary button (wording pending your answer) opens store setup.
- "See How It Works" scrolls smoothly to the website-builder section.
- Pause/play control.

**Background — 24-second loop, six scenes**
1. Entrepreneur close-up (baker finishing a cake) emerging from black.
2. Different businesses: boutique owner, designer, caterer — slow drift, crossfades.
3. Physical product becomes the product photo on a real-looking storefront; colors, fonts and sections shift gently (built from the actual builder templates).
4. Customer adds an item and checks out; merchant sees the new order arrive (real Orders look).
5. Website, orders, payment and pickup status settle into one calm layered view.
6. Return to near-black, looping back to scene 1 with no flash.

Scenes 1, 2 and 6 use new art-directed photos of inclusive, real-feeling entrepreneurs with slow camera movement (per your "photos, no new films" rule and the brief's warning against low-quality generated video). Scenes 3–5 are live, coded product screens, so they stay sharp and accurate.

**Motion & interaction**
- Scrolling: the background slowly scales back and dims, the storefront card rises into the website-builder section below — no scroll locking.
- Desktop: very subtle depth shift with the mouse; text and buttons never move.
- Mobile: its own tall composition, simplified scenes, text always readable.
- Reduced-motion: one still image, no movement.

**Kept as-is**
The fee line, the slideshow below, pricing, checkout, storefronts and everything behind the scenes.

## What's still needed afterward
A true filmed 24-second brand film (real footage) can replace the photo scenes later without changing the page.

## Technical details
- New `src/components/orders/hero/CinematicOrdersHero.tsx` (layers A/B), scene timeline driven by one rAF clock writing CSS vars; transform/opacity only, reuses Scene.tsx `--p` scroll progress.
- Scene 3–5 UIs reuse `src/components/storefront` renderer/templates with sample data; marked as demo.
- 4–5 generated WebP photos via vite-imagetools, first one preloaded as poster; others lazy.
- Replace `PageHero` usage in `src/pages/Orders.tsx`; add `id="how-it-works"` to builder section.
- Verify at 390px / 778px / 1280px with Playwright; check no layout shift and buttons clickable on load.
