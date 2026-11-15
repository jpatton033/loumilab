# Fix Spaces sign-in and dead buttons

## What's happening
- **Buttons don't respond:** on the Spaces page, an invisible fade layer at the bottom of the opening section sits on top of "Get Started" and "Explore Spaces", so clicks never reach them. The buttons themselves point to the right places (Get Started opens your Library, or Spaces sign-in first; Explore Spaces scrolls down the page).
- **Still sent to Orders:** your account has both a store and a Spaces workspace. Yesterday's sign-in fix (Spaces sign-in, "Where to?" choice) is in the preview only. The live site at loumilab.com still runs the old version, which defaults to Orders.

## Changes
1. Make the decorative fade layers on the Spaces page (and the hero film) ignore clicks, so every button underneath works.
2. Check every button and link on the Spaces pages (home, Specification, Pricing, sign-in) by clicking it in a browser.
3. Sign the preview in as jpatton033@icloud.com and confirm:
   - Spaces "Get Started" → Spaces sign-in → Library.
   - General sign-in → "Where to?" → Spaces opens the Library.
4. Publish so loumilab.com gets both fixes (you'll confirm the publish).

## Technical details
- `src/pages/spaces/Home.tsx` line 60 and `src/components/spaces/SpacesHeroFilm.tsx` line 47: add `pointer-events-none` to the absolute gradient overlays; audit other absolute decorative layers in `src/components/spaces` the same way.
- Playwright click-through of all Spaces CTAs on localhost; authenticated flow via a minted session for that user.
