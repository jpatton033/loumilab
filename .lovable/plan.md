# Logo Animation Refinement

## Goal
Make the once-per-session Loumilab logo animation richer and slower, and rework the blue period so it starts enlarged, then eases down to its actual resting size — all in the existing sleek, Apple/Google style.

## Current state (verified)
- `src/components/brand/Wordmark.tsx` renders each letter as a span (`brand-wordmark-letter-1..8`) plus the dot span (`brand-wordmark-dot`); the `animated` prop adds `brand-wordmark-animated`.
- `src/index.css` runs `brandWordmarkResolve` (0.62s, 30ms letter stagger, small 5px slide) and `brandWordmarkDot` (0.7s, starts small at 0.55 scale, grows to 1.08 then settles) — the dot currently grows, it never starts oversized.
- Play-once-per-session logic and the reduced-motion fallback live in `src/components/Navbar.tsx` and the media query in `index.css`; both stay as-is.

## Changes (CSS only — no component or routing changes)

1. **Slower, delayed sequence**
   - Add a short hold before the animation starts (~0.3s initial delay) and stretch total runtime from ~1.1s to roughly 2s.
   - Increase letter stagger so the resolve reads as a deliberate left-to-right sweep rather than a quick flicker.

2. **Richer letter entrance**
   - Letters fade in and rise into place with a gentle blur-to-sharp transition and a subtle overshoot settle (slightly past position, then ease back) — the classic "premium settle."
   - Keep motion small and horizontal-biased so the header layout never shifts.

3. **Dot: enlarge, then reduce to actual size**
   - The dot now enters oversized (~2.4x its rendered size) at the end of the letter sweep, fades in while easing down and inward, then smoothly reduces to exactly its normal size (scale 1) with a soft bounce — a signature "stamp" moment.
   - Because the dot scales down to its true rendered size, no layout or spacing change results after the animation.

4. **Reduced motion**
   - Extended reduced-motion rule keeps everything static at final state, exactly as today.

## Verification
- Build passes.
- Playwright check: animation plays once on first view, does not replay on navigation, final logo is pixel-identical in spacing to the static state, reduced-motion shows no animation.
