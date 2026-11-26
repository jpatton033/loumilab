# Homepage hero refresh — "Human Potential — The Next Chapter"

## What changes
1. **New background film (six scenes, ~30s total, ~5s each)**
   Curiosity (face in soft white light) -> Imagination (hands sketching) -> Creation (developer, screens secondary) -> Impact (merchant handling real orders) -> Discovery (researcher by architectural windows) -> Tomorrow (silhouette facing a dawn skyline, fading to black so the loop returns to scene 1).
   One shared look: obsidian blacks, cool white light, no gold cast, no neon, holograms, robots or floating code, diverse cast, light grain.
2. **Separate phone versions**: each scene is also made in portrait framing so people aren't cropped out on phones.
3. **New poster still** taken from the Curiosity scene. It replaces the arch-light image and shows when video can't play, on slow connections, or with reduced motion.
4. **Hero copy**: the headline "We build what's next." stays. The supporting line becomes "Software, digital infrastructure, and intelligent technologies built to move people and businesses forward." The "Explore Our Solutions" button stays.
5. **Pathways**: the pill-shaped "On this page" bar is replaced by three quiet text links: Studio, Products, Managed Services. They use the existing pages from the site menu.
6. **Pause control**: a small, keyboard-accessible pause/play button sits in the hero corner.
7. **Overlay**: the heavy black wash becomes a lighter overall dim, a gradient behind the text, and an obsidian fade at the bottom that runs straight into the next section.
8. **New "Ideas into impact." section** right after the hero, using the copy from your brief. It is a curated portfolio of real screenshots already on the site: custom websites (sample sites), Orders, Spaces, Senti, Workflow Optimization and Managed Services. Each one is labeled Available, Beta or In research. The current hero has no preview cards, so nothing needs to move out of it.

## Cost and approval step
- Making the film means generating 12 clips (6 wide, 6 portrait), about 60 seconds of video, plus 7 keyframe images.
- First I generate the keyframe images and show them to you. Your approval there approves the video spend, and I'll give you the credit estimate at that point.
- Until the new film is ready, the current film keeps playing, so the page never points to missing files.

## Not changed
Other pages, pricing, sign-in, tracking (Meta Pixel and Google tags), search titles and descriptions, and all link destinations.

## Technical details
- `src/data/homeHero.ts`: one central scene list (id, wide src, tall src, poster, duration), so scenes can be swapped or reordered.
- Refine `VideoSequence` in `Cinematic.tsx`:
  - Pick the wide or tall source with `matchMedia`.
  - Preload only the next clip, use 1.2s crossfades, and pause when the page is hidden or off-screen.
  - Support reduced motion and the pause state.
  - Show text immediately, without waiting for video.
- Assets: MP4 via lovable-assets with descriptive names (`hero-curiosity.mp4`, `-tall`, etc.). Re-encode with ffmpeg (H.264, about 2–3 Mbps wide and 1.5 Mbps tall) and add WebM where it's smaller.
- Use `svh` height and safe-area padding. Check the layout at 390, 778 and 1280 px with Playwright.
- Old hero clip pointers stay until the new film is approved, then they are deleted.
