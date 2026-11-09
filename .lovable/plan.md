# Workflow Optimization title: smaller second line

On the Workflow Optimization page's opening photo, keep "Smarter software." as the big headline and show "Less unnecessary AI." underneath it as a smaller subtitle line.

## Technical details
- `src/pages/services/WorkflowOptimization.tsx`: pass `title` as a fragment: `Smarter software.` + `<span className="mt-4 block font-hero text-2xl font-medium tracking-tight text-inverse/85 sm:text-3xl lg:text-4xl">Less unnecessary AI.</span>`.
- The text stays inside the one H1, so SEO doesn't change. The shared PageHero isn't touched, so no other pages change.
- Check the page in a browser at 1280px and 390px.
