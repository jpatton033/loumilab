# Loumilab-wide visual refinement

Refine every public and signed-in part of Loumilab so it reads as one design language: main site, Orders, Local, Resources, sign-in, dashboards, forms, navigation and footer. No working features, data or page layouts are rebuilt. The current light theme, Space Grotesk / Urbanist type, and no-glass rule stay in place.

Note: the uploaded brief stops partway through "Image Presentation". The plan covers everything up to that point. Send the rest if it includes more requirements.

## 1. Shared foundation (applies everywhere at once)
- **Type scale:** one ladder for page title, section heading, subheading, description, supporting text and metadata. Descriptions go from about 14–15px light grey to 16–17px with darker grey and more line spacing. Metadata keeps a small but readable minimum (no text below 12px except legal fine print).
- **Contrast:** darken secondary grey text slightly so it stays readable on white and off-white backgrounds.
- **Loumilab Blue interaction language:** one set of states shared by buttons, links, cards, tabs, chips and nav items:
  - Hover: blue border or blue tint, a small lift on cards, and arrows that slide on CTAs.
  - Active/selected: solid blue marker with a weight change, so state doesn't rely on color alone.
  - Focus: the same visible blue ring everywhere.
  - Pressed: a slight press-in.
- **Components:** align buttons, links, cards, form fields, badges, icons and section spacing to this system so products differ by content and imagery, not by mismatched styling.

## 2. Photography
- Generate a curated set of warm, natural, human-centered photos: business owners, bakers, home chefs, caterers, teams collaborating, customers at local shops, people using technology naturally. Matched color grading, no obvious stock look.
- Presentation: large rounded image frames, photos paired with copy in alternating split sections, and occasional full-bleed moments. Every image gets real alt text, set dimensions and lazy loading below the fold, so hero load speed holds.
- Placement:
  - **Main site** (Home, Services, About, How We Work, Contact): balance the technology imagery with people and business moments.
  - **Orders public pages:** food and merchant prep scenes; more expressive.
  - **Local:** neighborhood discovery, storefronts and community; welcoming rather than a directory feel.
  - **Resources:** a hub header image and topic visuals.

## 3. Product-specific passes
- **Orders:** keep its own identity on top of the shared system. Merchant dashboard: typography, spacing and interaction states only; no new imagery, stays restrained.
- **Local:** refresh cards, filters and profile pages with the shared hover and selected states. The link to Orders stays a gentle option.
- **Resources:** larger article text (about 18px), a comfortable reading width, a clearer heading ladder, and consistent cards.
- **Sign-in, forms, dialogs:** unified fields, labels, error and focus states.
- **Navigation and footer:** blue active marker on the current section and consistent hover behavior across all products.

## 4. Verification
- Screenshots at phone, tablet and desktop widths of each main area before and after.
- Keyboard pass for focus visibility, a contrast check on text and states, and a reduced-motion check.
- A check that the homepage hero still loads quickly.

## Technical details
- Tokens in `src/index.css` and `tailwind.config.ts`: type-scale utilities (`text-display`, `text-lede`, `text-body`, `text-meta`), a slightly darker `--muted-foreground`, and an `--accent-soft` hover tint plus `--shadow-accent-hover`.
- Shared `.interactive-card`, `.link-brand` and nav-active utilities. Extend `button`, `badge`, `input`, `tabs` and `card` variants rather than editing per page.
- Images generated into `src/assets/people/` (and orders/local subfolders) as `.jpg`, imported as ES modules.
- Frontend and presentation only: no database, edge-function or routing changes.
