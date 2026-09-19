# Correct fading and low-contrast button hover states

## Goal
Keep every button label and icon clearly visible before, during, and after hover, while preserving Loumilab’s current light visual style.

## Confirmed cause
- The shared button styles use matched background and text colors correctly.
- The navigation’s **Sign in / Sign out** controls override only the ghost button’s hover text color. The ghost button still applies its blue hover background, producing dark text on blue and making the wording appear to fade.
- The audit found no sitewide rule that lowers button-label opacity; the issue comes from isolated hover overrides and a few intentionally dimmed icon controls.

## Changes
1. Correct the navigation auth controls so their hover background and text color are treated as one matched pair, retaining the intended subtle navigation behavior and strong contrast.
2. Audit remaining shared and custom button treatments for partial hover overrides, including outline, ghost, pricing, tip, dialog, sheet, calendar, and dashboard controls.
3. Normalize any unsafe pairings so changing a hover background always changes the label/icon color to a readable semantic token; do not alter unrelated layouts or branding.
4. Improve keyboard-focus parity for icon controls that currently become fully visible only on mouse hover, without changing their normal appearance.

## Verification
- Check button labels and icons across the main site, Orders pages, sign-in, resources, and merchant dashboard at rest, on hover, focus, active, and disabled states.
- Verify desktop mouse, keyboard navigation, touch-sized layouts, and reduced-motion behavior.
- Confirm text contrast remains readable throughout the completed hover transition and that no control disappears or shifts.
- Run the project checks and review the resulting pages for visual regressions.
