# The Blue Dot Experience

This builds on the dot moments already on the site. Instead of separate effects, the dot gets one personality: a small set of behaviours, each with a clear job. Every page uses only the behaviours that fit it. Layouts, wording, navigation, search setup and tracking stay as they are.

## The dot's personality
It's precise, curious and helpful. The dot always arrives with intent, does one thing, then steps back. It never floats, pulses on a loop or glows. Every movement follows one shared timing curve and one set of speeds, so it feels like the same character everywhere.

## Five behaviours (the vocabulary)
1. **Arrive.** The dot drops in, overshoots slightly and settles. Used once per page to mark where the story starts. This is the current marker, refined.
2. **Connect.** The dot draws a line from one idea to the next and hands off between sections. This is the current thread, refined so it reaches toward the next heading.
3. **Focus.** The dot opens into a thin ring over a photo or key figure, then closes. This is the current lens, used on fewer, better-chosen photos.
4. **Act.** On main buttons, the dot sits at the button's edge. On tap, click or keyboard press, it pushes into the button and fills it for a moment. This works on touch screens and doesn't rely on hover.
5. **Reveal (new, the signature moment).** The dot grows to fill a section's background and wipes the next section into view, then shrinks back to a dot and parks in the corner. It's used at most once per page, on the most important transition.

One quiet extra is the **page dot**. On page change, a small dot travels across the top bar from left to right as the new page loads, then lands beside the LOUMILAB logo and fades out. It replaces nothing, takes about 0.6 seconds and only appears when moving between pages.

## How each area uses it (connected, not repetitive)
- **Homepage:** Arrive (after the logo animation, as now), plus one Reveal into the Orders tile, and Act on the main buttons.
- **Services:** Connect links Design, Build, Innovate and Secure in order, like a circuit. Act appears on the closing button.
- **About:** Focus on the team photo, and Arrive on the story headline.
- **Products:** Each product card's dot takes on that product's role. On Orders it's a "new order" dot, and on Vurtti a "checked" dot.
- **Orders:** Keeps the new "Don't sign up" strike. The dot also lights up each step of the store assembly, and Act sits on every "Build your store" button.
- **Local:** The dot becomes a map pin that drops onto the search area and onto business cards as they appear, for discovery.
- **Resources:** The dot works as a reading marker, a thin progress line on article pages with the dot at its tip.
- **The Dot. newsletter:** The issue number sits inside the dot, and signing up gets a single satisfying "settle" confirmation.
- **Contact:** After a message is sent, the dot draws a check mark, then settles.

Sections with no dot stay that way on purpose. There's a limit of about 3–5 dot moments per page.

## What stays ruled out
- No blue dots replacing ordinary full stops in text (as you asked earlier)
- No floating particles, loops or glows
- No dot that covers text or buttons
- No hover-only effects

## Quality checks
- Everything respects reduced motion: the dot appears in its final position with no movement.
- Animations only start when a section scrolls into view, with no loading delay and no page jumping.
- I'll check it on phone, tablet and desktop, with keyboard and with touch. The cookie banner, tracking and search setup won't be touched.

## Technical details
- `src/components/brand/dot/` becomes the system. A `tokens.ts` file holds the shared easing, speeds (fast 240ms / base 600ms / signature 1100ms), size scale and an `useDotMotion` reduced-motion hook. There are new primitives: `DotReveal` (clip-path circle wipe, IntersectionObserver, transform/opacity/clip-path only), `DotAction` (wraps Button and expands on `pointerdown`/`Enter`), `DotPin`, `DotProgress` (article scroll progress, rAF-throttled), `DotCheck` (SVG stroke draw) and `RouteDot` (listens to location in Layout).
- Existing `DotMarker`, `DotThread` and `DotLens` are retuned to the shared tokens, so behaviour changes but their APIs stay the same.
- Per-page wiring touches only the pages listed above, adding or removing components without changing content or structure. The CSS lives in one `index.css` block under `.ldot-*`.
- AGENTS.md: the dot rule is updated to name the five behaviours, the single Reveal per page, and the ban on punctuation replacement.
- Frontend only, with no backend changes.
