## Reduce LOUMILAB Wordmark Size on Intro Screen

Edit `src/components/IntroAnimation.tsx` only.

### Changes
1. Reduce the oversized "L" from `text-5xl md:text-7xl` down to `text-4xl md:text-6xl`.
2. Reduce "OUMILAB" from `text-4xl md:text-6xl` down to `text-3xl md:text-5xl`.
3. Keep the "L" exactly one Tailwind size step larger than the rest of the letters so it remains only slightly larger, as requested.
4. Keep the Loumilab logo icon at `size="md"` (48px) unchanged.
5. Leave surrounding `gap-8` spacing, timing, fade, particles, rule-draw, and "POWERED BY" text untouched.

### Verification
- Open the preview and trigger the intro screen (clear `sessionStorage` key `loumilab_intro_seen` if needed).
- Confirm the "LOUMILAB" wordmark is visibly smaller but still balanced with the 48px logo icon above it.
- Confirm the "L" is only slightly larger than "OUMILAB" and no layout shift or animation breakage occurs.