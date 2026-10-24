# Universal calendar integration for Loumilab Orders

Plan names follow what's saved today, matched by price: brief "Launch" = Starter ($0), brief "Starter" = Business ($19), brief "Business" = Premium ($49). No price or plan changes.

## What exists today
- Service jobs (estimates, deposits, invoices) already store a scheduled date/time, a time-window label and a "scheduled" status. These are the only bookings with a real date.
- Pickup/delivery orders have no booked time, so they get no calendar option (per the brief: none where no scheduled event exists).
- No business hours, appointment lengths or buffer settings exist yet.

## Phase 1 — Add to Calendar (all plans, free, built now)
- "Add to Calendar" menu: Google, Outlook, Apple / other (.ics download).
- Shown where a job has a date: customer quote/invoice pages, the merchant's job detail, and the "scheduled" email.
- Wording adapts to industry: appointment, service visit, session, consultation, catering event.
- Event holds business name + service, start/end, merchant time zone, business address or "On-site". No customer phone, email, notes or amounts.
- No customer account needed; nothing new becomes public.

## Phase 2 — Connect Your Calendar ($19 and $49 plans)
- "Calendar Integrations" card in merchant settings: connect, pick calendar, disconnect or change anytime. Not part of onboarding.
- Google and Microsoft Outlook: each merchant signs in with their own account (calendar-events permission only).
- Confirmed jobs create an event; time changes update it; cancellations remove it. One linked event per job prevents duplicates. Status shown per job; temporary failures retried; expired access shows "Reconnect".
- Loumilab stays the source of truth; sync failures never change a job.
- Apple: .ics only, labelled clearly — no claim of automatic sync.
- Plan check enforced on the server.
- Needs from you: one Google app and one Microsoft app set up in your Lovable workspace (I'll guide you), and publishing the Google app so merchants aren't disconnected after 7 days.

## Phase 3 — Advanced availability ($49 plan, follow-up)
- Add business hours, appointment length, buffers first.
- Read only busy/free times (never event details) before offering slots.
- Database protection so two customers can't take the same slot.

## Phase 4 — iCloud
- Evaluation only; reported back, not built.

## Costs
- Phases 1–2 add no subscriptions. Google and Microsoft calendar APIs are free at this scale; sync runs on existing backend jobs, no polling services. Anything with a recurring cost will be raised before building.

## Technical details
- `src/lib/orders/calendar.ts`: pure Google/Outlook URL and RFC 5545 .ics builders (UTC + TZID, stable UID per job, DST-safe); unit tests for times, DST, and absence of customer fields. Shared `AddToCalendar` component.
- Phase 2 via App User Connectors (`google_calendar`, `microsoft_outlook`, connection-key flow): encrypted `app_user_connections` (service-role only), `merchant_calendar_links` (merchant, provider, calendar id, status), `merchant_job_calendar_events` (job id + provider unique, external event id, sync status, attempts). Edge function `calendar-sync` called on job create/update/cancel plus retry via existing scheduled jobs; entitlement `calendar.sync` added to plan rows server-side.
- Phase 3: `merchant_availability` + exclusion constraint on booked ranges; entitlement `calendar.availability`.

## Order of work
1. Phase 1 now, tested on phone and desktop.
2. Phase 2 once the Google/Microsoft apps are set up.
3. Phases 3–4 as separate follow-ups; final summary covers the brief's six points.
