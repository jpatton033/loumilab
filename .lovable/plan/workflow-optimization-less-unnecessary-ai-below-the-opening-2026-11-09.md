# Workflow Optimization: "Less unnecessary AI." below the opening photo

- The headline on the opening photo goes back to just "Smarter software."
- Right below the photo, on the off-white background, add a calm statement line: a large black "Less unnecessary AI." in the headline font, centered, followed by a short muted line ("AI when valuable. Software when sufficient."). It eases in gently as you scroll to it and flows straight into the existing workflow illustration, sharing the same section and spacing.

## Technical details
- `src/pages/services/WorkflowOptimization.tsx`: set `title="Smarter software."`. In the existing `<section className="section-padding">` before `<HeroVisual />`, add a `Reveal`-wrapped centered block: h2 `font-hero text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground` + `p text-muted-foreground`, with `mb-12 lg:mb-16` above the visual.
- Remove "AI when valuable. Software when sufficient." from the hero copy so it isn't repeated.
- Check the page at 1280px and 390px.
