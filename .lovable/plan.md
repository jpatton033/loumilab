Building Direction 3 — **Apple Brand System**. The most Apple-direct of the three: clamp-scaled monumental type, white primary CTA, bento services grid on solid `#161617` surfaces, oversized "Why" copy. Existing tokens, fonts, structure, and copy stay.

## Scope

Homepage only (`src/pages/Index.tsx`). No new pages, no functionality, no token changes.

## Changes

### Hero
- Replace centered hero with **left-aligned bento hero** matching the prototype: small pill kicker → monumental headline with `text-[clamp(3.5rem,10vw,8rem)]`, `font-black`, `tracking-tighter`, `leading-[0.9]` → 2xl light body copy → primary CTA on **white** background with black text, secondary CTA on `#161617` with hairline border
- Remove the heavy radial gradient stack and floating glass blobs — keep one quiet radial halo only
- Keep the 3D `HeroScene` but reduce opacity to `0.25` and push behind a stronger left-fade so it reads as ambient texture, not subject
- Keep `IntroAnimation` as-is

### Stats band
- Hairline divider only (remove `bg-secondary/20`), reduce vertical padding, switch numbers to `font-hero` weight 800 and tighter tracking. No gradient text — solid white with muted labels.

### Services
- Replace the 6-column hybrid grid with a **12-col Apple-style bento**:
  - Row 1: Website Design & Development = `md:col-span-8` (featured), SaaS Development = `md:col-span-4`
  - Row 2: Technology Consulting = `md:col-span-4`, Cybersecurity = `md:col-span-4`, AI & Innovation = `md:col-span-4`
- Surfaces become solid `#161617` with `border-zinc-900`, rounded `rounded-[2rem]`, no hover translate, hover only shifts border to `border-zinc-700`
- Remove the chip cloud for sub-items; show the **first 4 sub-items** as a clean list with hairline dividers, plus a "and more" muted line
- Icons become 12×12 rounded squares with a single solid accent fill — no gradient halos
- Section header simplified: small uppercase kicker + single oversized headline, no sub-paragraph

### Why Loumilab
- Convert from 3×2 bordered grid to **two-column layout**:
  - Left: oversized headline `text-5xl md:text-7xl` (sticky on `lg`)
  - Right: numbered list (01–06) with `text-2xl` body, hairline divider between items, muted `01 /` labels in tracked Space Grotesk
- Drop the radial halo backdrop, drop card borders entirely — pure typography

### Products
- Keep section but flatten: remove the rainbow gradients, switch all 3 cards to solid `#161617` with hairline border, replace per-card `gradient` field with a single subtle accent stripe at top
- Mock-device frame stays but loses the colored background — sits on neutral surface

### Process timeline
- Already clean; tighten numbers to `font-hero` weight 800, remove the accent glow shadow, replace with a hairline ring

### Ongoing services
- Tighten card padding, drop hover border-accent in favor of `border-zinc-700`, switch icon color from accent to white with a small accent dot indicator

### Testimonials
- Surfaces to solid `#161617`, remove backdrop blur, increase quote size to `text-xl`, add a small `—` divider above the attribution

### Final CTA
- Remove the gradient/radial stack
- Center on solid `#0A0A0B` with a single quiet halo
- Headline keeps gradient accent word; primary CTA switches to white-on-black to match the hero

### Motion polish (global to Index)
- Standardize all `Reveal` and ambient transitions on `cubic-bezier(0.22,1,0.36,1)` over 700ms
- Replace any remaining `animate-drift-slow` blob layers with simple opacity fades
- No new libraries

## Files touched

- `src/pages/Index.tsx` — section markup, classNames, grid spans, surface treatments, CTA styles

## Out of scope

- Other pages (Services, About, Work, Contact, etc.) — can be aligned in a follow-up
- Token, font, or color-palette changes
- Adding/removing copy or sections
- IntroAnimation tweaks
