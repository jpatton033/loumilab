# Show Schedule and the calendar card for every store

## What's wrong
- Food & Catering, Restaurant and Retail stores have no Schedule tab. Jay's Kitchen is Food & Catering, so the tab never shows.
- On the Free plan, stores that do have the tab (JP Kitchen, Patton Spices, KTaylor'd Cakes) see only an upgrade note there. The note covers the whole page, so it also hides the calendar card that was just made free.

## What changes
- Every business type gets a Schedule tab in the dashboard.
- Inside Schedule, the Calendar Integrations card always shows, on every plan.
- Booking features that are still paid-only (letting customers pick a time slot) keep their upgrade note below the card instead of replacing the whole page.

## Note
- Automatic sync adds events for jobs that have a booked time. Food & Catering stores take orders, not jobs, so connecting a calendar works but nothing syncs from their orders yet. Syncing order pickup and delivery times would be a separate change.

## Technical details
- Data update: append `"schedule"` to `orders_industries.modules` for food-catering, restaurant and retail (before payments).
- `Dashboard.tsx` Schedule section: render `CalendarIntegrationsCard` whenever `calendarSyncOn`, outside the `moduleAllowed("schedule")` check; show the `orders.scheduling` LockedFeature only for the schedule list part.
- Check with Playwright as a signed-in Free merchant if a session can be minted; otherwise confirm by reading the data and code.
