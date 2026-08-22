# Remove Hero Pill + Refine the Loumilab Wordmark

Two changes: drop the small badge above the homepage headline, and replace the ad-hoc logo markup with one refined wordmark used everywhere.

## 1. Remove the hero pill

On the homepage, delete the small rounded badge reading "Technology studio · Products · Security" that sits above "We Build What's Next." The headline moves up to become the first element in the hero, with spacing rebalanced so nothing looks cramped or leaves a gap.

## 2. Refined wordmark, used consistently

Today the logo is hand-written markup duplicated in the header and the footer, at different sizes, with a slightly awkward oversized "L". It becomes one reusable component:

- Type set in the brand display face, uppercase, tightened letter-spacing so "LOUMILAB" reads as a designed lockup rather than plain bold text.
- The initial "L" stays only marginally larger than the other letters — a subtle detail, not a size jump.
- The period stays in the blue accent, optically aligned so it sits tight to the final "B".
- Two sizes (header and footer) driven by one component, so they can never drift apart again.
- Renders in the current text color, so it works on light surfaces now and on any dark surface later.

Applied to: the header, the footer, and anywhere else the wordmark appears.

## 3. Matching favicon

The favicon becomes a monogram derived from the same lockup — a white "L" with the blue accent period on the near-black square — so the browser tab reads as the same mark instead of an unrelated dot.

## Technical notes

- Delete the `<span>` pill block in the hero of `src/pages/Index.tsx` and adjust the `mt-*` on the `h1`.
- New `src/components/brand/Wordmark.tsx` exposing a `size` prop (`sm` for nav, `md` for footer) and an optional `className`; uses `font-display`, `tracking-[-0.03em]`, `currentColor`, and `text-accent` for the period. No hardcoded color utilities.
- Replace the inline spans in `src/components/Navbar.tsx` (line 71) and `src/components/Footer.tsx` (line 12) with `<Wordmark />`.
- Rewrite `public/favicon.svg` as the "L" monogram plus accent dot; keep `index.html`'s existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` pointing at it. `public/favicon.ico` is already absent.
- Leave the unused `LoumilabLogo` / `DiamondLogo` components untouched in this pass.

## Verification

Screenshot the homepage, footer, and mobile header to confirm the pill is gone, hero spacing is balanced, and the wordmark is identical in header and footer.
