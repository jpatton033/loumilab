# Workflow Optimization service page

New page at `/services/workflow-optimization`, titled "Intelligent Workflow & Software Optimization", with the brief's copy word for word. Core message: "AI when valuable. Software when sufficient."

## Where it appears
- Top menu: Solutions → Technology Studio, listed as "Workflow Optimization" after Custom Software. It shows up in the desktop dropdown and the phone menu, and both keep working the way they do now.
- Footer: Technology Studio column.
- The Start a Project form's "What do you need?" list gets a new "Workflow optimization" choice.

## Page sections (in the brief's order)
1. **Opening section:** the eyebrow, "Smarter software. Less unnecessary AI.", and two buttons: Optimize Your Workflow and Discuss a Software Project. Beside them, an animated two-lane drawing. One lane loops back to "Repeated Prompting". The other runs straight through to "Completed Task".
2. **"Not every task needs AI.":** the intro text, plus a simple three-layer picture: Software, then Automation, then Selective AI.
3. **Four service cards:** Assessment, Custom Workflow Software, Software & Process Optimization, Selective AI Integration. Each card has a small icon and its list of capabilities.
4. **Zero-Token Workflows (dark band):** four scenario tabs. Picking a tab switches a Before vs. After panel to that scenario's outcome. The clarification note sits under the panel. No numbers or savings claims.
5. **How we work:** five connected steps. The steps run across the page on desktop and stack top to bottom on phones.
6. **Business applications:** a grid of eight tiles, each with a one-line explanation.
7. **Why Loumilab:** the body text and three principles.
8. **Two inquiry forms** on the page, under tabs: "Request a Workflow Assessment" and "Discuss a Software Project". Each has the brief's fields. The two hero buttons and the two closing buttons jump to the matching form and open its tab.
9. **Dark closing band:** "Your business doesn't need more complexity. It needs better systems." with both buttons.

Visuals are drawn diagrams and interface-style pieces. No stock photos or AI images.

## How inquiries are handled
- Both forms save to the existing inquiries list, so they show up in Admin → Inquiries tagged "Workflow assessment" or "Software project". Their extra answers appear in the message as labeled lines. The usual email notification is sent.
- The forms use the same checks and spam protection as the contact form: field checks, a hidden spam trap, and the cooldown between submissions. A confirmation appears after sending. Nothing submitted is ever shown publicly.
- Tracked events: button clicks, plus a Lead event when a form is sent.

## SEO
The page uses the brief's title and description, breadcrumbs, and Service plus FAQ structured data. It is added to the sitemap and to the pre-rendered page heads.

## Technical details
- Add a new page component `src/pages/services/WorkflowOptimization.tsx`. ServiceDetail stays as is, because this page needs custom interactive sections. It reuses FlowHero, ClosingCta, `.glow-hover`, SEOHead, and `track()`.
- Each form inserts a `contact_submissions` row: `service` holds the form type, `budget` holds the optional budget, and `message` holds the remaining fields as structured text. After that it calls `send-contact-email`. No database changes.
- Edit `src/data/navigation.ts`, `App.tsx` (the route), the Contact page's service options, `scripts/prerender-heads.ts`, and the sitemap generator.
- The animations are CSS only, respect reduced-motion settings, and add no new libraries.
