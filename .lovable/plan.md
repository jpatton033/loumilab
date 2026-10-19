# Live Preview: auto-advance, service photos, new order

## Order
1. Sunday Kitchen
2. Petal & Stem Florist
3. Sweet Crumb Bakery
4. Studio Luxe Hair Salon
5. Bright Current Electric
6. Fix-It Handyman Co.
7. Fresh Nest Cleaning

## Auto-advance
- The preview moves to the next store every 7 seconds and loops back to Sunday Kitchen after the last one.
- It pauses while a visitor hovers over the store, taps Add/Book/Request, or uses the keyboard inside it. It stops for good once someone picks a store themselves, so it never switches away while they're browsing.
- It only runs while the section is on screen. Visitors who turn off motion still get a gentle swap with no fade.
- A small Pause/Play button sits beside the arrows, and a thin progress line under the selected chip shows when the next store will load.
- The sample cart clears on each change, as it does now.

## New photos (3 per business, 12 total)
Bright, premium style that matches the existing food and flower photos:
- Electrician: technician at a breaker panel, a panel upgrade, installing a light fixture or outlet
- Handyman: a wall repair, a TV mounted on a wall, furniture being assembled
- Hair salon: a silk press result, knotless braids, a cut and style at the chair
- Cleaning: a spotless living room, a deep-cleaned kitchen, an empty, freshly cleaned room

The service stores keep their "From" prices and Book/Request buttons.

## Technical notes
- In `src/data/orders/storefronts.ts`, import the new images into `src/assets/orders/` and set `image` on the service products, including the existing Bright Current Electric entry. That entry is also shared by `/orders/store/bright-current-electric`, so that sample store gets the photos too.
- In `LivePreviewPicker.tsx`, reorder `ENTRIES` and add an interval timer with `IntersectionObserver` visibility gating, pause-on-hover/focus, stop-on-manual-selection, a play/pause toggle and a CSS progress bar. When motion is reduced, skip the fade-in animation.
- Check on phone and desktop that it advances, pauses and stops correctly.
