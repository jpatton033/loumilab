# Update the Loumilab logo sitewide

## Goal
Match the uploaded logo everywhere the Loumilab logo appears: the header, the footer and the admin area. The new logo has wider letter spacing, even all-caps letters with no larger first "L", charcoal lettering, and a round blue dot sitting on the baseline with a small gap after the "B".

## Changes
1. **Redraw the shared logo** to match the image:
   - All letters the same size. The current larger first "L" goes away.
   - Wide, even letter spacing in a clean geometric bold weight.
   - A true round blue dot, about the height of a lowercase letter, sitting on the baseline with a small gap after the "B", instead of a typed period.
   - Charcoal letters and the existing Loumilab blue for the dot.
2. **Keep the header animation.** The letters still appear left to right and the dot still arrives last and settles, now landing in the new dot position. The homepage dot still waits for the logo, and reduced-motion settings still show the finished logo right away.
3. **Keep the logo sharp and selectable as real text**, so it stays crisp at every size and screen readers still read "Loumilab". The uploaded image is the visual reference; it won't be placed as a picture.
4. **Check sizing** so the wider logo fits the header on phones and narrow desktops without crowding the menu.

## Not changing
- The favicon (the dark tile with the "L" and dot), page layouts, navigation and copy.

## Technical details
- Update `src/components/brand/Wordmark.tsx` and the related `.brand-wordmark-*` styles in `src/index.css`. Navbar, Footer and AdminShell keep using the same component.
- Use letter-spacing of roughly 0.18–0.22em, remove the `lead` size, and render the dot as a rounded span sized in `em` so the existing dot keyframes still apply.
- Verify with Playwright screenshots at 390px and 1280px, plus reduced motion, against the uploaded image.
