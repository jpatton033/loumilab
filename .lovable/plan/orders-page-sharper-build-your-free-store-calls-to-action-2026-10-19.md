# Orders page: sharper "Build Your Free Store" calls to action

Refinements only. Layout, sections, slideshow, Live Preview, pricing amounts and animations stay as they are.

## One primary message
- Main button everywhere it means "start building": **Build Your Free Store**
- Short line under it: "Build and preview your store before signing up. An account and payout setup are only needed to publish and take payments."
- Places: hero, the "Don't sign up. Start building." statement, under pricing, closing section, and the two hero slides that say "Create your store".
- Secondary buttons (See How It Works, Learn More) stay quieter so there is one clear first choice.

## Live Preview
- Swap the small "Build a store like this" link for a clear button under the example store, tied to what's showing: "Build your own [florist / salon / …] store". Clicking it opens setup with that business type already picked, so it saves a step.
- The tour, cart and examples are untouched.

## Mid-page moment
- One slim, calm prompt after the features section ("Ready to see yours? Build Your Free Store"), so visitors don't scroll back up. Nothing else added, to avoid feeling pushy.

## No extra steps
- Every button goes straight into the no-sign-up builder. No account screen moves earlier.

## Measuring it
Each step gets its own event so clicks and real starts are separate:
1. Orders page view (already tracked)
2. **Button click**: new event, labeled with which button (hero, preview, pricing, closing…) and which wording, ready for future A/B tests
3. **Builder started**: only when someone completes the first setup step, not just opens the page
4. Account created (already tracked)
5. Store created (already tracked)
6. Store published (already tracked)

Meta keeps its existing events; the click is sent only to Google Tag Manager so Meta conversions aren't double-counted. You'd add one trigger in Tag Manager for the click and builder-start events; I'll give the exact names.

## Afterward
I'll check phone, tablet and desktop, confirm each button opens setup, and send a short summary of what to watch: click rate from the page, click → builder start, builder start → account, account → published.

## Technical details
- `Orders.tsx`, `StartBuildingStatement.tsx`, `hero-slides.ts`, `PricingTable` CTA labels; shared `CTA_COPY` constant in `src/data/orders/cta.ts` (variant id for A/B).
- `LivePreviewPicker.tsx`: button linking `/orders/get-started?industry=<slug>`; `GetStarted.tsx` reads `industry` only for fresh visitors (saved store/draft still wins, same rule as `name`).
- `src/lib/tracking`: add `CtaClick` (GTM-only `cta_click` with `cta_location`, `cta_variant`) and `BuilderStarted` (`builder_started`) fired after step 1 Continue, once per session. Existing `StartOnboarding` mapping kept to avoid breaking current conversions.
