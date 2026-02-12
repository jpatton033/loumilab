

## Change Diamond Logo Color on Contact Page

### Overview
Update the diamond logo on the Contact page to use a black/silver/white color scheme with blue accents, instead of the current gold/amber tones.

### Approach
Since the `DiamondLogo` component is also used on the About page (where it should keep its current gold colors), the best approach is to add a `variant` prop to the component rather than changing the colors globally.

### Changes

**1. Update `src/components/DiamondLogo.tsx`**
- Add a `variant` prop with two options: `"gold"` (default, current colors) and `"silver"` (new black/silver/white + blue accents)
- The `"silver"` variant will use:
  - Main diamond fill: dark gradient from `#1a1a1a` (near-black) through `#808080` (silver) to `#2a2a2a`
  - Highlight facet: white-to-silver gradient
  - Center line: dark silver/charcoal
  - Inner diamond accent stroke: Electric Blue (`#3B82F6`) for the blue accent
- Use unique gradient IDs per variant to avoid SVG ID conflicts if both variants render on the same page

**2. Update `src/pages/Contact.tsx`**
- Pass `variant="silver"` to the `DiamondLogo` on line 76

### Result
- Contact page: black/silver/white diamond with blue accent lines
- About page (and everywhere else): unchanged gold diamond

