# Favicon redesign — dark refined direction

## Goal
Replace the current favicon with the "dark refined" concept: the existing near-black rounded tile stays, but the monogram is redrawn with cleaner proportions — a slimmer, better-balanced white "L" and a blue dot sitting clearly to the right of the L's baseline with visible breathing room (the original "dot too close" issue is fully resolved).

## Changes

1. **Redraw `public/favicon.svg`**
   - Keep the near-black rounded-square tile (`#0A0A0B`, rx 14, 64x64 geometry as today).
   - White "L" with refined, slightly lighter proportions matching the concept image (less blocky than the current mark, optically centered).
   - Blue dot `hsl(217,91%,55%)` — same accent as the Wordmark — repositioned right of the L with a clear gap, matching the concept.
   - Hand-written vector SVG (not the raster mock), so it stays crisp at every size.

2. **Update `public/safari-pinned-tab.svg`**
   - Same refined geometry, black fill, no tile background (mask format).

3. **Regenerate the raster set from the new SVG** with ImageMagick:
   - `favicon-32x32.png`, `favicon-192x192.png`, `favicon-512x512.png`
   - `apple-touch-icon.png` (180x180)
   - `favicon.ico` (multi-size 16/32/48)

4. **Theme colors — no change**
   - `index.html` theme-color and `site.webmanifest` background/theme already use `#0A0A0B`, matching the dark tile; leave them as is.

5. **Verify**
   - Every icon URL returns HTTP 200 with the right content type and real image bytes.
   - Close-up screenshots at 16px/32px confirm the white L and blue dot stay legible on the dark tile, and the dot no longer touches the L.
   - `robots.txt` still leaves all icon paths crawlable; no other files change.

## Not changing
- The logo, Wordmark, or any page design — the favicon is the only visual change.
- No new colors: near-black tile, white, and the existing blue accent all come from the current brand.
