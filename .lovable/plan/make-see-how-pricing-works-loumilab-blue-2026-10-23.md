# Make "See how pricing works" Loumilab Blue

The "See how pricing works" link and its arrow, in the short announcement above pricing on the Orders page, will show in Loumilab Blue instead of the current dark text colour. Nothing else changes: the wording, position and underline-on-hover all stay the same.

## Technical details
- `src/components/orders/ProgressiveFees.tsx`, `FeeAnnouncement` link: swap `text-primary` for `text-accent` (the blue token, already used for "Start building."). The arrow inherits the colour.
