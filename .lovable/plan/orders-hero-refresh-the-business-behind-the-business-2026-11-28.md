# Orders hero refresh — "The Business Behind the Business"

## What changes on the Orders page
1. **New hero copy (stays still while the film plays)**
   - Headline: "You built the business. We'll handle the technology."
   - Line: "Create your storefront, accept payments, and manage your orders. All in one place, built for independent businesses."
   - Buttons: "Get Started Free" (setup) and "See How It Works" (scrolls to the showcase).
   - Small note: "No monthly subscription required to get started." (true for Starter at $0; no fee-waiver claims.)
2. **New ~30-second film, six scenes, ~5s each**
   - 1 Dedication: owner unlocking a shop / switching on a workshop at dawn.
   - 2 Craft: close-ups — baker finishing a cake, barber prepping tools, maker packing a custom order.
   - 3 The Challenge: capable owner sorting handwritten notes and a phone at the counter (no real names, logos or payment screens).
   - 4 Connection: real sample storefront (one consistent Mae's Bakehouse look, no colour cycling): view cake → add → checkout → "Order placed · Paid".
   - 5 Simplicity: real-looking order card: "New Order #1042 · Celebration Cake · $48.00 — Paid · Pickup: Saturday, 10:00 AM · Status: New". No springy badges; payout never implied.
   - 6 Impact: owner handing a packaged order to a customer, fading to black so the loop returns to scene 1.
   - Scenes 1, 2, 3 and 6 are new filmed clips (wide + phone versions). Scenes 4 and 5 are built from the real Orders screens (sample data only — no real orders, payments or emails).
   - Same look as the homepage film: obsidian blacks, cool natural light, diverse cast, light grain, no gold/neon/holograms/phone mockups.
3. **Calmer motion**: mouse-follow parallax removed, scroll shrink reduced to a slight fade, pause/play button kept, reduced-motion visitors see a still poster, film pauses when off-screen or the tab is hidden.
4. **Phones**: upright clips; scenes 4–5 shown as a simpler single card so the text and "Get Started Free" stay clear above the fold.
5. **New section right after the hero — "Everything you need to run your business."** with three panels: Your Storefront, Your Payments, Your Orders, using the brief's copy and real Orders screens.
6. **"Make it yours." section** wrapping the existing sample-site showcase, with a "Build Your Storefront" button into the existing no-sign-up builder and the note "Explore the storefront builder before creating an account."
7. Rest of the page (four steps, pricing, FAQ, closing) unchanged.

## Film cost and approval
- Generate 8 still frames (4 wide + 4 phone) first and show them as a storyboard.
- Your approval of the frames approves the film: 8 clips, 5 seconds each, 720p, about 37 credits.
- Until then the hero keeps working with the current photos for scenes 1–3 and 6.

## Tracking
- Keep all existing events (store_created, Meta Pixel, GTM, Google Ads).
- Add a placement label to CTA clicks: hero primary, hero secondary, showcase, builder — so each spot can be measured. No personal data.

## Not changed
Prices, fees, plans, sign-in, setup flow, other pages.

## Technical details
- Central scene list `src/data/ordersHero.ts` (id, wide/tall clip, poster, kind: "film" | "storefront" | "order").
- Refactor `CinematicOrdersHero.tsx`: reuse `VideoSequence` from Cinematic.tsx for film scenes (preload next only, 1.2s crossfades, matchMedia tall), coded overlays for scenes 4–5 with opacity/translate only; remove pointer vars and theme cycling.
- New `OrdersCapabilities` component in `src/components/orders/`; wrap SiteShowcase in "Make it yours." in `src/pages/Orders.tsx`.
- Clips via seedance image-to-video, ffmpeg H.264 CRF 26 faststart no audio, uploaded with lovable-assets into `src/assets/video/orders/`; WebP posters wide/tall.
- Check `track("cta_click")` / `builder_started` in src/lib/tracking; add a `placement` property without duplicating events.
- Verify at 390, 778 and 1280px with Playwright: no overflow, text readable on every scene, CTA visible on phone first screen.
