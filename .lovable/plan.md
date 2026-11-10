# Cinematic Motion Refinement (no redesign)

Keep every page, color, font, word, menu and logo as they are. Change only how sections enter, move and hand off to each other while scrolling. Normal scrolling stays free: nothing locks the page or makes visitors wait.

## Phase 1 — Shared scene transitions (used site-wide)
A small set of transitions, used with variety, never the same one twice in a row:
- **Lights down**: the light page dims to deep black as a dark section approaches (scroll-linked, solid colors, no long gradients).
- **Lights up**: the reverse, light spreading outward into an off-white section.
- **Expanding frame**: a framed image grows to near full-screen, then its text follows.
- **Overlap**: the next section slides up over the previous one, which recedes slightly (scale and dim).
- **Scale headline**: oversized headlines that shift slightly in size or position with scroll.
- **Gentle depth**: light parallax on photos inside their frames.

All of these switch off for reduced-motion users, pause offscreen, and are simplified on phones.

## Phase 2 — Homepage
- Hero "We build what's next.": the video gently zooms out and dims as you scroll, the headline lifts away, and the next section emerges.
- Technology Studio: expanding frame opening into a wide image.
- Workflow Optimization: given its own section, with a clean animated "messy steps become one simple flow" sequence (lines and labels, no AI imagery).
- Orders: replace website screenshots with an expanding photo scene plus short animated reveals of what Orders does (orders in, ready, paid).
- Business Email & Domain: calm, restrained reveal; more prominent placement.
- "Less managing. More business.": images recomposed so nothing is cropped awkwardly; a split that eases from busy to calm.
- The Dot. & Knowledge Center: subtle editorial entrance only; cards stay still.
- Final call to action: lights-down into deep black, large headline and one button, then the existing footer.

## Phase 3 — Other pages, each with its own rhythm
- Solutions / Technology Studio: architectural scale, expanding frames.
- Workflow Optimization: structured, step-by-step motion.
- Orders & Pricing: product-focused reveals and overlap transitions.
- Business Email: minimal, steady transitions.
- Products / Companies: controlled horizontal showcase.
- Knowledge Center, The Dot., article pages: only quiet entrances; reading areas never move.
- About, How We Work, Contact, Local, Business Tools: one or two transitions each.

Phases roll out in order without re-asking; I'll check each on desktop and phone.

## Not included
No new pages, no copy changes, no particles, glows, 3D objects or device mockups, no scroll-locking.

## Technical details
- Extend `src/components/brand/story` (Immersive.tsx etc.) with `SceneTransition` variants (lightsDown, lightsUp, expand, overlap), `ScaleHeadline`, `DepthImage`; driven by framer-motion `useScroll`/`useTransform` (transform/opacity only, GPU-friendly).
- Shared `useCinematicMotion` guard: `prefers-reduced-motion`, IntersectionObserver pause, reduced intensity under 768px.
- Pages keep `PageHero` from Flow.tsx; transitions sit between existing sections. Blue stays reserved for the Dot.
- Record the motion-system rule in AGENTS.md; update roadmap.md with the phases.
