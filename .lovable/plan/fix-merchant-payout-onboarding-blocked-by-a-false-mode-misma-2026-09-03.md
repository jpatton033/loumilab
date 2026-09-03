# Fix: merchant payout onboarding blocked by a false mode-mismatch

## What the retest found

Querying Stripe directly with the live platform key:

- Connect **is** working. An Express connected account (`acct_1UBPU…`, "Jay's Kitchen") was created successfully **after** the platform-profile error — the earlier "responsibilities of managing losses" failure is now stale.
- The account exists with `controller.losses.payments = application`, Express dashboard, and `requirements.disabled_reason = requirements.past_due` — i.e. it just needs the merchant to finish the hosted onboarding form.

So the remaining blocker is on our side, not Stripe's.

## The real bug

Stripe's Account object **does not include a `livemode` field**. In `stripe-connect`, the account row is written with:

```
livemode: account.livemode ?? false
```

That always evaluates to `false`. Because the platform key is a live key, `stripeLivemode` is `true`, so the next request hits the mode-mismatch guard and returns:

> This payments account was created in test mode but the platform is running in live mode. Contact support to reset payments setup.

Result: every merchant can create an account but can never get an onboarding link — permanently stuck. The `merchant_stripe_accounts` row for Jay's Kitchen already has `livemode = false` and confirms this.

## Plan

1. **Record the true mode at creation.** In `supabase/functions/stripe-connect/index.ts`, store `livemode: stripeLivemode` (the platform key's mode) instead of reading a field Stripe never returns. Creating an account with a live key means a live account, by definition.
2. **Self-heal existing rows.** On the status refresh path, if a stored row's `livemode` disagrees with the platform mode but the account still resolves against the current key, correct the stored value rather than throwing the 409. Keep the 409 only when Stripe genuinely cannot find the account under the current key — that is the actual cross-mode case.
3. **Repair the stuck row** for Jay's Kitchen (`livemode` → true) via migration so the merchant can resume onboarding immediately.
4. **Redeploy** `stripe-connect` (the deployed copy is also older than the friendly-error handling, which is why `audit_logs` has no `payments.config_error` rows).
5. **Verify** by calling the function for the existing merchant: expect a Stripe hosted onboarding URL and a synced row showing `requirements.past_due`, not a 409 or 500.

## Technical details

- `supabase/functions/stripe-connect/index.ts` — account insert (~line 97) and mode guard (~lines 110-118)
- `supabase/functions/_shared/stripe.ts` — `stripeLivemode` derivation is correct; no change needed
- One migration updating `merchant_stripe_accounts.livemode` for the affected row
- No frontend changes; `PayoutSetupCard` already renders the returned error codes correctly
