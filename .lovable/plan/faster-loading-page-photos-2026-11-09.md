# Faster-loading page photos

Opening photos are 100–330 KB full-size JPGs, sent at the same size to every screen, so they show up about a second after the page.

## What changes
1. **Smaller, modern files.** Each photo gets converted to WebP and AVIF in several widths (640, 1024, 1600, 1920) at build time. Phones download roughly 30–60 KB, desktops about 80–120 KB. The JPG stays as a fallback.
2. **Right size per screen.** The opening photo uses `srcset`/`sizes`, so each browser picks the smallest version that still looks sharp.
3. **No empty flash.** A tiny blurred preview of the same photo, under 1 KB and built into the page, shows right away. The full photo then fades in over it.
4. **Same treatment lower on the page.** The other story and editorial images get the same smaller formats and keep lazy loading, since they sit below the first screen.

## Technical details
- Add `vite-imagetools`. Make a `heroImage()` helper (`src/lib/images.ts`) that imports `?w=640;1024;1600;1920&format=avif;webp;jpg&as=picture` plus a `?w=24&format=webp&inline` placeholder.
- Hero assets are imported in the hero page files. Change those imports to the picture query, then update `PageHero` to accept `image: string | Picture` and render `<picture>` with `fetchpriority="high"`, `decoding="async"`, the blurred background and an opacity fade on load. Plain strings keep working.
- Apply the same picture import to the `Frame`/`PhotoSplit` images in story components.
- Check: measure hero image bytes and load time at 390px and 1280px, before and after.
