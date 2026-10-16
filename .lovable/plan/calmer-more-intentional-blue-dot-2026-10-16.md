# Calmer, More Intentional Blue Dot

Goal: the dot should feel like a quiet thread through the site, the way Apple uses motion. It should be smooth, it should respond to scrolling, and it should never surprise. Layout, wording, navigation, tracking and search setup stay as they are.

## What changes on the homepage
1. **Remove the "explosion."** The big circle that floods the screen before the Orders section goes away. In its place, a small dot glides in beside the Orders heading as it scrolls into view, rests for a moment, then fades.
2. **Fewer moments.** The homepage drops from about six dot moments to three:
   - The opening dot under "We build what's next." It still plays after the logo, a little slower and softer, with no bounce.
   - The single dot that splits toward Orders and Local. It moves more gently and in a shorter distance.
   - The closing line that leads into "Start a Project."
   The dot that travels across the hero photo is removed, because it competes with the image.
3. **Tied to scrolling, not to timers.** Each moment starts only when its section is well into view, plays once, and finishes in step with the content fading in. Nothing fires on its own.

## Site-wide refinement
- **One gentle motion style:** a slow ease-out with no overshoot, bounce, scale-ups or fills. Movements are small, a few dozen pixels at most.
- **Softer presence:** the dot is a little smaller, slightly translucent while it moves, and solid only once it settles.
- **Page-change dot:** kept, but lighter, faster and fainter, so it reads as a hint and not an event.
- **Other pages** keep their single meaningful moment, retuned to the calmer style: map pin on Local, check mark on Contact, reading line on articles, issue dot on The Dot. Any other page with more than three moments gets trimmed.
- Reduced motion still shows a static dot. No dot ever replaces a full stop.

## Checks
- Homepage on phone, tablet and desktop: no sideways scrolling, and no sudden flashes.
- Reduced motion on.

## Technical details
- `src/pages/Index.tsx`: remove `<DotReveal />` and `<DotImageJourney />`, and keep `DotMarker`, `DotSplit` and `DotThread`.
- Retire the `.ldot-reveal` fill burst. Repurpose `DotReveal` as a small slide-and-settle (translateX ≤ 24px, opacity), or delete it if it's unused.
- `tokens.ts`: replace the overshoot easing with `cubic-bezier(.22,.61,.36,1)`, and lengthen base to 800ms and signature to 1200ms. Remove the bounce keyframes in the `.ldot-*` CSS (Arrive, Split, Route).
- Raise the `useInView` threshold so moments start at about 35% visibility.
- Update the AGENTS.md dot rule: no full-screen fills, at most three moments per page, and motion tied to scrolling.
