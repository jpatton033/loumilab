## Update Intro Load Screen Wordmark Size

Edit `src/components/IntroAnimation.tsx` only.

### Changes
1. Reduce the oversized "L" from `text-6xl md:text-8xl` to `text-5xl md:text-7xl`.
2. Reduce "OUMILAB" from `text-5xl md:text-7xl` to `text-4xl md:text-6xl`.
3. Keep the Loumilab logo icon at `size="md"` (48px) — unchanged.
4. Leave surrounding `gap-8` spacing, timing, fade, particles, rule-draw, and "POWERED BY" text untouched.

### Verification
- Open the preview and trigger the intro screen (clear `sessionStorage` key `loumilab_intro_seen` if needed).
- Confirm the "LOUMILAB" wordmark is visibly smaller but still balanced with the 48px logo icon above it.
- Confirm no layout shift or broken animation.