# Homepage top button: "Start a Project"

The button at the top of the homepage goes back to reading **Start a Project**. It still opens the contact form — only the words change.

## What changes
- The first button under the homepage headline: "Start a store" becomes "Start a Project", spelled the same way as the one in the top menu.
- The button next to it ("Explore products"), the photo below, and everything else on the page stay exactly as they are.
- As you chose, the other three homepage spots (the "We're always building." box, the plus photo, and the closing section) and the sentence at the end of articles keep saying "Start a store".

## Phones and tablets
The new wording is two letters longer, so I'll check the two buttons still sit side by side without wrapping or clipping on a phone.

## Checks
I'll view the homepage in a browser at desktop and phone widths and confirm the button reads "Start a Project" and still opens the contact form.

## Technical details
- One file: `src/pages/Index.tsx`, line 54 — the hero `TileActions` primary label changes from `"Start a store"` to `"Start a Project"`. The `to: "/contact"` target is untouched.
- No other labels, no backend changes.
