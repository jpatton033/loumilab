# Spaces homepage: one continuous cinematic experience

Only the Spaces homepage (`/spaces`) changes. Product wording, buttons, the dashboard, deploying and sharing all stay as they are.

## What changes for visitors
- **Mostly dark page.** The current switching between light and black sections goes away. Deep black runs from the hero to the closing section.
- **Richer colors for Spaces only.** Midnight blue, dark teal, forest green, burgundy, burnt copper and warm ivory show up as light, glows and photo tones, not as solid section blocks. The rest of Loumilab keeps its black and off-white look, and the blue dot stays reserved.
- **Colors shift without fading.** Each chapter gets a soft glow that drifts in from the edge and overlaps the next one, tied to a photo or a crop of its texture. Backgrounds never fade on scroll and there are no hard section edges.
- **Nine chapters, in the brief's order:** Create (the existing film), Build Anywhere, Deploy, Preserve (Passport), Own & Export, Standardize (spec + starter kit download), Organize (Library), Share & Manage, and a closing section that echoes the hero.
- **Varied layouts.** Full-width photos, large type on its own, product previews on screen, small intimate photos and layered pieces, instead of the same two columns repeated.
- **Real-looking product views.** Coded previews of deploy, Passport, export, Library and sharing that match what Spaces actually does. No made-up features.
- **People and places.** About 6 new photos made for this page (makers, a musician, a developer, a craftsperson, a small-business owner, a team) showing a natural range of people, plus texture and building images. None reuse photos from other pages.
- **Motion.** A short reveal per chapter, gentle photo drift and hover depth. No repeated fade-ups, no scroll locking or snapping, and still images for people who turn motion off.
- **Phones.** Phone-specific photo crops, single-column layering, lighter motion and smaller type.

## Technical details
- New `src/components/spaces/flow/`: `Atmosphere` (a fixed, GPU-cheap layered glow driven by a `--p` var, transform and opacity only), `Chapter` (number, headline, layout variants), `CinemaFrame`, plus product preview mockups.
- The extra colors become `--spaces-*` HSL tokens scoped to a `.spaces-theme` wrapper in `index.css` and are used only on this page.
- Reuse the existing Scene/`--p` system. No new animation libraries. Images go in `src/assets/spaces/` with the existing WebP pipeline, lazy-loaded below the hero.
- Rewrite `src/pages/spaces/Home.tsx`. The hero film stays, and the closing CTA reuses its poster.
- Check at 1280, 778 and 390 widths for overflow, errors and reduced motion, then run the quality review in the brief.
