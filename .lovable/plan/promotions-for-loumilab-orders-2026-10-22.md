# Promotions for Loumilab Orders

A reusable promotions manager in Super Admin, starting with "14 Days. Zero Loumilab Fees." Only Loumilab's platform fee changes. Stripe processing fees, taxes, tips and subscriptions are untouched.

## What admins get (Admin > Orders > Promotions)
- Campaign list showing each campaign's status (Draft, Active, Paused, Archived), with an on/off switch.
- Campaign editor with these settings:
  - name, description and promo message
  - promo fee % (0–10)
  - how many days it lasts
  - start date and signup deadline, using Eastern time
  - when the clock starts: when the account is created, when the store is published, or at the first paid order
  - who qualifies: new merchants, existing merchants, or chosen merchants
  - where the message shows: Orders homepage, store builder, onboarding
- Preview of the promo banner before it goes public.
- Results for each campaign:
  - merchants who qualified, started, are on the promo now, or have finished
  - sales made during promo periods
  - fees waived
  - merchants still taking orders after their promo ended
  - a list of participating merchants
- Every create, edit, switch or archive is written to the existing Audit Log.

## How it behaves
- **Turning a campaign off** stops new sign-ups and hides its messages. Merchants who already qualified keep their days. Ending a merchant's promo early is a separate, confirmed action that gets logged.
- **Editing a campaign** applies only to new participants. Each merchant's terms (fee %, days, normal fee) are saved when they qualify.
- **One promo per merchant account, no stacking.** Opening extra storefronts doesn't qualify an account again. If several promos apply, the lowest fee is used, and it can never go below 0% or above the plan's fee.
- **Ending on time.** A promo ends at its saved end time, which is checked at each checkout. It ends on time even if the merchant never logs in, and a daily cleanup also marks finished promos.
- **Merchant dashboard:** a small card shows "Promo fee active, X days left," then the normal fee once it ends.
- **Public messaging:** a quiet banner in the current style shows the offer, deadline and a short terms line, only where the admin turned it on. With no active campaign, the pages look exactly as they do now.
- **First campaign:** set up as a Draft with no deadline. It goes live only when you add a deadline and switch it on.

## Technical details
- New tables:
  - `orders_promotions`: campaign settings, status, start/deadline, trigger (signup / publish / first_paid_order), eligibility (new / existing / selected), display flags and `fee_bps`. Staff manage it. The public sees active campaigns' display fields only, through a security-definer RPC (`get_active_promotion(_surface)`).
  - `merchant_promotions`: `merchant_id` is unique while active, plus campaign id, qualified/activated/expires times, snapshotted promo and normal fee in basis points, status, and running eligible volume and waived fees. Merchants can read their own rows; only staff and the service role can write.
- Qualification: security-definer triggers fire on merchant insert (signup), on storefront publish, and when an order becomes paid. They check eligibility and the deadline, then insert or activate one row per merchant, so a merchant can't claim twice.
- Fees: `resolveFeeBps` in `_shared/fees.ts` looks for an active, unexpired `merchant_promotions` row. It applies `min(promoBps, planBps)`, kept between 0 and 1000. Checkout and invoice checkout already use this one path, so nothing about Stripe Connect changes. The order records the fee actually charged and the amount waived (`promo_waived_cents`), which adds to the campaign totals. Refunds work from the fee that was stored, so they stay correct.
- Expiry: checks at checkout compare against `now()`, and a daily `pg_cron` job marks expired rows.
- Audit: `logAudit` is called for every admin change and every manual early end.
- Tracking: a `promo_viewed` event goes through GTM via `track()` only. Existing events are unchanged.
- Tests: fee calculation (promo 0% → 0 fee, never negative, never above plan, normal fee after expiry), and each account can qualify only once.

## Stripe limitation noted
The Loumilab fee is set on each payment when it is created. Orders already paid keep the fee they were charged, and a new fee only affects later checkouts. Payouts and Stripe's own fees are not affected.
