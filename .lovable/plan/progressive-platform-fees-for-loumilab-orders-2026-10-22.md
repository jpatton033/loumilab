# Progressive Platform Fees for Loumilab Orders

Merchants' Loumilab fee drops on additional sales as monthly sales grow. Plans ($0 / $19 / $49), Stripe fees, taxes, tips, payouts, customer-fee sharing and promotions keep working as they do now. Progressive pricing ships **switched off** and only turns on from an effective date set in Super Admin after test checkouts pass.

## Fee tiers (marginal, no cap)

| Monthly eligible sales | Launch | Starter | Business |
|---|---|---|---|
| $0 – $2,500 | 5.0% | 3.9% | 2.9% |
| $2,500.01 – $5,000 | 4.5% | 3.4% | 2.4% |
| $5,000.01 – $10,000 | 4.0% | 2.9% | 1.9% |
| Above $10,000 | 3.5% | 2.4% | 1.4% |

Example: Launch, $6,000 → $125 + $112.50 + $40 = $277.50.

## Policies (documented in Terms and admin help)

- **Eligible sales** = item totals only (same base the fee uses today). Tax, tips, delivery, service fee and processing fee never count and are never charged.
- **Monthly period** = calendar month, US Eastern. Resets at midnight ET on the 1st.
- **When sales count**: when an order is paid. Failed or abandoned checkouts never count.
- **Order crossing a tier**: the order is split, each part charged its own rate.
- **Refunds/chargebacks**: the fee already charged on that order is not recalculated (no retroactive changes). Refunded amounts are subtracted from the month's volume so later orders aren't given a lower tier they didn't earn. Earlier orders are never re-charged.
- **Simultaneous checkouts**: volume from orders checked out in the last 30 minutes but not yet paid is held in reserve so two orders can't both get the same "room" in a tier.
- **History**: each order stores the pricing version, starting volume and the per-tier breakdown it was charged with.

## Promotions

- During a live 0% promotion the promo fee wins (lowest fee), as today; sales still count toward volume.
- When it ends, the merchant resumes at the tier matching their month-to-date sales.
- Never stacks, never negative. Existing promo eligibility and end dates untouched.

## Merchant dashboard

A compact "Your fee this month" card: plan, current rate, sales this month, next threshold and amount to reach it, Loumilab fees so far, savings vs. the old flat rate (only when above $0). One line explaining lower rates apply only to sales past each threshold. No charts.

## Orders homepage and pricing

- Hero and page structure unchanged.
- Small announcement near pricing: "Your business grows. Our fees shrink." + supporting text + "Built for business. Priced for growth."
- Pricing cards keep $0 / $19 / $49, show "from X%" starting fee and "fees decrease as monthly sales grow".
- Accessible tier table plus a simple sales-amount calculator (pick plan, enter monthly sales, see Loumilab fee and effective rate), with a clear note that Stripe processing fees are separate.
- Public copy only switches to progressive wording once pricing is active (before that, a "coming [date]" note can be shown when an effective date is set, for advance notice to merchants).

## Super Admin (Admin > Orders > Plans)

New "Progressive fees" panel:
- Edit thresholds and per-plan rates as a **new version** (draft), with preview: sample fees at $2,500 / $6,000 / $10,000 / $20,000 per plan.
- Set effective date (Eastern) and activate; enable/disable switch.
- Version history (who, when, what changed), audit-logged.
- Totals for the current month: merchant volume, fees collected, fees saved vs flat.
- Only super/finance admins can change it; past orders and granted promotions never change.

## Existing merchants

Applies automatically to everyone from the effective date. No Stripe reconnect, no store changes, plans and features unchanged. Optional announcement email via Loumilab Mail before activation (I'll draft it; you send).

## Testing before activation

Automated tests for all three plans at $0, $2,500, $2,500.01, $5,000, $5,000.01, $10,000, $10,000.01, $20,000; threshold-crossing orders; refunds reducing volume; promo override and resume; plan change mid-month (new orders use the new plan's tiers on the same volume); month rollover in Eastern time. Then one test-mode checkout to confirm the Stripe application fee equals the stored breakdown and the dashboard figure.

## Technical details

- New `orders_fee_schedules` (versioned: tiers jsonb per plan, effective_at, status draft/active/retired, created_by) — staff read, finance/super admin write via RLS; `audit_logs` entries.
- New `merchant_fee_volume` (merchant_id, period_start, paid_cents, refunded_cents, reserved via query on pending orders) updated by DB trigger on order status → paid / refunded; unique per merchant+period.
- `orders` gets `fee_schedule_id`, `fee_volume_start_cents`, `fee_breakdown jsonb`.
- Pure `_shared/progressiveFee.ts` (integer cents, tier splitting, round half-up once per order) mirrored in `src/lib/orders/progressiveFee.ts` for the calculator; unit-tested.
- `_shared/fees.ts`: `loadMerchantContext` takes the order subtotal; under a `pg_advisory_xact_lock`-backed RPC (`reserve_fee_volume`) it reads paid − refunded + reserved volume, computes progressive fee, then `min(progressive, promo)`. Falls back to today's flat plan fee when no active schedule. Used by `orders-checkout` and `orders-invoice-checkout`; `application_fee_amount` set from it.
- Refund handling added where refunds are issued (`stripe-connect`) and for `charge.refunded` / `charge.dispute.*` webhooks (idempotent via `stripe_webhook_events`).
- Dashboard card and admin panel read via RPCs; new rule added to `AGENTS.md`.
