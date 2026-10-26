# Homepage hero: grotesk headline, black period

## Font
- **Neue Haas Grotesk** needs a paid web license, from Adobe Fonts or Monotype. **Helvetica Neue** is only installed on Apple devices, so Windows and Android visitors would see a different font.
- To look the same everywhere today, the headline uses **Hanken Grotesk**. It's a free, licensed grotesk with very close Helvetica/Neue Haas proportions: straight-sided letters, a calm "a" and "t", and nothing rounded or futuristic.
- The font order puts Neue Haas Grotesk Display first. If you later add a licensed Neue Haas kit, it takes over automatically with no other change.
- **Weight:** medium (500). **Letter spacing:** -0.03em. **Line height:** 1.04.
- **Size:** same as now, about 72px desktop, 56px tablet and 40px phone. One line on large desktop; on smaller screens it breaks as "We build / what's next."

## Period
- The whole headline, including the final period, is solid charcoal-black. The period has no blue, highlight, animation or size change.
- The logo and its blue dot are unchanged.

## Simplify
- The headline, subtitle and buttons stay centered with the same spacing.
- The soft fade-up on the hero is removed, so the hero appears instantly and still.
- No decorative dot or accent appears near the headline.

## Checks
- Screenshots at 390, 768 and 1440px: the font loads, the period is black, nothing overflows, and the centering holds.

## Technical details
- `index.html`: swap the Outfit Google Font for Hanken Grotesk 500.
- `tailwind.config.ts`: `headline` becomes `["Neue Haas Grotesk Display Pro", "Hanken Grotesk", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"]`.
- `src/pages/Index.tsx`:
  - Remove the `text-accent` span.
  - Remove the `hero-rise` classes and delays.
  - Set `font-medium tracking-[-0.03em] leading-[1.04]`.
- `src/index.css`: delete the unused `.hero-dot` and `.hero-rise` rules.
- Update memory: homepage headline is a black grotesk, with no blue period.
