# Make the "Your Orders" image fill its frame

The dashboard screenshot in the "Your Orders" card currently sits shrunk inside a padded box, leaving empty bands. Make it fill the whole image area the same way the "Your Storefront" image does.

## Change
- In `src/pages/Orders.tsx`, replace the padded wrapper around the dashboard screenshot with a single image at the same 4:3 frame, `w-full object-cover object-top` (top-anchored so the revenue header and order queue stay visible).
- Card size, text, spacing, and the other two cards stay exactly as they are.

## Check
- View the section at phone, tablet (778px) and desktop widths to confirm the image fills the frame and nothing important is cropped.
