# Synchronize the Homepage Blue Dot with the Loumilab Logo

## Goal
Make the opening Blue Dot feel like a continuation of the Loumilab logo animation rather than an independent decoration.

## Changes

1. **Use the logo as the timing source**
   - Signal when the header logo’s complete sequence finishes, including the period arc, landing ring, and final light sweep.
   - The homepage opening Blue Dot will wait for that completion signal before beginning.
   - On a reload, the sequence becomes: logo animation → Blue Dot animation → clean resting page.
   - If the logo does not animate during in-app navigation, the dot can begin without an unnecessary multi-second wait.

2. **Correct the homepage dot alignment**
   - Rework the opening dot’s path around the true horizontal center of its reserved area.
   - Keep the line and dot visually centered throughout the finish instead of leaving the dot at the right edge of a centered container.
   - Preserve stable spacing so the headline never shifts when the dot moves or disappears.

3. **Hide the dot after completion**
   - Fade both the dot and its short thread completely at the end of the sequence.
   - Keep the reserved area invisible after completion so the headline and buttons do not jump.
   - Apply this self-clearing behavior to the page-opening marker system, while leaving purposeful image, section, and action animations unchanged.

4. **Accessibility and reliability**
   - With reduced motion enabled, skip both the wait and decorative opening animation; the Blue Dot remains hidden.
   - Provide a safe timing fallback so the homepage dot cannot remain stuck if an animation-completion event is interrupted.
   - Reset correctly on a full reload without replaying unexpectedly during ordinary page navigation.

## Technical notes
- Add a small shared logo-animation completion signal from the header wordmark flow.
- Give the opening dot marker a synchronized mode used by the homepage; other public pages retain their existing enter-view timing unless explicitly synchronized later.
- Update the dot keyframes so their final state is centered and transparent.

## Verification
- Observe the complete sequence on a fresh desktop and phone reload: the Blue Dot must not appear before the logo finishes.
- Confirm the dot is centered at its final visible moment, then fully disappears.
- Check in-app navigation to the homepage, reduced motion, layout stability, and repeated reloads.
