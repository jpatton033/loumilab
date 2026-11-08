# Fix unreadable text in the Zero-Token Workflows section

On the Workflow Optimization page, the black section's label "Zero-Token Workflows" and headline "Some workflows shouldn't need a single AI token." render dark on black.

## Changes (Workflow Optimization page only)
- Label "Zero-Token Workflows": make it muted off-white instead of the dark accent color.
- Headline: force bright off-white (the same fix used on the Orders closing section).
- Also brighten the other dark-on-black bits in this section: the selected scenario tab (white with black text), the "After · Optimized" label, check icons, and the highlighted card border/tint (off-white instead of dark accent).
- Check the page at desktop and phone size after the change.

## Technical details
In `src/pages/services/WorkflowOptimization.tsx`, replace `text-accent` / `bg-accent` / `border-accent` uses inside the `bg-surface-inverse` section with `text-inverse` / `text-inverse-muted` / `bg-inverse text-surface-inverse` / `border-inverse/40`, and add `text-inverse` explicitly on the h2 so global heading color doesn't override it.
