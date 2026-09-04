# Unblock payments setup, then finish real payouts

Two things, in order.

## 1. The Stripe platform profile (you have to do this part)

The block merchants hit is a setting on your own Stripe account, not something in the app. I cannot fill it in for you — Stripe only accepts it from a signed-in owner of that account, and no key or code path can complete it. The app already detects this exact failure and shows merchants a neutral "payments aren't fully activated yet" message instead of a raw Stripe error, which is why setup stops rather than breaking.

What to do, once:

1. Sign in to the Stripe dashboard with the account whose secret key this project uses. Make sure you are in the same environment (test or live) that the app is running.
2. Go to Connect, then Settings, then Platform profile.
3. Answer the questions about your business and your platform. The one that matters is the question about who is responsible for losses such as refunds, disputes and negative balances. Choose that your platform (Loumilab) takes that responsibility for the businesses you onboard — that is what Express onboarding requires.
4. Fill in the remaining profile fields Stripe asks for (what your platform does, the type of businesses you onboard, expected volumes) and save.
5. If Stripe asks you to accept the Connect terms, accept them.

Then come back to the merchant dashboard and press the payments setup button again.

### What I will build around it

- **A live readiness check in the Super Admin area**: a small "Payments platform" status row that calls Stripe and reports one of three things — ready, profile incomplete, or key problem — with a "Re-check" button and the time of the last check. That way you can confirm the profile is done from inside your own app instead of guessing.
- **A clearer merchant-side message with a retry** while it is incomplete, so a merchant who tries during that window sees a calm "payments are being activated — try again shortly" panel with a Retry button rather than a dead end.
- Existing behaviour I will keep: the failure is already recorded in the audit log, so repeated attempts stay traceable.

## 2. Real payouts (the previously approved work)

Once the profile is in place, merchants can finish onboarding and the payouts view becomes meaningful. That work stays as approved:

- Give the payout balance its own cache slot so it can no longer collide with the setup status.
- Only request a balance after onboarding is complete; show a continue-setup panel before that, and a separate honest error state with Retry if the request genuinely fails.
- Richer payout history: amount, plain-English status, expected arrival date, payout schedule, next expected payout, and the reason for any failed payout.
- A "View in Stripe" button opening the merchant's Stripe Express dashboard.
- Empty state for verified merchants with no payouts yet.

## Technical notes

- `roadmap.md`: add the platform-profile task and the payouts task, so nothing is lost between the two phases.
- New action `platform_status` in `supabase/functions/stripe-connect/index.ts`, restricted to super admins, that probes Stripe (account retrieve plus a capability check) and maps the existing `connect_not_enabled` / `stripe_key_invalid` detection into a status payload. Redeploy the function.
- Admin UI row rendered in the existing admin overview, reading that action through a small hook in `src/lib/orders/connect.ts`.
- `PayoutSetupCard.tsx`: the config notice gains a Retry button that re-runs `callConnect("start")`.
- Payouts phase: `usePayouts` key moves off `["orders","payouts"]` (collides with `PAYOUTS_QUERY_KEY`) to `["orders","payout-balance"]` with an `enabled` gate; `PaymentsPanel.tsx` gates on `payout_status === "payout_enabled"` and splits the three states; `orders-payouts` also returns the payout schedule, next expected payout date and per-payout failure message.
- No database changes, no new secrets.
