# Fix: newsletter main article stays invisible

## What's wrong (confirmed)
On a phone-sized screen, the main article of longer issues never appears. The words are there, but the fade-in effect on that block never starts, so the article stays fully transparent. I checked this in the preview: "The Website Isn't Dead" and "Your Business Has a Tech Stack" stayed hidden; "AI Is Getting Easier" showed, because it's shorter.

The cause: the fade starts only once 12% of the block is on screen. For a long article, 12% is taller than a phone screen, so it can never happen. Issues written since "AI Is Getting Easier" are mostly longer, which is why it looks like it started then. The same thing can hide any tall block on the site.

## Fix
- Change the shared fade-in so it starts as soon as any part of the block comes on screen, not after a set share of it. Short blocks look the same as before.
- No changes to issue content, emails or the editor.

## Check
- Open every published issue on phone, tablet and desktop widths, scroll through, and confirm each main article is fully visible.

## Technical details
- `src/components/Reveal.tsx`: IntersectionObserver `threshold: 0.12` -> `0` (keep the rootMargin), so tall elements reveal on first overlap.
