# Homepage milestone 1: dark mega menu and cinematic hero gallery

Both briefs together. This milestone covers only the header menu and the homepage opening. Everything else waits for your review. Your five images are used only as layout and mood references. None of them goes on the site.

## What stays the same
- The logo, "We build what's next.", the menu destinations and every page address.
- Search, sign-in, analytics, forms and all other pages.
- The Blue Dot and the blue reading bar.

## 1. Mega menu (desktop)
- Clean header on the off-white page. When you point at Solutions, Products or Resources, a full-width panel in deep black (#080808) opens directly under the header. It is not a floating card.
- Inside the panel: column labels in small gray capitals, large white link names, a one-line gray description under each link, and a small image preview on the right.
  - **Solutions:** Technology Studio / Managed Business Technology
  - **Products:** Orders, Local, Vurtti
  - **Resources:** Knowledge Center, The Dot.
- **Opening:** the panel opens in about 280 ms and the links fade up about 10 px in about 200 ms, with a smooth ease-out.
- **Moving between menus:** the panel stays open. Only the content changes, with a quick crossfade, and the height adjusts smoothly.
- **Closing:** a short delay stops the menu from flickering while you move the pointer down into it. It also opens on click, closes with Escape, works with the keyboard and shows clear focus outlines.
- **Phones:** a full-screen black menu with expandable sections, using the same content.

## 2. Hero (off-white)
- A centered, very large "We build what's next." with the Blue Dot as the full stop. The headline does not animate.
- Supporting line: "Thoughtful technology, distinctive digital experiences, and software built for what's next."
- Two buttons: **Explore Our Solutions** (main) and **See What We Build** (outline), which scrolls down to the gallery.
- The gallery starts within the first screen on desktop, so its top edge is visible.

## 3. Cinematic gallery (deep black)
- A clean, full-width cut from off-white to deep black, with no fade between them. The gallery is about 450–650 px tall depending on screen size.
- Previews have different shapes (wide pages, taller app screens), clean edges, tight rounded corners and no fake laptop or browser frames.
- They move right to left on their own, continuously, with no scrolling, clicking or hovering needed.
- The loop lasts about 24–30 seconds. A new main visual comes forward every 4–6 seconds, and the speed eases slightly between categories.
- Pointing at a preview shows a small label ("Loumilab Orders →") and a link to that product. Motion keeps going.
- Motion pauses when the gallery is off-screen or the tab is hidden. Visitors who prefer reduced motion get a still arrangement. A small pause button is included for accessibility.

### Storyboard and media
| Scene | Time | What shows | Source |
|---|---|---|---|
| 1 Website development | 0–5 s | Business Email page, Services page | Real Loumilab screenshots |
| 2 Custom software | 5–10 s | Orders dashboard with a status that updates by itself | Real screenshot plus a small built-in animation |
| 3 Loumilab Orders | 10–15 s | Storefront, then Pricing | Real screenshots |
| 4 AI and automation | 15–20 s | Workflow Optimization page with its moving two-lane drawing | Real page |
| 5 Local and ideas | 20–25 s | Local directory, Knowledge Center, The Dot. | Real screenshots |
| 6 Studio moment | 25–30 s | The existing arch-light video clip | Existing clip |

### Missing media
- No real Vurtti screenshot.
- No cybersecurity visual.
- No real client website besides Loumilab's own pages.

I will capture fresh, sharp screenshots of the real Loumilab pages. For the gaps, see Question 3.

## 4. Scrolling
I will remove all forced scrolling: no snapping, no jumps between sections, no scroll locking and no scroll-driven pinned sections in the opening. The page scrolls normally, and the gallery runs on its own timer.

## Questions to confirm (defaults in brackets)
1. **Buttons:** your reference images use blue buttons, but the current rule is black buttons with blue only for the Dot. [I'll keep black on light and off-white on dark, with the header's Start a Project button in blue.]
2. **Third menu:** the brief mentions "Explore". [I'll keep the label "Resources".]
3. **Missing Vurtti and cybersecurity visuals:** [I'll capture the live Vurtti site and leave cybersecurity out of the gallery until you supply or approve an image.]

## Technical notes
- New `CinematicGallery` in `src/components/brand/story/Horizontal.tsx`. It uses `requestAnimationFrame` and `translate3d` on a duplicated track for a seamless loop, with a speed curve tied to scene boundaries, an IntersectionObserver, `visibilitychange` and `prefers-reduced-motion` handling. Images are lazy-loaded with fixed aspect ratios, so the page doesn't jump.
- New `MegaMenu` in `Navbar.tsx`, built from `src/data/navigation.ts` (adding descriptions and preview images there). It uses one shared panel with measured-height transitions, a hover-intent delay and Escape/focus handling.
- `src/pages/Index.tsx`: I'll replace only the hero area. I'll remove pinned/scroll-progress use in the opening and any `snap-*` CSS.
- I'll update AGENTS.md (motion rule) and roadmap.md. Front end only.
