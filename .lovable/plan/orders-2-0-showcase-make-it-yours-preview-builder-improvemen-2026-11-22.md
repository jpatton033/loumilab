# Orders 2.0: Showcase, "Make It Yours" preview, builder improvements

## Guiding rule: one design system
The homepage showcase, the public "Make It Yours" preview and the merchant website builder all use the same design format and the same website renderer the live stores use. Every look a visitor creates on the public preview can be opened in the builder and published unchanged. If a control can't be saved by the builder, it doesn't go in the public preview.

Today, the homepage demo is a simplified copy of the builder's look with its own settings. The plan replaces it with the real renderer.

## Phase 1: Audit and shared foundations
- Audit the current builder across the 13 areas in the brief (what works, what's missing, bugs). The written audit goes in the reply, and anything it rules out comes off the public preview.
- Add to the shared design format, without breaking existing designs (older saved designs get defaults):
  - Hero layout: full-width image, split image and text, centered editorial.
  - Named style presets (Editorial, Bold, Minimal) and curated color palettes, each a bundle of existing theme values.
  - Font pairings built from the existing approved font list.
  - Button style, content width and card style as global settings.
- Add these controls to the builder's design panel first, so the merchant editor can always do more than the public preview.

## Phase 2: Showcase slideshow (homepage + /orders)
- Six example websites (bakery, streetwear, catering, beauty, home services, creative professional), each a saved design drawn by the real store renderer, not screenshots.
- 5–6 second crossfades, previous/next, dots, pause, swipe, reduced-motion still, and a desktop/phone toggle.
- "Start With This Template" opens setup with that design. "Explore This Design" appears only where a real example store exists. No dead buttons.

## Phase 3: "Start with a design. Make it yours." (/orders)
- Controls on the left, live website on the right (stacked on phones): style preset, palette (+ custom color), fonts, hero layout, a few predefined section orders, desktop/phone view, Reset Design.
- The phone view is a real narrow frame, so the layout reflows the way real stores do. It is not a shrunken desktop image.
- The renderer loads only when the section scrolls into view, so it doesn't slow the page down.

## Phase 4: Carry the design into sign-up
- "Start With This Design" saves the chosen design as a short-lived draft on the visitor's device (24 hours, no personal details). It goes through the existing setup flow and survives sign-in.
- After sign-up, the draft is checked against the design rules again and becomes the merchant's builder draft. Their business name and products fill in. Nothing is published automatically.
- "Explore More Templates" scrolls to the showcase.

## Phase 5: Builder workflow (later, separate approval)
Add/duplicate/hide sections, product display options, header and footer settings, multiple pages and template switching that keeps content. Each is scoped after the audit.

## Held for your decision
- Button wording: the brief asks for "Build Your Website — Free" and "Start With This Design — Free". You previously kept "Get Started". I'll use "Get Started" on the slideshow and "Start With This Design" under the preview unless you say otherwise.
- Launch/Build/Grow names and the 5%/2.5%/1.5% fees stay off the site. Premium-only controls get a small plan label using the current plan names.
- Custom domains stay labeled "Coming soon".

## Technical details
- One source: `src/lib/orders/builder/schema.ts` (zod) gains optional fields with defaults (`theme.buttonStyle`, `theme.contentWidth`, `theme.cardStyle`, hero `props.layout`). It stays `SCHEMA_VERSION` 1 with backward-compatible parsing, and server publish validation is updated to match.
- Presets, palettes and pairings live in `src/lib/orders/builder/presets.ts` as pure functions that return a `Theme`/`Design`. They are shared by the showcase, the public preview and `SettingsPanel`.
- The public preview and showcase render `SiteRenderer` with a sample catalog in preview mode (no cart actions), lazy-loaded via `React.lazy` and IntersectionObserver. The editor-only code (dnd, upload) stays out of that bundle.
- `CustomizeDemo.tsx` gets retired in favour of the shared renderer.
- Anonymous draft: the key `orders.designDraft` holds `{design, savedAt}` and is validated with `validateDesign` on read and again server-side when saved to `storefront_designs`. The existing GetStarted draft handoff gets reused. Anonymous visitors never call owner RPCs.
- Tests: preset → valid design, older designs parse with defaults, an expired or tampered draft gets rejected, and a hidden products section is still refused.
- Record the "one design system" rule in AGENTS.md.
