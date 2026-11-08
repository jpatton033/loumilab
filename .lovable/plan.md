# Homepage: immersive, always-moving redesign

Homepage only. Keeps the logo, the headline "We build what's next.", off-white and deep-black sections, and Loumilab Blue only for the Blue Dot and small details.

## Your choices
- AI-generated cinematic video clips
- Energetic motion that runs on its own
- Sections kept: Studio services, Orders & Local, Knowledge Center & The Dot. Vurtti/Companies is removed from the homepage.
- Website previews use real Loumilab pages

## Page composition (top to bottom)
1. **Opening (off-white):** a large "We build what's next." headline. Behind and through it, a band of video and image tiles moves right to left on its own: architecture, light, and real Loumilab screens. Tiles move at different speeds and depths.
2. **What we build (deep black):** four lanes for Websites, Custom software, AI & automation, and Cybersecurity. Each lane is a moving row of matching previews (real site screens, app interfaces, workflow visuals, security visuals) that loops without a visible jump. Each lane has a short label and a link.
3. **Statement (off-white):** "Design. Build. Innovate. Secure." in large type. The words change on a timer and are paired with full-bleed crossfading clips.
4. **Orders & Local showcase (deep black):** real storefront, dashboard, and Local screenshots slide in from the right in layered, slightly tilted frames on a timed cycle, with one "Get Started" button.
5. **Knowledge Center & The Dot. (off-white):** an editorial row of the latest articles and issues that drifts right to left and pauses on hover or focus.
6. **Closing (deep black):** "Start a Project" with a slow looping clip in the background.

## Motion rules
- The main motion runs on timers and CSS loops, not on scroll. The page keeps moving when the visitor is still.
- Movement runs right to left. Each tile stays sharp and readable, with no blurring together.
- Every section uses a different treatment: marquee band, lanes, crossfade, layered stack, and drift.
- Natural scrolling: all scroll snapping, pinned sections, and scroll-driven sequences are removed from the homepage.
- Motion pauses when the tab is hidden or a section is off-screen. Visitors who ask for reduced motion see still images and still frames. Hover and focus pause a row, and a pause button is always available.
- Phones get fewer, larger tiles and one lane at a time instead of a smaller desktop layout.

## Media
- About 5 new AI video clips (8–10s, silent loops): architecture with moving light, a hand sketching a layout, light across a sculptural form, a storefront at dusk, and an abstract data/light flow.
- About 4 new art-directed stills, in black and white or neutral tones.
- Fresh screenshots of loumilab.com pages, the Orders storefront and dashboard, and Local.
- Clips load lazily, play muted with inline playback, and use a poster image.

## Header & search
- The header switches between light and dark to match the section behind it, and dropdowns get the same refined surface.
- Search gets grouped results (Pages, Services, Articles, The Dot.) and suggestions when the box is empty.

## Technical details
- New shared motion pieces in `src/components/brand/story/Horizontal.tsx`: AutoMarquee (CSS transform loop with duplicated track), LaneRows, TimedCrossfade, LayeredStack. All pause through IntersectionObserver and visibilitychange, and switch off with prefers-reduced-motion.
- Remove the homepage's ChapterSequence, PinnedScenes, and ScrollRail usage. Those components stay available for other pages.
- Videos are stored as lovable-assets pointers under `src/assets/video/home/`.
- Check at 390, 768, and 1280 widths, with reduced motion on, and confirm there is no horizontal overflow.
