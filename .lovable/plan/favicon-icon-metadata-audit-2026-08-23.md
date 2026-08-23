# Favicon + Icon Metadata Audit

## What the audit found

- `public/` contains only `favicon.svg` (the Loumilab "L" monogram with the blue accent dot on a near-black square). There is no `favicon.ico`, no PNG sizes, no `apple-touch-icon.png`, and no `site.webmanifest`.
- `index.html` declares exactly one icon: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. No legacy or default icon link remains.
- No Lovable branding exists in titles, descriptions, Open Graph tags, Twitter tags, or the Organization JSON-LD. The only "lovable" string in the codebase is the auto-generated backend client file, which is internal and not user-facing.
- `robots.txt` does not block any icon path (it only disallows `/admin`, `/login`, `/insights`).

So the metadata is already clean. The real gap is that the site ships an SVG-only icon and no `/favicon.ico` — the classic file crawlers and some Google Search surfaces still request by default. That is the most likely reason a generic icon shows in search results.

## Plan

1. Generate a square raster icon set from the existing Loumilab mark (same design, same colors — nothing about the logo changes):
   - `public/favicon.ico` (multi-size 16/32/48)
   - `public/favicon-32x32.png`
   - `public/favicon-192x192.png`
   - `public/apple-touch-icon.png` (180x180)
   - keep `public/favicon.svg` as the crisp modern icon
2. Declare all of them in the global `<head>` of `index.html`, which applies to every route in this single-document app:
   - `rel="icon"` for the SVG, the 32px PNG, and `favicon.ico` (with `sizes="any"`)
   - `rel="apple-touch-icon"` for the 180px PNG
   - `rel="manifest"` pointing at `/site.webmanifest`
3. Add `public/site.webmanifest` with the Loumilab name, short name, the 192px icon (plus a 512px variant so installability metadata is complete), the brand background/theme colors already used in the design tokens, and `display: standalone`.
4. Verify locally that every icon URL returns HTTP 200 with the right `Content-Type` (`image/x-icon`, `image/png`, `image/svg+xml`, `application/manifest+json`) and that the bytes are real images.
5. Confirm `robots.txt` leaves all icon and manifest paths crawlable, and re-check the built homepage HTML for any leftover default/placeholder icon reference.

## Technical notes

- Icons are rasterized from `public/favicon.svg` with ImageMagick so the mark stays pixel-identical to the current brand, padded (not stretched) into the square canvas.
- Manifest theme/background colors come from the existing brand values already in `favicon.svg` (`#0A0A0B` surface, blue accent) — no new colors introduced.
- No page design, component, route, copy, or SEO text changes.

## After deploy

Search engines cache favicons on their own schedule, so the search result icon can lag the fix by days even once every URL serves correctly. A hard refresh shows the browser tab icon immediately.
