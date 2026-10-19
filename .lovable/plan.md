# Store setup: sticky Continue bar on phones

## Review results
- **Touch sizes are already fixed.** The step-6 switches already have a 44-pixel tap area and named labels. The Continue button, including its disabled state, is already at least 44 pixels tall on phones. No change needed. The review likely saw an older version, or measured only the visible switch track.
- **Sticky Continue is still open.** The Back/Continue row sits at the end of the form and scrolls away on tall steps.

## Change
- On phones only (below the small-screen breakpoint), make the Back / Continue row stick to the bottom of the screen. It gets a solid background, a hairline top border, a soft shadow and room for the phone's safe area. It stays in the normal flow on tablet and desktop, so those layouts don't change.
- Pin it with standard sticky positioning inside the step card. The bar then follows the visible screen when the keyboard opens, and stops at the end of the card so it never covers the footer or the live preview.
- Add a little bottom space so the last field is never hidden behind the bar.
- On the final step (Save and finish later / Publish), keep the same bar, with the buttons stacked as they are now.
- Nothing else changes: wording, validation, saving, tracking and step logic all stay the same.

## Verification
- At 390 and 360 pixels wide, walk steps 1–7. On tall steps (menu, hours), confirm Continue stays visible while scrolling and while a field has focus with a shorter visible screen. Also confirm there's no sideways scrolling and the bar never covers a field.
- On desktop and tablet, confirm the layout is unchanged.
- An emulated browser can't prove how a physical phone keyboard behaves. I'll report that limit plainly.

## Technical details
- `src/pages/orders/GetStarted.tsx`, the nav container at line ~936: add `max-sm:sticky max-sm:bottom-0 max-sm:z-20 max-sm:-mx-6 max-sm:border-t max-sm:border-border max-sm:bg-card max-sm:px-6 max-sm:py-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:shadow-[var(--shadow-soft)]`, matching the card's padding. Use semantic tokens only.
- Confirm that no ancestor has `overflow-hidden`, which would break sticky positioning.
