# Use the exact uploaded Loumilab logo image

## Goal
Show your uploaded logo image itself everywhere the Loumilab logo appears (header, footer, admin), only trimmed and resized. No redrawing.

## Changes
1. Prepare the image: trim the extra white space around the letters and make the white background transparent, so it sits cleanly on any page color. Letter shapes, spacing, colors and dot stay exactly as uploaded.
2. Replace the drawn text logo with this image in the header, footer and admin area, sized to fit the current logo height on phone and desktop.
3. Keep "Loumilab" as the spoken label for screen readers and the logo link working as now.
4. Animation: the current letter-by-letter and dot animation can't run on a flat picture. The header will instead show a soft fade-in (left-to-right reveal) of the whole logo once per reload, and the homepage dot will still wait for it to finish. Reduced-motion users see it immediately.

## Not changing
Favicon, layouts, navigation, copy.

## Technical details
- Process `LOUMILAB._Minimalist_Blue_Dot_Logo.png` with ImageMagick (trim, white to transparent) into `src/assets/brand/loumilab-logo.png`; also export a 2x version for sharp display.
- `Wordmark.tsx` renders the `<img>` (height in em per size), keeps `animated` prop with a clip-path reveal, and fires `onAnimationComplete` on animation end so Navbar sync is unchanged.
- Verify with Playwright at 390px and 1280px against the upload.
