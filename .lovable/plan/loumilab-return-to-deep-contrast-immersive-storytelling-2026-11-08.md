# Loumilab — Return to Deep Contrast + Immersive Storytelling

## Direction
Restore the original off-white and deep-black identity, then make it more cinematic, in the spirit of Squarespace. The site should read as one continuous story that alternates between bright, quiet sections and dramatic black ones.

- **Colors:** luminous off-white (not beige), soft white, and genuinely rich black. The earth tones (terracotta, olive, forest, sand, brown) are removed everywhere.
- **Blue:** used only for the Blue Dot and small details such as focus rings and the reading bar. Buttons become black on light sections and off-white on dark ones.
- **Logo:** unchanged.
- **Type:** large editorial headlines with clean body text. The serif italic accent is kept only where it adds character.
- **Imagery:** AI-made and art-directed. Architecture, light and shadow, sculptural and abstract forms, and real-looking people and businesses. Every page gets its own set of images. No staged offices, laptops or coffee cups. Real product screenshots are used for Orders and Local.

## Motion system (right to left)
- **Auto sequences:** images and previews enter from the right, rest for about 5 seconds, then move off to the left. Each image stays distinct, with no crossfade mush. Sequences pause on hover or focus and have pause controls.
- **Scroll-driven sideways galleries:** vertical scrolling moves the images from right to left. Pages can have two or more where they fit, each kept short so visitors don't feel trapped.
- **Light and dark transitions:** the background changes color as you scroll, and the header switches between light and dark to match the section behind it.
- **Phone and tablet:** scroll galleries become native swipe rows.
- **Reduced motion:** visitors who turn off motion see still images and no automatic movement.

## Rollout (homepage first, then review)
1. **Foundation and homepage (this pass):**
   - New colors site-wide.
   - Homepage rebuilt: "We build what's next." over cinematic imagery, an introduction to capabilities in a right-to-left sequence, products shown on black with a scroll gallery of real Orders and Local screens, Vurtti and companies, editorial picks, and a closing call to action.
   - Header that responds to light and dark sections.
   - Refined search overlay with grouped results, suggested searches and previews.
   - About 8–10 new homepage images.
2. **Solutions:** the six service pages, each with its own image sequence (website previews, software dashboards, automation flows, security, before/after workflows, email and domain screens).
3. **Products and companies:** Orders, Local and Vurtti.
4. **Knowledge Center and The Dot.:** editorial galleries using each article's or issue's own imagery. Articles stay calm, with no extra motion inside them.
5. **About, Contact and legal pages,** then a final check on phone, tablet, desktop and speed.

After each phase I'll stop for your review.

## What stays the same
All content, page addresses, search-engine settings, the Orders setup, pricing, checkout, newsletter sign-up, and every admin and customer tool.

## Technical details
- Replace the color tokens in `src/index.css` and `tailwind.config.ts` (bg/foreground/inverse/primary). The `dot` token stays blue, and `accent` becomes neutral.
- New `src/components/brand/story/Horizontal.tsx`: `RtlSequence` (auto) and `ScrollRail` (sticky, scroll-driven translateX; native scroll-snap below `lg`; IntersectionObserver plus reduced-motion guard).
- Per-page image sets live in `src/data/imagery/<page>.ts` so sequences are never shared across unrelated pages.
- Header tone comes from `data-tone` on sections, read with IntersectionObserver.
- Upgrade the existing `SiteSearch.tsx` rather than replacing it.
- Images are lazy-loaded WebP/JPG with a still fallback for video. Update the memory index to the restored palette and record the motion-system rule in `AGENTS.md`.
