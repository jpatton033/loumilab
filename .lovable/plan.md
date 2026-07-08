## Update Intro Load Screen Logo Size

Edit `src/components/IntroAnimation.tsx` only.

### Changes
1. Change `<LoumilabLogo size="xl" />` to `<LoumilabLogo size="md" />` so the logo renders at 48px instead of 96px.
2. Leave the surrounding `gap-8` container spacing unchanged.
3. Leave all other timing, fade, particles, rule-draw, and wordmark styling untouched.

### Verification
- Open the preview and trigger the intro screen (clear `sessionStorage` key `loumilab_intro_seen` if needed).
- Confirm the logo is visibly smaller and balanced with the "POWERED BY / LOUMILAB" wordmark.
- Confirm no layout shift or broken animation.