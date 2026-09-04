# Real payouts in Payments & Payouts

Merchants already have a payments setup card and a payments page. The payout balance and payout history are partly built, but two things stop them from working reliably, and one thing is missing.

## What's wrong today (verified in the code)

1. **The payout data and the setup status share one cache slot.** The payments page stores its balance answer under the same internal key the setup card uses for its status answer. Whichever loads last overwrites the other, so the balance area can show a blank or a "finish setup" message even for a fully verified merchant.
2. **The balance is requested before setup is finished.** The page asks for the balance as soon as a merchant profile exists. For a merchant who hasn't completed Stripe onboarding, that request fails, and every failure — including genuine outages — is shown as the same "finish payout setup above" line.
3. **No link into the merchant's own Stripe view, and thin payout detail.** Payouts show only a date, a status word and an amount. There's no expected arrival date, no payout schedule, and no way to open the Stripe Express dashboard even though the backend already supports creating that link.

## What will change

**Separate the two answers.** Give the payout balance its own cache slot so it can never collide with the setup status. Refreshing after finishing setup will still refresh both.

**Only ask for a balance once onboarding is complete.** The payments page will read the setup status first:
- Setup not finished → a clear panel: what's still needed and a button to continue setup (no failed request, no misleading message).
- Setup finished → load and show the balance and payout history.
- Request genuinely failed → an honest "we couldn't load your payouts" line with a Retry button, kept separate from the not-set-up case.

**Richer payout history.** Each payout row will show the amount, the status in plain words (Paid, In transit, Scheduled, Failed), and the expected arrival date when Stripe provides one. Above the list: available balance, in-transit balance, the payout schedule in plain words (e.g. "Paid to your bank every business day, 2 days after the sale"), and the next expected payout date when one exists. Failed payouts will carry the reason Stripe gives.

**A "View in Stripe" button** that opens the merchant's Stripe Express dashboard, where they can see full history and change their bank details. Shown only when setup is complete.

**Empty state.** Verified but no payouts yet → "No payouts yet. Your first payout arrives a few days after your first paid order."

## Technical notes

- `src/lib/orders/billing.ts`: change `usePayouts`' query key off `["orders","payouts"]` (which collides with `PAYOUTS_QUERY_KEY` in `src/lib/orders/connect.ts`) to `["orders","payout-balance"]`; accept an `enabled` gate driven by payout status; expose a `refetch` for the retry button. Extend `PayoutsSnapshot` with `payout_schedule`, `next_payout_at`, and per-payout `failure_message`/`arrival_date`.
- `src/components/orders/PaymentsPanel.tsx`: read `usePayoutStatus()` from `connect.ts`, gate the balance fetch on `payout_status === "payout_enabled"`, and split the three UI states (not set up / loaded / error). Add the Stripe dashboard button using the existing `callConnect("dashboard_link")`.
- `src/lib/orders/connect.ts`: keep `useRefreshPayouts` invalidating both keys.
- `supabase/functions/orders-payouts/index.ts`: also return `settings.payouts.schedule` from the connected account and derive the next expected payout date; include `failure_message` on each payout; return distinct status codes for "not started" vs "onboarding incomplete" so the UI can be accurate. Redeploy the function.
- No database changes, no new secrets. All payout data stays read-only from Stripe.

## Verification

Check the payments page for a merchant with completed onboarding (balance, schedule, history render), and confirm the not-set-up state shows the continue-setup panel without a failed request. Confirm the setup card and payments page agree on status.
