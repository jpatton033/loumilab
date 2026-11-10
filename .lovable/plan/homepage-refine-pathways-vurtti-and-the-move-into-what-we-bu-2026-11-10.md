# Homepage: refine Pathways, Vurtti and the move into "What we build"

## Problem
- The long light-to-black fade between Vurtti and "What we build" looks washed out, and the section's contents fade in from faint/light as you scroll.
- The Establish/Run/Improve pathways and the Vurtti block use different layouts, spacing and labels than the rest of the page, so they read as add-ons.

## Changes
1. **Clean transition into black**
   - Remove the gradient fade band. The black section starts with a clean edge: its top corners are rounded (large radius) so it slides up over the light area like a card, matching the closing section's overlap style.
   - Remove the fade-in on the "What we build" rows. Content shows at full strength right away; only a small, quick lift (no opacity fade from light) stays, and none for reduced motion.
2. **One rhythm for the light area** (hero → Pathways → Vurtti)
   - Same structure for both: small uppercase label, Satoshi headline ending in a period, one line of copy, one action.
   - Same spacing between sections and the same hairline divider between them.
3. **Pathways refined**
   - Tighter layout: three equal columns (Establish. Run. Improve.) with a short line each and one link; the photo strip stays as one calm row, no extra motion.
4. **Vurtti refined**
   - Becomes a single rounded-3xl solid card (off-white surface, hairline border, soft shadow) with label "Loumilab Companies", "Vurtti." headline, one line, and "Visit Vurtti" — plus a small, fitting product image or coded preview on the right so it matches the visual weight of other sections.
5. Check at phone (393px) and desktop: no overflow, no washed-out text, black edge looks intentional.

## Technical details
- `src/pages/Index.tsx`: drop `<ToDark />`; add `rounded-t-[2.5rem] -mt-10 relative z-10` to the "What we build" section; change its `CineScene variant="rise"` to a no-fade variant; restructure Pathways/Vurtti markup.
- `src/components/brand/story/Scene.tsx` / `.scene-*` CSS: add or adjust a "lift" variant using transform only (no opacity).
- Pathways component file adjusted for the column layout. No route, data or backend changes.
