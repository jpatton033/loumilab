# Real Imagery for Selected Work Cards

Replace the blank placeholder panels on `/work` (currently a grey grid with the project name ghosted over it) with generated visuals — one per case study.

## Images to generate

Three light, premium, Apple-style visuals matching the site's design system (white/off-white surfaces, charcoal type, restrained blue accent, soft shadows, rounded UI). No stock-photo people, no logos, no fake metrics baked into the pixels.

1. **FinTrack Dashboard** (Software) — a clean analytics dashboard UI on a light surface: sidebar, line chart, summary cards, subtle blue data accents, viewed slightly angled on a soft neutral backdrop.
2. **Bloom E-Commerce** (Websites) — a minimal DTC storefront on desktop + phone: product grid, generous whitespace, soft shadows, muted botanical-neutral palette with a blue accent button.
3. **CareConnect Portal** (Digital Products) — a calm patient-management interface: schedule list, record panel, status chips, light charcoal-on-white with blue accents.

Each generated at a 16:9-ish landscape size so it fills the existing card header band cleanly.

## Implementation

- Generate to `src/assets/work/fintrack.jpg`, `bloom.jpg`, `careconnect.jpg`.
- In `src/pages/Work.tsx`, add an `image` field to each `caseStudies` entry (ES6 image imports) and swap the placeholder block for an `<img>` filling the 52/64px-tall band: `object-cover`, explicit width/height, `loading="lazy"` (first card eager), descriptive `alt` text, subtle overlay retained for depth.
- Keep the existing card layout, category label, metrics chips, filters, and JSON-LD unchanged.

## Note

These three case studies are illustrative rather than real client projects, so the imagery will be representative interface art, not screenshots of shipped work. If you have actual project screenshots, send them and I'll use those instead.
