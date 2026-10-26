# Homepage hero and header: match the official logo

## Headline font
The logo is a geometric sans: a perfectly round O, flat stroke ends, even line weight and open spacing. The headline switches to **Outfit**, a geometric sans with the same round letter shapes, so the headline and logo look related.
- **Weight:** semibold (600), not heavy.
- **Spacing:** slightly tight letter spacing (-0.02em) and a line height of about 1.05.
- **Size:** about 72px on large desktop, 56px on tablet and 40px on phone.
- **Lines:** "We build what's next." fits on one line on large screens. Smaller screens break it on purpose as "We build / what's next.", never leaving "next." alone.
- **Blue period:** the final period turns Loumilab Blue, echoing the logo's dot. The separate small dot under the headline is removed, leaving one dot, not two.
- **Scope:** only the homepage headline changes font. The rest of the site keeps its current fonts.

## Hero layout
- The headline, description and buttons share one centered column.
- **Description:** about 640px wide, 18–20px text, soft gray, evenly wrapped.
- **Buttons:**
  - "Explore Solutions" is solid Loumilab Blue and "Start a Project" is outlined. Both are the same height.
  - They sit side by side and stack neatly on small phones.
  - Their links and tracking don't change.
- **Spacing:** more balanced space above and below. The group sits slightly above the middle of the first screen, with less empty space at the top.

## Header
- Three zones: the logo on the left, Solutions | Products | Resources | About truly centered on the page, and the account icon plus "Start a Project" on the right.
- Hover menus, keyboard support and the phone menu work as they do now.

## Checks
- Screenshots at 390, 768, 1280 and 1440px.
- The headline is one line at 1440px. The menu is centered on the page. Nothing overlaps or scrolls sideways, and the hover menus still open.

## Technical details
- `index.html`: add Outfit (600) to the existing Google Fonts link.
- `tailwind.config.ts`: add a `font-headline` family.
- `src/pages/Index.tsx`:
  - Hero markup.
  - The period goes in a `text-accent` span.
  - Remove the `.hero-dot` span. Its CSS can stay unused or be deleted.
  - Use `max-w-[40rem]` for the description.
- `src/components/Navbar.tsx`: use `grid grid-cols-[1fr_auto_1fr]` on `lg` and up, with actions `justify-self-end`. The mobile layout is unchanged.
- The logo itself is not changed. The uploaded logo image is used as a reference only, not added to the site or used as the browser tab icon.
- Update `mem://style/visual-identity`: Outfit is used for the homepage headline to match the wordmark.
