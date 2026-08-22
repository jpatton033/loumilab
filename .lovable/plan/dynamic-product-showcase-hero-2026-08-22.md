# Dynamic Product Showcase Hero

Replace the homepage hero with a cinematic, data-driven showcase of Loumilab's products. Content is managed in the backend through a new admin screen, so future products appear in the hero without code changes.

## 1. Backend: hero products

New table `hero_products` with the fields the showcase needs:

- name, product logo/wordmark text, eyebrow, headline, description
- category, accent color, background treatment (choice of preset looks)
- desktop image, mobile image, optional video/animation URL
- primary CTA label + URL, secondary CTA label + URL
- display order, active, featured

Public read is limited to active + featured rows; only admins can create, edit, delete. Images upload to a storage bucket used by the existing admin tooling.

Seeded with the four launch slides:

1. **Loumilab Orders** — "Turn Followers Into Customers." / Explore Orders + Learn More
2. **Vurtti** — "Smarter Compliance. Powered by AI." / Explore Vurtti + Visit Vurtti, labeled "Designed & Developed by Loumilab" so Vurtti keeps its own identity
3. **Digital Experiences** — "Built to Make an Impression." / Explore Our Work
4. **Software by Loumilab** — "Ideas Into Products." / Explore Products

Slides 3 and 4 reuse the existing Work case-study visuals (FinTrack, Bloom, CareConnect) inside device/browser frames.

## 2. Admin management

A "Hero Showcase" area in the existing admin dashboard, matching the Knowledge Center CMS patterns:

- List of hero products with active/featured toggles and drag-free order controls
- Editor form for every field above, with image upload and a live mini preview
- Reordering controls that drive the showcase sequence

## 3. The hero component

A reusable `ProductShowcaseHero` that renders whatever the query returns.

**Opening state:** small `LOUMILAB` eyebrow, "We Build What's Next.", then "Digital products, intelligent software, and secure experiences designed by Loumilab." The showcase begins immediately below.

**Transitions:** not a carousel. Each change is a composed reveal — copy rises and crossfades, the previous mockup blurs and scales away, the new one focuses in, and the ambient lighting/gradient shifts to that product's accent. Each product holds 6 seconds.

**Slide treatments:**

- Orders: phone storefront beside a merchant dashboard, with restrained status cues (New Order, Payment Received, Ready for Pickup) fading in one at a time
- Vurtti: single laptop dashboard, a couple of panels animating gently, Loumilab attribution line above the product name
- Digital Experiences: three stacked browser frames with depth; the rear one advances forward as the slide plays
- Software: several app panels floating at different depths

To avoid repetition, the layout alternates: Orders and Digital Experiences use copy-left / showcase-right; Vurtti and Software center the product larger with the copy beneath it.

**Navigation:** text labels in a row at the bottom (Orders · Vurtti · Websites · Software), each with a thin underline that fills as a progress bar on the active item. Clicking or keyboard-focusing a label jumps to that product and stops auto-rotation. Hover, focus, and touch also pause it.

**Scroll handoff:** as the page scrolls, the mockup scales down slightly and the copy softens while the next section rises in. No scroll-jacking.

## 4. Mobile

A separate stacked arrangement — product name, headline, short description, primary CTA, single mockup, then navigation. Only one device frame renders, depth/parallax layers are dropped, and horizontal swipe moves between products.

## 5. Performance and accessibility

- Only the first slide's image preloads; the rest lazy-load as their slide approaches
- Responsive `srcset` images, transform/opacity-only animations, no video backgrounds
- `prefers-reduced-motion` collapses transitions to a plain crossfade and stops auto-rotation
- Region labeled for screen readers, live announcement on product change, alt text on every mockup, visible focus rings, contrast-checked copy over each background treatment

## 6. Technical notes

- New: `hero_products` migration + policies and grants, `src/lib/hero/queries.ts`, `src/components/hero/ProductShowcaseHero.tsx` plus per-treatment mockup subcomponents, `src/pages/admin/HeroShowcase.tsx` and its editor route
- Reuses `PhoneFrame`, the Orders dashboard/storefront pieces, and the Work images
- `src/pages/Index.tsx` swaps its static hero for the showcase; the rest of the homepage is unchanged
- If the table returns no rows, the hero falls back to the current static headline so the page never renders empty
