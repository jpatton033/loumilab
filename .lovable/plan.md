# Homepage: seamless move from Vurtti into "What we build"

## Goal
Make the change from the light Vurtti area into the black "What we build" area as clean as the change from "Ideas worth reading" into "Let's build it.": a straight, full-width edge with no fade, no card and no rounded corners.

## Changes
1. **Straight edge into black**
   - Remove the rounded top corners and the overlap from the "What we build" section. It starts on a straight, full-width line.
   - Keep no gradient band. Content stays at full strength.
2. **Vurtti without the bubble**
   - Remove the card background, border, shadow and rounded box. Vurtti returns to an open layout on the page background: label, "Vurtti." headline, one line, "Visit Vurtti" on the left, and the small checklist on the right shown as plain lines with hairline dividers, without a box.
   - Same spacing above and below as the other sections, so the change into black lands at a natural pause.
3. **Matching rhythm**
   - The top of "What we build" uses the same spacing as the top of the closing "Let's build it." section, so both transitions feel alike.
4. Check on phone and desktop that the edge is straight and nothing looks boxed in.

## Technical details
- `src/pages/Index.tsx` only: drop `relative z-10 -mt-10 rounded-t-[...]` from the build section; remove `rounded-3xl border bg-card p-* shadow-sm` wrapper and the checklist's rounded box from the Vurtti section.
