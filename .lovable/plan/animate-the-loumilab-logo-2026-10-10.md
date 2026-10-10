# Animate the Loumilab logo

## Direction
Add one restrained signature animation to the **header logo only**. On a visitor’s first page view, **LOUMILAB** resolves smoothly from left to right, then the blue period follows a short, polished arc into its resting position. The result should feel like a brief studio signature—closer to Google or Disney’s controlled logo flourishes than a loading animation.

## Changes
1. Extend the shared Loumilab word logo with an optional animated state while preserving its exact typography, spacing, colors, and final appearance.
2. Build the motion from two coordinated moments:
   - a soft left-to-right reveal with a very small settle for the letters;
   - the blue period arriving last along a subtle curved path, then settling cleanly.
3. Trigger it only from the site header and only once per browsing session. Moving between Loumilab pages will not replay it; the footer logo remains static.
4. Keep the full logo present in the page throughout so there is no layout shift, blank header, or reintroduced loading screen.
5. Respect reduced-motion settings by showing the finished logo immediately without animation.

## Technical details
- Add an animation option to `Wordmark` rather than duplicating logo markup.
- Use scoped CSS keyframes and the existing brand easing token, with a total duration around one second.
- Track the one-time play state in session storage, with a safe fallback if browser storage is unavailable.
- Motion remains decorative and does not alter the logo link, accessible name, keyboard focus, or click behavior.

## Verification
- Check the first visit, navigation between pages, refresh behavior, and a fresh browsing session.
- Confirm the header does not move or resize before, during, or after the animation.
- Check desktop and phone widths, keyboard focus, and reduced-motion behavior.
- Confirm the footer logo stays unchanged and the project remains error-free.
