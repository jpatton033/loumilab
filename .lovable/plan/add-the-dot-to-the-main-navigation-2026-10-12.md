# Add The Dot. to the main navigation

The Dot. already exists at `/the-dot` with its landing page, issue reader, and all current placements. This change only adds it as a dedicated item in the primary site navigation. Nothing else is redesigned, renamed, restructured, or restyled.

## What changes

One file: `src/components/Navbar.tsx`.

1. **Add the item.** Insert `The Dot.` → `/the-dot` into the existing `navLinks` list, between `Resources` and `Contact`, so `Contact` stays last. Label is exactly "The Dot." (with the period), matching the brand hierarchy used on the page itself and in the footer.

2. **Desktop and mobile both pick it up automatically.** The desktop bar and the mobile/tablet menu both render from the same `navLinks` list, so one entry covers every screen size — no duplicate markup, no new menu, no new styling.
   - Desktop (1024px and wider): appears in the horizontal bar.
   - Tablet and phone (below 1024px): appears in the existing slide-down menu, in the same order.

3. **Keep it highlighted while reading an issue.** The nav currently highlights only an exact page match, so an issue page like `/the-dot/issue/the-habit-is-the-moat` would leave the item unlit. The new item highlights for anything under `/the-dot`. Existing items keep their current exact-match behavior unchanged.

4. **Make room if needed.** The desktop bar goes from seven items to eight. If measurement shows the row crowding at the narrowest desktop width, the only adjustment is the space between items on that one breakpoint (tighter below 1280px, unchanged above it). Font, size, color, hover behavior, and item order all stay as they are.

## What does not change

- No new routes, pages, components, or database work — `/the-dot` and `/the-dot/issue/:slug` are already wired up.
- No changes to The Dot. pages, their copy, layout, signup blocks, or SEO.
- No changes to the Products dropdown, the header logo or its animation, the Blue Dot moments, the footer link, the homepage/Resources/article placements, or the engagement prompt.
- Admin navigation is untouched.

## Verification

Open the site in a browser at 1280, 1024, 768, and 390 px wide and confirm:
- "The Dot." is visible in the desktop bar and, on smaller screens, in the opened menu.
- Clicking it lands on The Dot. landing page.
- The item shows the active (accent) color on both `/the-dot` and an issue page.
- No items overlap, wrap, or get clipped, and the "Start a Project" button stays in place.
- No new console errors, and the build passes.
