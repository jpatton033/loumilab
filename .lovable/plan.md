# Refresh the Orders image on the homepage

The "Less managing. More business." section currently shows the textile shop photo with a bright white dashboard screenshot on top of it, which clashes with the dark page.

## Change
- Remove the white screenshot from the photo.
- In its place, add a small dark order card that matches the rest of the site: charcoal surface, hairline border, ivory text. It shows a few realistic order lines (e.g. "New order · 2 scarves · Pickup 3:30 PM", "Paid · $48.00", "Ready for pickup") with one small Loumilab Blue dot for the "new" status.
- The card is built with code instead of a picture, so it stays sharp on every screen and matches the colors exactly. No new photo is needed; the textile shop photo stays.
- Same position and gentle overlap as today on desktop; on phones it sits neatly under the photo's bottom edge without covering faces.

## Check
- Desktop and phone screenshots of the section before and after.

## Technical details
- In `src/pages/Index.tsx`, replace the `<Pic src={merchantDash}>` overlay with a small `OrderGlance` block that uses atmosphere tokens (`bg-atmo-charcoal`, `border-atmo-ivory/12`, `text-atmo-ivory`, `bg-dot`); drop the unused `merchantDash` import.
