# Targeted Orders mobile fixes

## Review results
- A real 390 × 844 browser walkthrough reached steps 1–7 without horizontal page overflow. The progress strip does hide later steps: step 10 starts approximately 1,456 pixels off-screen.
- Business name and City have no autofill attributes.
- Step 2 selected an option on the first tap; the reported extra-click bug was not reproduced.
- Step 6 switches measure 44 × 24 pixels and lack accessible names. The account-step buttons measure 40 pixels tall; the disabled Continue button is not itself an actionable target.
- Continue buttons are in the normal page flow. A physical phone keyboard covering them has not been verified.
- After accepting cookies, navigating from Orders to setup produced a `page_view` for each route in Google's data layer. Meta loaded, but this test produced no `facebook.com/tr` request, so Meta delivery remains unverified—not confirmed broken.

## Changes to make
1. **Keep all ten steps visible on phones.** Replace the mobile scrolling pills with a compact, two-row numbered progress control, five steps per row, with 44-pixel targets. Keep the full current-step title in the existing heading and preserve desktop labels. Mark the current step accessibly, name every step, and keep future steps genuinely disabled. Preserve the existing back-navigation rules.
2. **Enable appropriate autofill.** Add `organization` for Business name and `address-level2` for City, with stable field names. Do not invent an autofill category for “What do you offer?”.
3. **Improve actual tap targets.** Give the two fulfilment switches named labels and at least 44 × 44 clickable areas without unnecessarily enlarging their visual tracks. Make the wizard's actionable navigation and account buttons at least 44 pixels tall on phones, including consistent disabled states. Keep these adjustments local to setup.

## Leave unchanged unless verification shows a problem
- No Step 2 selection-logic change: first-tap selection works. Add accessible selected-state reporting to the purchase options without changing their behavior.
- No sticky Continue bar by default. Test tall steps, focus and a reduced visible viewport first; add one only if a reproducible obstruction warrants it. Browser emulation does not establish physical-keyboard behavior.
- No backend, draft-saving, agreement, pricing, payout, publication, or tracking changes based only on these findings.

## Verification
- Check 390-pixel and narrow-phone widths plus desktop: all ten progress markers visible, titles fit, navigation remains correct, no new overflow, and controls meet their intended tap sizes.
- Repeat the visitor flow through step 7 with realistic field input; check selection, fulfilment labels, autofill attributes, and step-heading scroll position.
- Review steps 8–10 in a real signed-in merchant session without changing payment settings or publishing a store. Report any account-dependent checks that cannot be completed.
- Recheck consent-approved Orders → setup navigation on the live site for Meta PageView requests and Google events, plus rejection behavior. Change tracking only if a specific defect is reproduced; do not claim external receipt from data-layer evidence alone.

## Technical scope
Primary change: `src/pages/orders/GetStarted.tsx`, using existing design-system controls and semantic tokens. Add focused tests where practical and update the roadmap and architecture guidance only for decisions introduced by this change.