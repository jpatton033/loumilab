# Connect Your Calendar: the merchant card and automatic sync

## What merchants get
- A "Calendar Integrations" card at the top of the dashboard's Schedule section, on the $19 and $49 plans. On the free plan it shows the usual upgrade note.
- The card has two buttons, "Connect Google Calendar" and "Connect Outlook". A sign-in window opens, the merchant approves access, and then picks which calendar to use from their own list.
- Once connected, the card shows the account, the chosen calendar, "Change calendar" and "Disconnect". If access expires, it shows "Reconnect Google" or "Reconnect Outlook" with one plain line explaining why.
- One provider is active at a time, so the same job never lands on two calendars.
- **Automatic sync**:
  - Saving a booked time on a job adds the event.
  - Changing the time updates it.
  - Clearing the time or cancelling the job removes it.
- Each job shows a small sync status: "On calendar", "Syncing…" or "Couldn't sync, retry". A sync problem never changes the job itself.
- Apple stays as the Add to Calendar download, labelled as not automatic.

## Privacy
- What's on the event: the booking type, job title, business name, time and address. No customer phone, email, notes or prices go on the merchant's calendar.
- What Loumilab touches: only the events it created. It never reads the merchant's other events.

## Technical details
- **Shared helpers** (in `supabase/functions/_shared`):
  - `appUserConnector.ts`: copied verbatim from the connector guide.
  - `connectionKeyCrypto.ts` and `appUserConnections.ts`: AES-GCM encryption using `APP_USER_CONNECTION_KEY_SECRET`.
  - `appUserScopes.ts`:
    - Google: `userinfo.email`, `userinfo.profile`, `calendar.events`, `calendar.calendarlist.readonly`.
    - Microsoft: `openid`, `profile`, `email`, `offline_access`, `Calendars.ReadWrite`.
- **Migration**:
  - `app_user_connections` table, readable only by the service role.
  - `merchant_calendar_links` table (merchant_id unique, provider, calendar_id, calendar_name, account_email, status, `reconnect_required`). The merchant can read their own row; only the service role can write.
  - `merchant_job_calendar_events` table (job_id + provider unique, external_event_id, sync_status, last_error, attempts, synced_at). The merchant can read their own rows.
  - Add `calendar.sync = true` to the Business and Premium plan entitlements.
- **Edge functions** (each verifies the signed-in user, finds their merchant via `owner_id`, and checks `calendar.sync` on the server):
  - `calendar-oauth-start` takes the provider and origin, and returns the sign-in address.
  - `calendar-oauth-complete` exchanges the code, checks the connector, saves the encrypted key, clears `reconnect_required` and records the account email.
  - `calendar-manage` handles listing calendars, choosing one, reading status and disconnecting. Disconnecting calls the gateway first, then deletes the key and link rows.
  - `calendar-sync` takes a job id and creates, patches or deletes the event. It uses Google `/calendar/v3/calendars/{id}/events` or Graph `/me/calendars/{id}/events`, with UTC start/end and the merchant's time zone. A credential 401 sets `reconnect_required`, and other failures record `last_error`.
- **Return pages**: `/oauth/google-calendar/return` and `/oauth/outlook/return` use the popup flow from the guide, plus matching routes in `App.tsx`.
- **Frontend**:
  - `src/lib/orders/calendarSync.ts` holds the queries and mutations.
  - `CalendarIntegrationsCard.tsx` is the merchant card.
  - `JobScheduleControls` calls `calendar-sync` after saving a time and shows the job's sync status.
  - `useAdvanceJob` also triggers sync when a job is cancelled.
- **Retries**: on a retry tap, and whenever the dashboard loads, jobs marked failed are re-synced. There is no background polling and no new paid service.
- **Checks**: the functions are deployed and tested with direct calls for being signed out, being on the free plan, and having no connection. A real Google or Outlook connection needs you to sign in once in the preview.
- **Rule note**: add an `AGENTS.md` rule that merchant calendar sync goes only through the `calendar-*` functions with encrypted per-merchant keys.
