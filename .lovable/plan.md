# Fix scroll position in the Orders onboarding wizard

On `/orders/get-started`, moving between steps (Continue, Back, or clicking a progress chip) only swaps the form contents. The page keeps the scroll position from the previous step, so a shorter next step appears already scrolled to the bottom on both desktop and mobile.

## What changes

- When the step changes, scroll the view to the top of the step card (just above "Step N — ...", accounting for the fixed header) so each step starts at its heading.
- Apply this to all three ways the step changes: Continue, Back, and the progress chips.
- Keep the sticky live preview and all wizard logic, validation, and content untouched.
- Respect reduced-motion: smooth scroll normally, instant jump when the user prefers reduced motion.

## Technical notes

- Edit only `src/pages/orders/GetStarted.tsx`: add a ref on the step card container and a `useEffect` on `step` that calls `scrollIntoView` (or `window.scrollTo` with the card's offset minus header height) skipping the initial mount.
- No backend, routing, or copy changes.
- Verify at 393px and desktop widths that each step lands at its heading.
