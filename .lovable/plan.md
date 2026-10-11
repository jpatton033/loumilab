# Loumilab Dot Motion System

Make the blue "." a recurring, quiet brand signature layered onto the current site. No layout, copy or navigation changes. CSS-first, no new libraries.

## Where the dot appears

1. **Homepage hero** — the headline's final period becomes the blue Loumilab dot. It fades in last, glows once, then gently detaches and travels down into the "Start a Project" button, where it becomes the button's hover dot. Plays once per page load.
2. **Section thread** — at three deliberate moments on the homepage (Orders, Local, "What we do"), a small dot slides along a short hairline as the section scrolls into view and lands as the final period of that section's headline. Never follows the cursor or scroll continuously.
3. **Design. Build. Innovate. Secure.** — the four homepage tiles gain a blue period after each word label, animating individually as they enter view:
   - Design: dot morphs briefly into a rounded square and back
   - Build: two half-dots join into one
   - Innovate: dot expands outward and settles
   - Secure: a thin protective ring draws around the dot
4. **Products** — before the Orders and Local tiles, one Loumilab dot splits into two points that drift toward each product, then resolve back. Loumilab stays the main name.
5. **Buttons, links, cards** — on hover/focus: a small dot appears beside button text; arrow links get a dot that expands behind the arrow; cards nudge a dot in their corner. Kept subtle.
6. **Footer signature** — "LOUMILAB" shows first; the period drops into place when the footer scrolls into view.

## Loading animation
Skipped on purpose: your saved rule says the intro/loading screen is removed permanently. The header logo animation already plays on reload, and nothing will delay the page.

## Motion and accessibility
- Smooth, precise easing; no bouncing, spinning or particles.
- Reduced-motion users see a clean static dot everywhere.
- Simpler versions on phones (no travelling paths, just fade-ins).
- All decorative pieces ignore clicks and are hidden from screen readers.

## Technical details
- New `src/components/brand/dot/` with `BrandDot`, `DotThread`, `DotSplit`, `ServiceDot` (variant prop) and a small `useInView` hook (IntersectionObserver, fires once).
- Keyframes and `.dot-hover` / `.dot-link` utilities added to `src/index.css`, using `--primary`; transform/opacity only for zero layout shift.
- Wire-ins: `Index.tsx` (hero, thread, tiles via GridTile `eyebrowDot` prop, product split), `Tiles.tsx` (TileActions buttons), `Footer.tsx` (Wordmark `revealDot` prop).
- Record the system in AGENTS.md.
- Verify in a browser at desktop and phone, with reduced motion on.
