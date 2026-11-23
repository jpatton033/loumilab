# Clean light/dark breaks on the Orders page

Remove the two soft fade bands so the page switches sharply between dark and light.

- **Into "Live in four steps."**: delete the dark-to-light fade at the top of that section, so the dark features area ends and the light area begins on a straight edge.
- **After "Questions."**: delete the light-to-dark fade at the top of the closing section, so the light area ends and the black closing section starts on a straight edge.

No other spacing, text or sections change.

## Technical details
In `src/pages/Orders.tsx`, remove the two `aria-hidden` gradient overlay divs (lines ~158 and ~213). Check at 778px and desktop.
