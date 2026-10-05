# Reduce the gap below the Loumilab logo

Make the first visible content on each public-facing Loumilab page sit about halfway closer to the top navigation, on phone and desktop, without changing the navigation bar itself or compressing the rest of the page.

## Plan

1. Keep the fixed header and its matching page offset intact so content never slides underneath the logo. Reduce the **additional top spacing** on each page's first section instead; the current pages use different first-section spacing values, so one global change would not produce a consistent result.
2. Apply the adjustment across the main site, Loumilab Orders, Local, Business Tools, Resources, and public account/order screens. Preserve intentional vertical centering on sign-in screens and appropriate room for interactive content.
3. Check representative pages at phone and desktop widths, including the homepage, Orders, and Local registration. Confirm the logo and first content do not overlap and later sections retain their existing spacing.

## Technical notes

The shared `Layout` reserves `pt-16 lg:pt-20` for the fixed `Navbar` (`h-16 lg:h-20`). First sections then add their own top spacing—for example, the homepage showcase uses `pt-28 lg:pt-36`, Orders uses the same, and Local registration uses `pt-14 lg:pt-20`. Adjust these first-section values to roughly half their current size, including equivalent `py-*` first sections, rather than halving the header offset. Admin screens use a separate shell and are outside this logo-to-content adjustment.
