# Fix the cut-off "Your Orders" screenshot

The current dashboard screenshot is very wide (about 2.6 times wider than tall), so it can't fill the card's 4:3 frame without its sides being cut off.

## Change
- Make a new 4:3 picture of the merchant dashboard, using the real screenshot as the reference. It keeps the same look: today's revenue at the top and the order queue below, rearranged to fit the taller frame. It uses sample details only.
- Show the new picture in the "Your Orders" card, filling the frame with nothing cut off. The card's size, spacing, text and the other two cards stay the same.
- Keep the original wide screenshot in place in case anything else uses it.

## Check
- Look at the card on phone, tablet (778px) and desktop widths to confirm the whole dashboard shows and nothing is cut off.

## Technical details
- Generate the image with the edit tool from `src/assets/orders/screens/merchant-dashboard.jpg` at 4:3, then save it as `merchant-dashboard-4x3.jpg` and swap the import in `src/pages/Orders.tsx`. The class stays `aspect-[4/3] w-full object-cover`.
