# Matching page endings + lighter footer

## 1. Every page ends like Website Development
Website Development ends with a big black rounded band: one bold headline and one blue button. Give every main page the same ending:
- Pages with a light ending (Products, About, The Dot., Resources, Compare): switch to the black version.
- Pages with their own custom ending (Services, How We Work, Selected Work, Contact, Orders, Pricing, Local, Business Email): replace it with the same band and keep each page's current headline and button.
- Pages with no ending: add the band with a fitting headline and "Start a Project" (Orders pages use "Get Started").
- Homepage already has this ending, so it stays.

## 2. Lighter footer
- Return the footer to the light warm off-white with the dark logo (blue dot) and gray links.
- The newsletter band above the footer becomes light too (white/off-white with a hairline border), so the black closing band stays the one dark moment at the bottom.

## Technical details
- Use the shared `ClosingCta tone="dark"` from `src/components/brand/flow/Flow.tsx` on every page.
- Footer: remove `section-dark` and the logo filter. `SiteNewsletter`: swap `section-dark` for `bg-background border-t`.
- Check a few pages at 390px and 1280px.
