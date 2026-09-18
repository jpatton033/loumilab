# Order Messaging for Loumilab Orders

Add secure, order-based two-way messaging between customers and merchants, available on paid plans only. Free-tier merchants instead see the customer's email address on paid orders so they can follow up outside the platform.

## Decisions (confirmed)

- Messaging is included on all paid plans (Business and Premium). Free tier excluded.
- Conversations become read-only 7 days after the order is completed or cancelled.
- Free tier shows the customer's email on the order card only, with a copy/email action — no upgrade banner.

## What customers get

On the receipt / order-status page (`/orders/receipt/:token`), below the totals and next to the existing tip panel:

- A **Message the business** panel, shown only when the merchant's plan includes messaging and the order is paid.
- Conversation thread with timestamps, "You" vs the business name, and an unread marker for new merchant replies.
- A reply box; new messages appear within seconds.
- Order events appear in the same thread as quiet system entries: order placed, confirmed, preparing, ready for pickup, out for delivery, completed.
- After the read-only date, the thread stays visible with a short note that the conversation is closed.
- If the merchant is on Free, no messaging UI appears at all.

## What merchants get

Inside the existing merchant dashboard, a new **Messages** module alongside Orders:

- List of order conversations, newest activity first, each showing order number, customer name, order status, last message preview, and an unread count.
- Opening a conversation shows the full thread, the order summary line, and a link to open that order in the queue.
- Merchants can start a message on any paid order, so "we're out of chocolate cake" works before the customer writes in.
- Unread badge on the Messages tab and on individual order rows in the queue.
- On Free tier, the Messages tab shows the existing locked-feature card ("Customer messaging is available with Loumilab Business") — one quiet card, no popups.
- Free tier order cards gain a customer email line with copy and mailto actions.

If a paid plan lapses or is downgraded, existing conversations remain readable for both sides but no new messages can be sent. Nothing is deleted.

## Super Admin

- Messaging becomes a normal entitlement toggle in Plans & Fees, so which tiers include it is a data change.
- A read-only conversation viewer in the Orders admin area, reachable from an order, for support, disputes, and abuse investigations. Every admin view is written to the existing audit log.

## Legal copy

Add short sections to the Orders Terms and Privacy documents covering in-platform messaging, that Loumilab stores and may review messages for support/safety/disputes, message retention, the prohibition on sharing payment details in messages, and that Free-tier merchants receive the customer's email address for order fulfilment only. Bump the agreement version and last-updated dates.

## Technical notes

**Schema (one migration, with GRANTs, RLS, and realtime):**

- `order_conversations` — one row per order: `order_id` (unique), `merchant_id`, `storefront_id`, `last_message_at`, `merchant_unread_count`, `customer_unread_count`, `locked_at`, timestamps.
- `order_messages` — `conversation_id`, `sender` (`customer` | `merchant` | `system`), `sender_user_id` (nullable), `body`, `event_type` (nullable, for status events), `created_at`, `read_at` fields.
- Conversation rows are created lazily by the RPCs, and by the existing order-status transition path for system events.
- RLS: merchants read/write rows where `merchant_id` belongs to them (reuse the existing merchant-ownership helper); admins read via the existing role check; `anon` gets no direct table access.
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;`

**Customer access** uses the same token pattern as receipts — security-definer RPCs keyed on the order's `public_token`, never on a conversation id, so changing an id cannot reach another thread:

- `get_order_conversation(_token)` — thread plus messaging-enabled flag, marks merchant messages read.
- `send_order_message(_token, _body)` — validates the token, the order is paid, the merchant plan entitlement (re-read from `orders_plans`, not trusted from the client), and the lock date.

**Entitlement:** new key `messaging.enabled` in `src/lib/orders/entitlements.ts` (base `false`, label "Customer messaging", tier "Business"), seeded `true` on the paid plan rows in the same migration. Server-side RPCs resolve it from the plan row on every send, so hiding the UI is never the only gate.

**Abuse controls (enforced in the RPCs/triggers):** 2,000-character body cap, max 20 messages per conversation per hour per side, max 200 per conversation lifetime, blank-message rejection, and no sending on unpaid, cancelled, or locked conversations.

**Realtime and cost:** merchants subscribe to `order_messages` filtered by their merchant id, reusing the existing dashboard realtime channel pattern. The customer receipt polls every 8 seconds while the panel is open rather than opening a socket per visitor. No third-party service, no new recurring cost. Message rows carry the fields a future email/SMS/push notifier would need, so channels can be added without reworking the data model.

**Files touched:** new `src/lib/orders/messaging.ts`, `src/components/orders/OrderMessagesPanel.tsx` (shared thread UI), `src/components/orders/MerchantMessages.tsx`; edits to `src/pages/orders/Receipt.tsx`, `src/pages/orders/Dashboard.tsx`, `src/components/orders/LiveOrderQueue.tsx`, `src/lib/orders/entitlements.ts`, `src/lib/orders/orders.ts`, `src/data/orders/legal.ts`, admin Orders page, plus the order-status update path in `supabase/functions/_shared/order-complete.ts` for system events.

**Mobile:** the thread uses the existing full-width card and sticky-action patterns from the queue work — message input pinned above the keyboard, large tap targets for Reply and View Order, unread dots rather than wide badges.

## Verification

Typecheck plus build, then a browser pass: place a test order, message from the receipt, reply from the dashboard, confirm the message lands within seconds, confirm a Free-tier merchant sees the email fallback and no thread, and confirm a locked conversation rejects sends.
