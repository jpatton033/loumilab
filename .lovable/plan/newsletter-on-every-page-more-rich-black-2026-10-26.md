# Newsletter on every page + more rich black

## 1. "Join our newsletter" at the bottom of every page
- Add one dark newsletter band (The Dot. signup) just above the footer on every page that uses the shared site layout.
- Skip it where it would repeat: The Dot. pages themselves, and pages that already end with a signup (homepage resources area, Resources/articles) — the existing inline signup there is removed so each page shows it once, at the bottom.
- Not shown on admin, merchant dashboard, storefronts, checkout, receipts or sign-in pages.
- Existing signup behavior (welcome, "already subscribed", topics) stays the same.

## 2. More rich black throughout
Keep all current dark sections. Add a few more dark bands so pages alternate light / dark, staying within roughly a quarter of each page:
- Footer becomes rich black (pairs with the newsletter band above it).
- Services, About, How We Work, Work, Contact: one mid-page section switched to black (e.g. process steps, values, or highlights).
- Orders, Pricing, Local, Business Email, Products: one feature or "how it works" section switched to black.
- Resources hub and The Dot.: the featured/top area gets a black band.
- Small touches: black stat strips and black "featured" cards inside light sections.
- Body copy, menus and forms stay light; blue accent remains sparing.

## Technical details
- New `SiteNewsletter` band in `src/components/thedot/`, rendered by `Layout.tsx` with a `hideNewsletter` prop for opt-out pages; uses `TheDotSignup` with a dark variant (inverse tokens).
- Reuse existing `--surface-inverse` / `--inverse-foreground` / `--inverse-muted` tokens; add a `.section-dark` utility in `index.css`. No hardcoded colors.
- Update visual-identity memory to note the higher dark ratio. Check at 390px and 1280px.
