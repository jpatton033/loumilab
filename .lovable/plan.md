# Fix: Stripe Connect merchant onboarding error

## What the error actually means

The Stripe error — *"Please review the responsibilities of managing losses for connected accounts at …/settings/connect/platform-profile"* — is **not** about whether Connect is enabled. Stripe Connect activation has a second, separate step:

1. **Enable Connect** (done — per your confirmation)
2. **Complete the Connect platform profile** at Stripe Dashboard → Settings → Connect → Platform profile, where the platform owner reviews and accepts who is responsible for losses on connected accounts

Step 2 stays incomplete until explicitly finished, and Stripe blocks `accounts.create` (merchant onboarding) with exactly this error until it is. So even with Connect "set up", merchant account creation fails.

## Why a raw 500 surfaced

The app code already maps this exact message to a friendly 503 (`connect_not_enabled`) with an audit-log entry — but `audit_logs` has **zero** `payments.config_error` rows, so the improved handler never ran. The deployed `stripe-connect` Edge Function is stale (pre-fix version).

## Plan

1. **Redeploy** the `stripe-connect` Edge Function so the current code (503 + audit log instead of raw 500) is live.
2. **Verify the regex** matches the exact live message (it does — `responsibilities of managing losses` is covered) and confirm the function now returns the friendly 503 instead of a 500 when this error occurs.
3. **Action for you (external, Stripe side):** in the Stripe Dashboard go to **Settings → Connect → Platform profile** and complete the loss-responsibility review. This is the only remaining blocker for merchant onboarding; no code change can bypass it.
4. **Re-test merchant payments setup** afterward: create a connected account via the payout setup card and confirm onboarding reaches Stripe's hosted flow and the `merchant_stripe_accounts` row is created.

## Technical details

- File: `supabase/functions/stripe-connect/index.ts` (lines 156–193, platform-config error handling)
- Deploy via the edge-function deploy tool; no source edits expected
- Verification: call `stripe-connect` with `action: "start"` as a test merchant; expect either a Stripe onboarding URL (profile complete) or a clean 503 `connect_not_enabled` with an `audit_logs` row — never a raw 500
