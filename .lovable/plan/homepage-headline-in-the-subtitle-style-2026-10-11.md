# Homepage headline in the subtitle style

The homepage headline keeps its exact words, but is set like the subtitles used across the site — the same typeface, weight and color as "Your storefront, your orders, your customers — free to start." — at the medium size you picked (about 30px on desktop, 22px on phones).

## What changes
- The headline drops the monumental display font (Urbanist), the bold weight and the tight letter spacing. It now uses the site's body typeface (Space Grotesk), normal weight, in the same softened charcoal as subtitles (70% strength).
- Size drops to about 30px on desktop and 22px on phones, so it reads as a clear statement rather than a poster line.
- The line is allowed a little more room to breathe (wider measure, looser line spacing) so the full sentence reads comfortably.
- Everything else stays: the same words, the two buttons underneath, the photo, and the rest of the homepage.

## Phones and tablets
The sentence wraps across more lines on small screens at the smaller size; nothing is clipped and the buttons stay side by side.

## Checks
I'll view the homepage in a browser at desktop and phone widths and confirm the headline now matches the Orders subtitle in font, weight, color and size, with no cut-off text.

## Technical details
- One file: `src/pages/Index.tsx`, the hero `<h1>` (currently line 51).
- Class swap: `mx-auto max-w-5xl font-hero text-[clamp(1.75rem,3.6vw,3.25rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-balance` becomes `mx-auto max-w-4xl text-[1.375rem] leading-[1.5] text-foreground/70 text-balance lg:text-[1.875rem]` — matching `ProductTile`'s line (`text-lg text-foreground/70 lg:text-2xl`, Tiles.tsx line 37) in font, weight and color, one step up in size.
- The element stays an `<h1>` so search engines still read it as the page's main heading. No other files, no backend changes.
