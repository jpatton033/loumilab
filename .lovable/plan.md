# Fix fee updates and smooth scrolling on the Orders page

## 1. Platform fees not updating

**What's happening:** Earlier tonight you changed the fee on each plan in Admin → Plans (Starter 5%, Business 2.5%). The website and checkout don't read that field. While progressive pricing is on, both use the rates in Admin → Progressive Fees. The version live there now is from Oct. 27: Starter 3.5%, Business 3.0%, Premium 2.5% on the first $2,500, then lower. So the plan field you edited does nothing, and nothing on the screen tells you that.

**Fix:**
- In Admin → Plans, replace the plan fee field with a note: "Fees are set in Progressive Fees". Show the live starting rate and link straight to that page.
- To change fees, you save a new version in Progressive Fees and activate it. The website, pricing cards and checkout then update together, within about a minute instead of five.
- Make the remaining written fee lines follow the live rates. Today some still say "+ 3.9% Loumilab platform fee", for example the "Lower 3.9% platform fee" bullet on Business and the "$100 sale" example.
- Clean up the old Oct. 23 version, which is still marked active, so only one version shows as live.

**What you'll need to do after:** to get the rates you just entered, enter them as a new version in Progressive Fees and activate it. I won't change live fees myself.

## 2. "See what you can create" stops page scrolling

**Cause:** the sample website scrolls inside its own box. Your mouse or finger scrolls that box until the sample page ends, and only then does the Orders page move.

**Fix:** keep the same screenshots, designs and controls, but stop the box from taking the scroll. Scrolling always moves the Orders page. The sample website slowly glides from top to bottom on its own, and stops while someone uses the controls or has motion turned off. Visitors can still click the frame to view it full size.

## Technical details
- Rates come from the `get_fee_schedule` RPC, the latest active `orders_fee_schedules`, which is v3. `orders_plans.platform_fee_bps` is only a fallback. Plan: drop that input in the Admin plan editor when a schedule is active, cut `useFeeSchedule` staleTime to 60s, derive plan fee bullets/labels from the tiers, and retire v2 (the superseded active row) through the existing retire action.
- Clear `overflow-y-auto overscroll-contain` from the CustomizeShowcase frame (line 64). Replace it with `overflow-hidden` and a transform-based slow pan that respects reduced motion and pauses on interaction.
- Check at 778px and desktop that wheel/touch scrolling passes through.
