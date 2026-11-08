# Loumilab — Immersive Redesign ("Darkroom Atelier")

## What holds it back today
- Every page uses the same stacked pattern: heading, cards, band. It reads like a template, not a story.
- Images sit inside rounded boxes, so nothing feels cinematic.
- Motion is mostly fade-ins, with little that changes as you scroll.
- The palette is warm but light all the way down, so the page has no drama.

## Creative direction
The site works like a gallery after dark. It moves through deep charcoal rooms and opens onto ivory "reading rooms" for detail. Big type becomes part of each picture. Each section hands off to the next through an image, a colour shift or a moving frame, never a hard cut.

**Palette (darker, more dramatic):** charcoal #17150F as the main surface, ink brown #2A221A, forest #2F3A2A, olive #6B7A4B, terracotta #B5603C for buttons and highlights, sand #C9B99A, and ivory #F3EFE6 for reading sections.
**Blue:** used only for the Blue Dot (full stops, the reading bar, the search caret, small moments). Buttons become terracotta on dark sections and charcoal on ivory ones.
**Type:** Urbanist in very large editorial sizes, mixed with an italic serif accent for emphasis. Space Grotesk stays for body text.
**Shapes:** fewer cards. Images run to the edge of the page, sit in sculptural arch or pill-shaped masks, or are layered. A faint film-grain texture runs across the site.

## Homepage, as a scroll story
1. **Opening:** a full-screen looping AI-generated video (warm studio, hands, light). "We build what's next." is set huge across it, with the Blue Dot as the full stop.
2. **Into the work:** as you scroll, the video shrinks into an arch-shaped window and the background turns ivory.
3. **Design. Build. Innovate. Secure.:** this section stays in place while four scenes cross-fade, each with a short clip, and the word changes in large type.
4. **Products room (dark):** screenshots of Orders and Local slide and swap as you scroll, next to real-world photos.
5. **Companies:** Vurtti shown as a chapter, with its relationship to Loumilab drawn as a line.
6. **Editorial strip:** the latest Knowledge Center articles and The Dot. issues, laid out like a magazine.
7. **Closing:** a still, quiet invitation with one terracotta "Start a Project" button.

## Navigation and search
- At the top of a dark section the header is see-through. Once you scroll it turns solid, and it switches between light and dark to match the section behind it.
- Menus open as large panels with a short line describing each link and a featured image.
- Search opens full screen with instant grouped results (Solutions, Products, Companies, Knowledge Center, The Dot.), suggested searches, recent searches, and full keyboard and phone support.

## Phases (approved once, built one after another)
1. Foundation: palette, type, grain, new header, search overlay, shared scroll-motion blocks, homepage with 4–5 AI video clips.
2. Solutions and the 6 service pages: one large scene per solution, a problem-to-outcome story, and how to engage.
3. Products (Orders, Local) and Companies (Vurtti): interactive showcases.
4. Knowledge Center and The Dot.: magazine-style home pages and article layouts that stay easy to read.
5. About, Contact, Start a Project, legal and other pages; checks on tablet and phone, plus a speed pass.

## Mobile, accessibility, speed
- On phones, sections that stay in place while you scroll become simple swipeable or stacked scenes.
- Videos are short, silent, compressed and only load when on screen. Phones get a poster image first.
- People who turn off motion on their device see still images and simple fades.
- Every page keeps its current address, forms, sign-in, analytics, SEO and product features.

## Technical details
- Update tokens in index.css and tailwind.config.ts. Add a terracotta token and set accent to terracotta. Keep a dedicated `--dot` token for blue.
- Add new shared blocks in src/components/brand/story (ExpandingMedia, PinnedScenes, ColorShiftSection, LayeredParallax, ProductScrubber). These use IntersectionObserver plus scroll progress, with no new heavy libraries.
- Generate videos with the video tool (about 5–8 seconds, 16:9, plus 9:16 versions for phones) and store them as asset pointers under src/assets/video. Clips cost credits; the first pass needs roughly 5.
- Rebuild SiteSearch as a full-screen overlay. Navbar gains a scroll-aware theme driven by data-tone on sections.
- Update the Core palette memory rule (Blue Dot only, darker palette). AGENTS.md entry: immersive blocks live in brand/story.
