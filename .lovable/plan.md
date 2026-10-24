# Universal calendar integration for Loumilab Orders

Note: the uploaded brief ends mid-sentence in section 5 ("Create calendar events after…"). This plan covers sections 1–5 as written. Send the rest if it has more requirements.

## What exists today
- Service jobs (estimates, deposits, invoices) already store a scheduled date/time and a time-window label, with a "scheduled" status.
- Regular pickup/delivery orders have no booked time, so there is nothing to put on a calendar for them yet.
- No business hours, appointment lengths or buffer settings exist yet; scheduling is a Business-plan feature.

## Phase 1 — Add to Calendar, all plans (no running cost)
- "Add to Calendar" menu with Google, Outlook, Apple / other (.ics download).
- Shown on: customer job/quote/invoice pages once a date is set, the merchant's job detail in the dashboard, and the scheduled-job email (as links).
- Event contains: business name + service title, start/end, merchant time zone, business address (or "On-site" for visits). No customer phone, email, notes or payment amounts.
- Works without a Loumilab account; links are generated on the page, nothing new is made public.

## Phase 2 — Merchant calendar connection (Business and Premium)
- New "Calendar Integrations" card in merchant settings.
- Google Calendar: merchant signs in with their own Google account, picks a calendar; confirmed jobs create an event, changes update it, cancellation removes it.
- Outlook: same experience via Microsoft, if a per-merchant Microsoft connection is available on our side; otherwise it ships later and the card says "Coming soon".
- Apple: offered as .ics export / subscribe only, clearly labelled as not automatic sync. iCloud (CalDAV) noted as a later investigation.
- Disconnect or change calendar at any time. Sync failures are logged and retried; they never change the job itself.
- Requires a one-time Google (and Microsoft) app setup by you in the Lovable workspace; I'll walk you through it.

## Phase 3 — Availability and conflict prevention (later, needs scheduling settings)
- Add business hours, appointment length and buffer settings first.
- For merchants who opt in, check their calendar's busy times (no event details) before offering a slot.
- Database-level protection so two customers can't book the same slot.

## Technical details
- `src/lib/orders/calendar.ts`: pure builders for Google/Outlook URLs and RFC 5545 .ics (UTC + TZID, stable UID per job), with unit tests for times, all-day/exclusive end, and that no customer fields appear.
- `AddToCalendar` component reused across receipt/quote/invoice/dashboard pages.
- Phase 2 uses App User Connectors (`google_calendar`, connection-key flow): encrypted `app_user_connections` table (service-role only), `merchant_calendar_links` (merchant, provider, calendar id), `merchant_job_calendar_events` (job → external event id). Edge function `calendar-sync` triggered on job status/date changes; entitlement checked server-side (`orders.scheduling`).
- Phase 3: `merchant_availability` settings + exclusion constraint on booked ranges per merchant.

## Order of work
1. Phase 1 now.
2. Phase 2 Google after you complete the Google app setup; Outlook as availability allows.
3. Phase 3 as a separate follow-up.
