# Orders page: shorter, unified, mobile-first

## Today (top to bottom)
The page has 15 parts, and several of them repeat each other:
1. Cinematic hero
2. A three-step strip
3. "What you can build" feature grid
4. Sample-website slideshow
5. "Make it yours" preview
6. A builder screenshot
7. "This is what your customers see" storefront
8. A second slideshow from before the hero redesign
9. Promotion banner
10. Pricing
11. How it works
12. A live storefront demo
13. Dashboard screenshot
14. "Built for social sellers"
15. Features grid and a final call to action

The website story is told four times (parts 4, 5, 7 and 12), and features are listed three times (parts 3, 13 and 15).

## New page (6 parts + compact FAQ)
1. **Cinematic hero:** kept. The headline and button show right away. It gets a shorter height on phones, and the three-step strip is removed.
2. **See what you can create:** one section. It uses the sample-website slideshow as the big preview, with a compact style row (Style, Colors, Fonts, Layout) right underneath that changes the site shown. There's a "Start With This Design" button. On phones it shows one large preview, swipe navigation and controls on a single row that scrolls sideways inside the panel; the page itself never scrolls sideways. This replaces parts 4, 5, 7 and 12.
3. **Build, Sell, Manage:** three short columns, each with one real image: a sample website for Build, a product card with a payment tick for Sell, and the dashboard screenshot framed whole, not cropped, for Manage. A small "More features" list opens to show pickup/delivery, notifications, messaging, calendar and estimates, with domains marked "Coming soon". This replaces parts 3, 6, 13, 14 and 15.
4. **How it works:** four steps (Choose a design, Make it yours, Set up your business, Publish and share). They sit side by side on desktop and stack on phones, with a line saying no sign-up is needed to start.
5. **Pricing:** three clean cards using the current live plans and fees, with one line separating the Loumilab fee from card-processing fees. The promotion banner moves in here, only when a promotion is active.
6. **Compact FAQ and closing call to action:** the FAQ shows only the questions not answered above, and the page ends in a dark finish with the main button.

Removed: the duplicate older slideshow, "This is what your customers see", the standalone builder screenshot, the separate live demo, "Built for social sellers" and the long features grid. Their useful facts move into section 3 or the FAQ.

## Flow and look
- The page stays black from the hero through the showcase and feature sections, then shifts once to warm light for How it works and Pricing, using the existing soft-glow transition, and returns to black for the finish. That's two color changes instead of about eight.
- Motion stays gentle (fades, small rises), with no pinned scrolling and a still image for reduced motion. Phones get even lighter motion.
- Every screenshot is shown whole (no bottom cropping) inside frames sized to the image.

## Held from the brief
- **Main button wording:** you've kept "Get Started" twice. The brief asks for "Build Your Website — Free". The plan keeps "Get Started" unless you say otherwise.
- **Launch/Build/Grow plans at 5%/2.5%/1.5%:** not shown, since they aren't approved or live.
- **Connecting your own domain on every plan:** shown as "Coming soon", since it doesn't work yet.

## Checks
I'll take full-page screenshots at desktop (1280), tablet (778) and phone (390) and review them for cropping, spacing, sideways scrolling and button behavior. I'll confirm the buttons still open setup, conversion tracking still fires, and the hero headline and button show without waiting.

## Technical details
- Edit only `src/pages/Orders.tsx`. Merge MakeItYours and SiteShowcase into one `CustomizeShowcase` that takes a `compact` controls mode, still built on SitePreview/presets so it stays the one design system. The homepage keeps using SiteShowcase.
- Remove the page's imports of OrdersShowcase, OrdersHeroSlideshow, ScreenFrame(builder) and the demo. Delete the component files only if nothing else uses them.
- Use the existing atmosphere Glow/ToDark utilities for the two transitions. Images go through vite-imagetools at the right sizes with lazy loading below the hero.
- Keep SEO, prerendered heads, routes, trackCtaClick and promo logic unchanged.
