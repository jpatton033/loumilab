# Remove unused favicon.ico

## Goal
Remove the unused `public/favicon.ico` so only the active `public/favicon.svg` (referenced in `index.html`) remains.

## Steps
1. Delete `public/favicon.ico`.
2. Confirm `index.html` still links to `/favicon.svg` and the file exists.
3. Run the test/typecheck suite to ensure no build references break.

## Notes
- Browsers cache favicons aggressively; the change may not appear instantly for returning visitors. A hard refresh (Ctrl/Cmd + Shift + R) or clearing cache typically forces the new icon. Some browsers may still request `/favicon.ico` by default, but the active `<link rel="icon">` tag in `index.html` points crawlers and modern browsers to the SVG.
