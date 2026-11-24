# Homepage: move the domain-search divider line

Take away the thin line above "Your next idea starts with a name." and add the same line under that block, so it sits between the domain search and the photo below it.

On wide screens the photo sits beside the text, not below it. There the line simply closes off the text column.

## Technical details
- File: `src/components/domains/DomainPlacements.tsx` (HomeDomainSearch wrapper, line 12).
- Change `mt-12 border-t border-atmo-ivory/12 pt-10` to `mt-12 border-b border-atmo-ivory/12 pb-10`. The `gap-12` already on the section's grid spaces the line from the photo.
