# Homepage hero: headline type and Blue Dot refinement

Targeted change to the homepage hero only. The logo, the menu, other pages and the rest of the homepage stay as they are.

## 1. Headline "We build what's next."
- Exact wording kept. No gradient, no color change, no text effects.
- Keep the existing hero font (Urbanist). Inter is avoided per the brand rules, and no new font is loaded.
- Weight drops from semibold to medium. Letter spacing is slightly tighter and the line height is tightened (about 1.0).
- Smaller top size so the headline stops filling the screen: about 44px on phone, 60px on tablet, 76px on desktop.
- Two-line layout on tablet and up: "We build" / "what's next." The line break is set on purpose, not left to wrapping. On phones it wraps naturally.

## 2. Hero layout
- Spacing follows one rhythm: headline, about 24px, description (max ~36 characters wide per line, softer gray), about 32px, buttons, then a larger gap before the photo.
- Center alignment and the wide rounded photo stay. No background graphics are added.
- The hero reads finished with motion turned off.

## 3. Blue Dot
- The homepage hero has one Blue Dot moment: the existing marker under the headline. It gets smaller (a small dot with a short, thin line), plays once after the logo animation, and then stays still. No pulsing, looping or floating.
- The current extra element between the headline and the description is replaced by this smaller dot. It sits at the end of the headline's baseline rhythm and never overlaps text or buttons.
- With reduced motion turned on, the dot shows still right away.
- No other decorative dots are added to the homepage. The page-change indicator used across the whole site stays as it is, so other pages are not affected.
- The logo and its dot are not changed.

## 4. Motion
- The headline, description and buttons get a single soft fade-up, staggered by about 60ms. Reduced motion skips it. There is no continuous animation.

## Checks
- Screenshots at 390, 768 and 1280px wide: the headline breaks as planned, nothing overflows, and the buttons stay visible on the first screen at 1280.
- Check with reduced motion turned on.

## Technical details
- Files: `src/pages/Index.tsx` (hero markup and classes), plus CSS for `.dot-marker` sizing and the hero entrance in `src/index.css`. Shared `DotMarker` behavior is unchanged, apart from a size variant (`size="sm"`), so the Local page is not affected.
- The `useDotMotion` and reduced-motion handling are reused from `brand/dot/tokens.ts`.
