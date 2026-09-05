# Fix: published stores wrongly show "This store has paused new orders"

## What's happening

When a customer tries to order on a published store (e.g. Jay's Kitchen), the page needs to know two things from the business record: whether it's accepting orders, and its industry. That record (`merchants`) is locked to owners and staff only — there is no public read access. So for every visitor, the lookup silently returns nothing, and the page falls back to "not accepting orders," showing the misleading "This store has paused new orders" message even though the store is live and taking orders.

Confirmed in the data: Jay's Kitchen is `published`, `is_published = true`, `accepting_orders = true`. The block is purely the read permission.

## The fix

1. **Safe public lookup.** Add a small database function (security definer, same pattern as the existing `get_order_by_token` / `get_quote_by_token` helpers) that, given a storefront, returns only the two fields the public page needs — `accepting_orders` and `industry_slug` — and only for stores that are published or paused. Nothing else about the business (email, phone, etc.) is exposed, and no public policy is opened on the business record itself.
2. **Point the storefront page at it.** In `usePublicStorefront` (`src/lib/orders/storefront.ts`), replace the direct read of the business record with a call to this function. Behavior is unchanged for owners and staff; visitors now get the real answer.
3. **Keep honest paused states.** Stores that genuinely are paused or have ordering switched off will still show the paused message — unchanged.

## Technical details

- Migration: `create function public.get_public_store_context(_storefront_id uuid) returns jsonb` — `language sql`, `stable`, `security definer`, `set search_path = public`; joins `merchant_storefronts` → `merchants`, filters `status in ('published','paused') or is_published`, returns `{ accepting_orders, industry_slug }`; `grant execute to anon, authenticated`.
- Client change confined to `usePublicStorefront`: swap the `merchants` select for `supabase.rpc("get_public_store_context", { _storefront_id: store.id })`; keep the same defaults on null.
- No schema changes to tables, no RLS loosening on `merchants`, no new secrets, no pricing/payout changes.

## Verification

- As a signed-out visitor: Jay's Kitchen storefront opens checkout normally; a genuinely paused store still shows the paused notice.
- Owner preview and dashboard flows unchanged.
- Build OK.
