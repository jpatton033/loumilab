# Workflow Optimization closing section: legible headline

Make "Your business doesn't need more complexity. It needs better systems." bright white on the black closing panel. Also make the "Optimize Your Workflow" button off-white with black text so it stands out against the black background.

## Technical details
- `src/pages/services/WorkflowOptimization.tsx` closing section (~line 446): add `text-inverse` to the h2 so the global heading color can't override it.
- Primary button: add `className="bg-inverse text-surface-inverse hover:bg-inverse/90"`.
- Check the page in a browser at 1280px.
