# Homepage: real Vurtti logo + clickable plus sign

## 1. Vurtti tile uses the actual Vurtti logo
Replace the plain "Vurtti" text in the homepage Vurtti tile with Vurtti's real wordmark, copied from the Vurtti project: bold uppercase "VURTTI" with wide letter spacing, in Vurtti's own sans-serif type. Shown large and centered in the existing panel.

## 2. Plus sign links to the contact form
In the "We're always building." tile, the "+" panel becomes a link to the contact page, with a subtle hover lift and a visible keyboard focus ring. Labelled "Start a project" for screen readers.

## Technical notes
- New `src/components/brand/VurttiLogo.tsx` ported from Vurtti's `vurtti-logo.tsx` (font-sans, font-bold, uppercase, tracking-[0.14em], currentColor); add a `xl` size for the tile.
- In `src/pages/Index.tsx`, swap the Vurtti `<span>` for `<VurttiLogo size="xl" />` and wrap the "+" panel in `<Link to="/contact" aria-label="Start a project">` with focus-visible ring and hover styles using existing tokens.
