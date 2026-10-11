# Homepage buttons: "Start a Project"

All four homepage buttons go back to reading **Start a Project**. They still open the contact form — only the words change.

## What changes
- The button at the top of the page under the headline.
- The button inside the "We're always building." box.
- The plus photo (its hidden label for screen readers).
- The button in the closing section at the bottom of the page.

All four are spelled "Start a Project", the same way as the button in the top menu. The button next to each of them ("Explore products", "All products", "Contact Loumilab"), the photos, and everything else stay as they are. The sentence at the end of articles keeps saying "…or start a store."

## Phones and tablets
The new wording is two letters longer, so I'll check the paired buttons still sit side by side without wrapping or clipping on a phone.

## Checks
I'll view the homepage in a browser at desktop and phone widths, confirm all four buttons read "Start a Project", and confirm one still opens the contact form.

## Technical details
- One file: `src/pages/Index.tsx` — four label changes, all keeping `to: "/contact"`:
  - line 54: hero `TileActions` primary label
  - line 120: "We're always building." `GridTile` primary label
  - line 121: the plus photo's `aria-label`
  - line 146: closing section `TileActions` primary label
- `src/pages/resources/Article.tsx` line 243 is left untouched. No backend changes.
