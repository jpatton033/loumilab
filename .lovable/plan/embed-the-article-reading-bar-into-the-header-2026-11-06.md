# Embed the article reading bar into the header

On Knowledge Center articles, the blue reading bar currently floats a little below the header on desktop (it sits 8px lower than the header's bottom edge) and has a large 8px dot. It will be moved so it runs along the header's bottom line as one seamless edge.

## What changes
- The bar sits exactly on the header's bottom hairline on phone and desktop — no gap, no overlap with content.
- Thinner and calmer: a 2px Loumilab Blue line filling left to right, with a small 5px dot at the leading edge (instead of the 8px dot).
- Fades in once reading starts and fades out at the end, as today. Reduced-motion still respected.
- Only Knowledge Center articles use it; nothing else changes.

## Technical details
- `src/index.css` `.ldot-progress`: `top: 4rem` (mobile) and `top: 4.5rem` at `lg` to match the header's `h-16` / `lg:h-[72px]`; `height: 5px`; `translateY(-50%)` so the line centers on the border; `z-index: 51` (above header's z-50).
- `.ldot-progress-line`: `height: 2px`, full-strength accent, centered vertically; add a faint `hsl(var(--border))` track behind it.
- `.ldot-progress-tip`: 5px, `left: calc(p - 2.5px)` in `DotProgress` (`src/components/brand/dot/experience.tsx`).
- Verify at 390px and 1280px by scrolling an article and screenshotting the header edge.
