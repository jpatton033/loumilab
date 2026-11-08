# Site-wide flow refinement: footer, homepage, and photo heroes on every page

## 1. Footer fixes
- Logo: take the white pill/bubble off. Show the regular Loumilab wordmark with its colors inverted (off-white on the deep-black footer). The logo itself stays the same.
- Link hover: links currently turn blue or dark and seem to vanish. On hover they will turn bright white (full off-white) with a light underline. This covers the email link and the legal links too.

## 2. "Ideas worth reading" on the homepage
- Replace the scrolling article strip, whose mixed article cover images clash with the rest of the page, with a calm dark section: one featured article plus 3 text-led cards on solid dark surfaces with hairline borders. Article covers appear only as small, matching-toned (desaturated) thumbnails.
- Fold the section into the dark part of the page so it doesn't break the light/dark rhythm.

## 3. Bring the homepage back to the refined look
- Go back to the original restraint: fewer visual tricks, more whitespace, one main button per section, and Satoshi headlines that end in a period.
- Page order: full-bleed photo hero, a short statement on off-white, then a smooth fade into deep black for the product and gallery sections, ending in the black footer.
- Drop the extra or overlapping motion. Keep at most three moving moments, with the right-to-left gallery staying.

## 4. One flow for every page
A shared photo hero opens every public page, modeled on the Squarespace screenshot:
- A full-width art-directed photo chosen for that page, with a headline centered in white over a soft dark overlay, one button, and optional quick links in a dark pill (for example "Packages · How it works · FAQ").
- Under the hero, the page fades from the photo into off-white content, then into the deep-black contrast sections, and ends at the black footer.
- The header goes see-through over the hero and turns solid once you scroll.

Pages covered: Solutions/Services and each service page (Web, Software, Cybersecurity, Workflow, Business Email), Products, Orders, Orders Pricing, Local, Business Tools, Comparisons, Knowledge Center, The Dot., About, How We Work, Work, Contact/Start a Project.
Article pages, dashboards, admin, sign-in and checkout keep their current layouts.

## 5. Imagery
- New AI art-directed photos, one per page and none reused: architecture, light and shadow, real-looking people at work, in warm neutral tones that match the deep black and off-white. Blue appears only in the Dot.
- Existing editorial photos stay where they already fit.

## Technical details
- Footer.tsx: remove the `rounded-full bg-foreground` wrapper, render Wordmark in its inverse variant, and change `linkCls` hover to `hover:text-background`/bright inverse foreground plus underline.
- New `PageHero` in src/components/brand/flow (image, title, CTA, quick links, overlay) plus a `ToDark` gradient transition block; the Navbar reads a transparent-over-hero flag.
- Index.tsx: rebuild the reading section as a static grid inside the dark band and trim the motion sections.
- Each listed page swaps its current opening section for PageHero; images are generated into src/assets. Then update roadmap.md.
- Check at 390px, 778px and 1280px for overflow, contrast and hover states.
