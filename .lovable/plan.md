# Restore the Loumilab header logo

## Goal
Keep the current homepage headline unchanged and restore the Loumilab wordmark in the top navigation, including after reloads and after its animation finishes.

## Plan
1. Reproduce the missing-logo state on the homepage at the start, middle, and end of the existing logo animation, checking both phone and desktop widths.
2. Adjust the logo animation so the wordmark always resolves to a fully visible, stable final state. Add a reliable visible fallback if the animation is interrupted, while preserving the blue-period arc and the completion signal used by the homepage Blue Dot.
3. Confirm the logo stays visible after the Blue Dot sequence completes, during scrolling, and after in-site navigation back to the homepage.
4. Check reduced-motion behavior and verify there are no layout shifts, overlaps, or preview errors.

## Scope
- Keep the current homepage headline: “Loumilab is a technology studio creating websites, custom software, and secure digital solutions that help businesses operate, connect, and grow.”
- Do not restore “We build what’s next.”
- Do not change navigation wording, page layout, or the Blue Dot’s intended timing.
