# Fix the confusing "Outstanding items" list on Payments & payouts

## What's actually going on

The merchant's connected payments account exists but onboarding was never finished — Stripe has `details_submitted = false` and `disabled_reason = requirements.past_due`. That means the long list isn't a fault: it is simply the set of details Stripe still needs (business category, website, business type, bank account, representative name/email/date of birth, terms acceptance).

Two things make it look like a failure:

1. The status resolver checks `disabled_reason` first, so an account that merely hasn't completed onboarding is labelled **Disabled / Action required** instead of **In progress**.
2. The card prints Stripe's raw field names (`representative.dob.day`, `tos_acceptance.ip`) with no explanation.

## What I'll change

1. **Correct the status.** If the merchant hasn't submitted their details yet, the account reads as **In progress** (onboarding) rather than Disabled — even when Stripe reports a requirements-based disabled reason. Genuinely restricted accounts (details submitted, then blocked) keep the Action-required treatment.

2. **Humanise the checklist.** Replace "Outstanding items: business_profile.mcc, …" with a short plain-English list, e.g.:
   - Business category and website
   - Business type
   - Bank account for payouts
   - Owner's name, email and date of birth
   - Accept Stripe's terms

   Unknown Stripe fields fall back to a tidied version of the field name so nothing is ever dropped.

3. **Frame it as the next step, not an error.** For an in-progress account the panel shows a neutral "Finish these details to enable payouts" note and the button reads **Continue setup**, which opens the Stripe onboarding link the merchant left off at. Destructive styling is reserved for truly restricted accounts.

## Technical notes

- `supabase/functions/_shared/stripe.ts` — in `resolvePayoutStatus`, check `!details_submitted` before `disabled_reason`, and only return `disabled` for non-requirements reasons (e.g. `rejected.*`, `platform_paused`); requirements-based reasons on a submitted account map to `restricted`.
- New helper (in `src/lib/orders/connect.ts`) maps Stripe requirement keys to friendly labels, de-duplicated and grouped.
- `src/components/orders/PayoutSetupCard.tsx` — render the friendly list; neutral styling and copy for `onboarding`, destructive only for `restricted`/`disabled`.
- Redeploy `stripe-connect`; the next status call re-syncs the stored row, so no data migration is needed.

## Verification

Load the merchant dashboard and confirm the panel reads **In progress** with the plain-English checklist, and that **Continue setup** opens Stripe onboarding.
