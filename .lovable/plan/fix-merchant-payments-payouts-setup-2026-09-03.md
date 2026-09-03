# Fix merchant payments & payouts setup

## What's actually happening

The generic message ("We couldn't reach the payments service") is not a network problem — it is the client hiding the real error. The backend log for the payments function shows the true cause:

> You can only create new accounts if you've signed up for Connect, which you can do at https://dashboard.stripe.com/connect

The live Stripe account behind this project has **Stripe Connect not enabled**, so creating a merchant (Express) account fails. Every merchant hitting "Set up payments" will get this until Connect is activated on the Stripe account.

## What you need to do (outside the app)

Sign up for Stripe Connect in your Stripe dashboard (Connect > Get started), complete the platform profile, and confirm Express accounts are available in live mode. No code can substitute for this step.

## What I'll change in the app

1. **Stop swallowing real errors.** The payments helper currently replaces any non-2xx response with the generic "couldn't reach the payments service" text. It will read the function's JSON body and surface the actual reason, keeping the generic text only for genuine network failures.

2. **Translate Stripe configuration errors into plain English.** In the payments function, detect the "not signed up for Connect" case (and other Stripe configuration errors) and return an admin-friendly message such as: "Payments aren't fully activated yet. Loumilab is finishing payment provider setup — please try again shortly." Merchants never see raw Stripe text.

3. **Show a clear blocked state on the payout card.** When the failure is a platform configuration issue rather than a merchant issue, the Payments & payouts card shows an informational banner instead of a red "setup failed" toast, so merchants know it isn't their fault and don't retry in a loop.

4. **Log the reason for admins.** Configuration failures get recorded so the Super Admin payments panel and the daily brief reflect that Connect is not activated.

## Technical notes

- `src/lib/orders/connect.ts`: `callConnect` returns the parsed body's `error` when present; distinguish `configError` from ordinary errors.
- `supabase/functions/stripe-connect/index.ts`: catch Stripe errors whose message mentions Connect signup, return `503` with `code: "connect_not_enabled"` and a safe message.
- `src/components/orders/PayoutSetupCard.tsx`: render a non-destructive notice for `connect_not_enabled`; keep existing flow otherwise.
- No schema changes required.

## Verification

After Connect is enabled on the Stripe account, run "Set up payments" as a merchant and confirm the Stripe onboarding link opens and the account row records `onboarding` status. Before that, confirm the new message appears instead of the misleading network error.
