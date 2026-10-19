# Orders page: pricing near the top, smoother flow

The page currently has 15 sections, and pricing sits second to last. Visitors coming from ads (most of them on phones) have to scroll past three storefront demos before they see what it costs. This plan moves pricing up and arranges the page as one clear story: **what it is → what it costs → how it works → see it → run it → start**.

## New order

```text
1. Hero (unchanged)
2. Slideshow ("No upfront fees ever." ...)
3. Pricing  <- moved up from near the bottom
   + Build -> Save -> Publish line
4. "Don't sign up. Start building." statement
5. How it works (4 steps)
6. Store assembly scroll moment
7. Live Preview (choose a storefront)
8. "Try it here" name input
9. Social commerce + photo row
10. Dashboard + order lifecycle (shown back-to-back as one chapter)
11. Built for sellers + industries
12. Features
13. Closing call to action
```

## Flow and smoothness changes
- **Drop repeats:** remove the "Customer journey" phone section (the store assembly already tells that story) and the mid-page "Ready to see yours?" prompt (pricing now sits high enough, and Try it here covers that spot). The page goes from 15 to 13 sections.
- **Slideshow link:** "See pricing" scrolls smoothly to the new spot, and the pricing heading leaves room under the menu.
- **Even rhythm:** the grey and white backgrounds alternate cleanly in the new order, with no two grey bands touching. Spacing between sections is consistent and a little tighter on phones.
- **Calmer reveals:** section entrances use the same gentle fade with short, consistent delays, so content never waits on screen. Reduced-motion visitors see everything right away.
- **Pricing on phones:** plan cards stay stacked, with the featured Business plan shown clearly. Monthly/annual toggle unchanged.

## What stays the same
All wording, prices, plans, buttons, the logo, the menu, search settings, Meta Pixel, Google Tag Manager and button-click tracking. Nothing about the store setup changes.

## Checks
Phone (393px), tablet and desktop screenshots, the "See pricing" jump, no sideways scrolling, and no errors.

## Technical details
- `src/pages/Orders.tsx` only: reorder section JSX, delete the Customer journey and mid-page invitation blocks (and unused imports), keep `id="pricing"` with `scroll-mt-24`, re-assign `surface-subtle border-y` to alternate.
- Reveal delays capped at ~240ms per group. No changes to `PricingTable`, data files, or tracking.
