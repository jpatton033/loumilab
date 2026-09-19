# Refine favicon dot spacing

## Goal
Increase the visual breathing room between the favicon’s white "L" and the blue dot so they no longer feel touching.

## Current state
- `public/favicon.svg`: dot is `cx="45.5" cy="45.5" r="4.5"`; its left edge sits only 1 unit from the right edge of the L’s bottom stroke.
- Derived raster/ICO icons in `public/` were generated from this SVG.
- `public/safari-pinned-tab.svg` uses the same geometry in black.

## Changes
1. **Adjust the SVG**
   - Move the dot center right to `cx="48" cy="45.5"` and keep `r="4.5"`.
   - This creates roughly a 3.5-unit gap between the L and the dot while keeping the dot anchored near the baseline.
   - Update `public/safari-pinned-tab.svg` with the same geometry.

2. **Regenerate derived assets from the SVG**
   - `favicon-32x32.png`
   - `favicon-192x192.png`
   - `favicon-512x512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

3. **Verify**
   - Confirm the build still passes.
   - Take a close-up screenshot of the browser tab/bookmark icon to confirm the dot no longer touches the L at 16/32 px sizes.
