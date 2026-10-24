# Calendar sync on every plan, including Free

## What changes
- Every merchant, including Free ($0), can connect Google Calendar or Outlook and have booked jobs sync automatically.
- The "upgrade" note on the calendar card goes away. The card appears in Schedule for every store that has the Schedule tab.
- Add to Calendar (Google/Outlook/Apple .ics) already works on all plans. That stays the same.
- Plan feature lists no longer show calendar sync as a Business-only feature.

## Not changing
- Which business types show the Schedule tab. Food & Catering stores such as Jay's Kitchen still have no Schedule tab, so they won't see the card. That can be a separate change if you want it.
- Fees, prices and other plan features.

## Technical details
- Migration: set `calendar.sync = true` in the entitlements of every row in `orders_plans` (launch, starter, business, custom). The server check in `requireCalendarMerchant` still runs, so the plan data stays the only source.
- `src/lib/orders/entitlements.ts`: set the `calendar.sync` default to true and remove its Business-only plan label.
- `Dashboard.tsx`: keep the `isEnabled` gate (it now passes on every plan), so the LockedFeature fallback simply stops appearing.
- Add a test asserting that `calendar.sync` is enabled for the Free plan entitlements.
- Check: a signed-out call is still rejected, and a Free-plan merchant's `calendar-manage status` call is no longer refused for plan reasons.
