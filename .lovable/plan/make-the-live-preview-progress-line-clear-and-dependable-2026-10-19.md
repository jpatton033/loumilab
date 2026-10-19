# Make the Live Preview progress line clear and dependable

## What I found
In a test browser the line does fill. After 1.5 of the 3.5 seconds it was about 40% across, and the store changed when it reached the end. It's easy to miss for three reasons:
- It's only 2px tall and sits tucked inside the dark selected chip, so on most screens it looks like a faint scratch.
- It freezes while the pointer rests anywhere over the store card. With the mouse parked there, it never seems to move.
- Once a store is tapped or picked, the tour stops and the line disappears with no explanation.

I couldn't confirm which of these you're seeing, so the plan fixes all three.

## Changes
1. **A clearer line:** a 3px track running the full width under the row of store chips, filling in Loumilab Blue. The faint line inside the chip is removed.
2. **Pause only where it makes sense:** the tour pauses only while the pointer is over the products and cart, not the store's header area. When the pointer leaves, the line resumes from where it stopped instead of starting over.
3. **A visible stopped state:** when the tour stops after a visitor picks a store, the line stays faded with a small "Tour paused, press play to resume" label beside the play button. Pressing play restarts the tour from the current store.
4. Visitors who turn off motion see the line advance in a few even steps instead of a smooth sweep.

## Technical notes
- In `LivePreviewPicker.tsx`, move the progress bar out of the chip into a full-width track under the tablist. Drive it with one keyed element whose `animation-play-state` follows `running`, so pausing keeps its position.
- Narrow the hover-pause handlers to the product grid and cart.
- Show the paused label when `auto` is false.
- Update the CSS in `src/index.css`: the reduced-motion version uses `steps(4)`.
- Verify with Playwright at 722px and 1280px wide: it fills, pauses on hover, resumes, and shows the stopped state.
