# Fix blank screen after "Continue setup" (Payments & payouts)

## What's happening

Clicking "Continue setup" calls the payments function, gets a valid Stripe onboarding link, and then navigates the current window to it (`window.location.href = res.url`). Inside the Lovable preview — and inside any embedded/iframed view — Stripe's hosted onboarding refuses to be framed, so the frame renders nothing and you get a white screen. The backend call itself is fine: the payments function logs show no errors for these attempts.

## The fix

1. **Open Stripe onboarding at the top level, in a new tab.** Use a new-tab open (with a top-level navigation fallback) instead of replacing the current view, matching how the existing "Payouts & balance" button already behaves.
2. **Never leave a dead screen if the browser blocks the pop-up.** When the new tab can't open, show an inline "Continue on Stripe" link on the Payments & payouts card that the merchant can click directly, plus a short line explaining onboarding opens in a new tab.
3. **Refresh on return.** Keep the existing `payments=return` handling and also re-check status when the merchant comes back to the Loumilab tab, so the card and Store Set-up update once Stripe onboarding is finished.
4. **Keep the button usable.** The action button stays clickable while a link is pending so a blocked pop-up can be retried.

## Technical notes

- `src/components/orders/PayoutSetupCard.tsx`: replace `window.location.href = res.url` with `window.open(res.url, "_blank", "noopener")`; if the returned handle is null (blocked), store the URL in state and render an anchor button. Fall back to `window.top?.location` navigation only when a new tab isn't possible.
- No changes to `supabase/functions/stripe-connect/index.ts` — the link generation and return URL already work.
- No schema or backend changes.

## Verification

Click "Continue setup" and confirm Stripe onboarding opens in a new tab (no white screen), the card shows a visible fallback link if the pop-up is blocked, and returning to Loumilab refreshes the payout status.
