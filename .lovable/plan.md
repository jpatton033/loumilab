# Favicon redesign — light charcoal direction

## Goal
Replace the current dark favicon with a light version that fits the refreshed light-premium website: white rounded square, deep charcoal "L", Loumilab blue dot — same "L." monogram, new treatment.

## Changes

1. **Redraw `public/favicon.svg`**
   - White rounded-square tile (rx 14, same 64x64 geometry as today).
   - Charcoal "L" (`240 6% 10%` → `#17171A`), same letterform and dot spacing approved in the earlier favicon refinement (dot near the L's baseline, clear gap).
   - Blue dot `hsl(217,91%,55%)` — the same accent used in the Wordmark.
   - Hand-written vector SVG (not the raster mock), so it stays crisp at every size.

2. **Update `public/safari-pinned-tab.svg`**
   - Same geometry, black fill, no tile background (mask format).

3. **Regenerate the raster set from the new SVG** with ImageMagick:
   - `favicon-32x32.png`, `favicon-192x192.png`, `favicon-512x512.png`
   - `apple-touch-icon.png` (180x180)
   - `favicon.ico` (multi-size 16/32/48)

4. **Theme color updates**
   - `index.html`: `<meta name="theme-color">` changes from `#0A0A0B` to white so the browser UI matches the light site.
   - `site.webmanifest`: `background_color` and `theme_color` change from `#0A0A0B` to `#FFFFFF`.

5. **Verify**
   - Every icon URL returns HTTP 200 with the right content type and real image bytes.
   - Close-up screenshots at 16px/32px confirm the charcoal L and blue dot stay legible on a white tile.
   - `robots.txt` still leaves all icon paths crawlable; no other files change.

## Not changing
- The logo, Wordmark, or any page design — the favicon is the only visual change.
- No new colors: white, charcoal, and the existing blue accent all come from the current design tokens.
