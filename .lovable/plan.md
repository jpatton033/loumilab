# Homepage headline: closer Neue Haas Grotesk look-alike

Replace Hanken Grotesk with **Inter Tight**, a free, licensed font. Its letter shapes are close to Neue Haas Grotesk Display: a tall x-height, a tight, even fit and straight endings on "a", "t" and "e". Hanken Grotesk has softer, more open letters, which is why it reads less like Helvetica.

- **Weight:** medium (500).
- **Letter spacing:** -0.035em. The headline stays one line on large desktop and two lines on smaller screens.
- **Size:** unchanged, about 72px desktop, 56px tablet and 40px phone.
- **Color:** the headline stays solid black, period included.
- **Licensed Neue Haas:** it still comes first in the font order, so a kit you add later takes over automatically.
- **Scope:** homepage headline only. The logo and other text are unchanged.

## Checks
- Headline screenshot at 1440px and 390px: confirm the font loads and nothing overflows.

## Technical details
- `index.html`: swap `Hanken+Grotesk:wght@500` for `Inter+Tight:wght@500`.
- `tailwind.config.ts`: `headline` stack becomes Neue Haas Grotesk Display Pro, Inter Tight, Helvetica Neue, Helvetica, Arial.
- `src/pages/Index.tsx`: tracking becomes `-0.035em`.
- Memory note updated.
