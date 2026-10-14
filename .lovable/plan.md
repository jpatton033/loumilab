# Build your store first, create the account later

## Why
Right now the very first step asks visitors to create an account before they've seen anything. Most ad visitors leave at that point. With this change, people get to build their store first, see how it looks, and only create an account once they have something worth saving.

## New order of steps
```text
1. Your industry
2. How customers buy
3. Business information
4. Store details & branding
5. Add your menu / products
6. Fulfilment & hours (or Availability)
7. Save your store  <- create account + agree to terms (new position)
8. Payments & payouts
9. Choose your plan
10. Preview & publish
```
- Steps 1–6 work without signing in. Answers are saved in the visitor's browser, so a refresh or closing the tab doesn't lose them.
- Step 7 shows a short summary ("Jay's Kitchen · 3 items · Pickup") and offers Create account / Sign in / Continue with Google. After signing in, the visitor comes straight back to step 7 with everything filled in. Their store is saved as soon as they accept the terms.
- People who are already signed in, and merchants coming back, skip the account step and continue where they left off, as they do today.
- The logo upload needs a saved store. Before sign-in it shows "You can add your logo after you save your store" instead of a box that doesn't work.

## Making the flow comfortable
- A clear note at the top: "No account needed to start. About 5 minutes."
- Each step's Continue button says what's next (for example, "Continue to menu").
- Errors appear right under the field they're about, not only as pop-up messages.
- The page scrolls to the top of each step on phones (check this still works).
- Tap a finished step in the progress bar to go back to it. Steps you haven't reached yet stay locked.
- A walk-through on phone and desktop: a new visitor goes from industry to published store, a returning merchant resumes, and a draft survives sign-in by email and by Google.

## Tracking
- "Started store setup" is counted when someone finishes the first step, not when the page opens.
- "Sign-up" is now counted for Google sign-ups too. This closes the open gap from the last step.

## Technical details
- `src/pages/orders/GetStarted.tsx`: move the account/agreement step to index 6. Update `SETUP_STEP_INDEX`, `canContinue`, the `?step=` links and the payout `returnPath`. `persist()` stays gated on being signed in. After sign-in, call `persist` once the saved details have loaded.
- Move the draft from sessionStorage to localStorage under a versioned key. This keeps it through email-confirmation tabs and Google redirects. Clear it after publishing. When the signed-in merchant's saved store already has data, the saved store wins over the draft.
- The sign-in `next` parameter returns to `/orders/get-started?step=6`.
- CompleteRegistration for Google: fire once per user on the first session where the profile was just created, deduplicated with a localStorage marker, through `track()`.
- Check other places that link to step numbers (dashboard setup checklist, `src/lib/orders` setup tasks) and adjust them.
- Update `roadmap.md`.
