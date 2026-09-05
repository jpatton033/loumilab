# Loumilab Orders — continuous merchant journey

Same design, layout, pricing and features. This is a continuity pass: every step hands off to the next one, and no action ends on a dead screen.

## What the review found

Walking the journey as a merchant, these are the breaks:

1. **Payments step leaves the journey.** In the setup wizard, the payments step only offers a link to the dashboard, so the merchant abandons setup to do it. The Stripe return address is also hard-coded to the live site in one path, so a merchant setting up from another address is dropped somewhere unexpected.
2. **Returning merchants restart at step 1.** Saved answers are reloaded, but the wizard always opens on the first step, so completed work looks unfinished.
3. **Two different publish buttons behave differently.** The wizard's "Publish store" quietly shows "Almost there" when requirements are missing, with nothing to act on. The dashboard's publish works but gives no pre-publish explanation of what becomes public.
4. **No publish confirmation moment.** After going live, nothing states clearly "you are live, here is your link, here is how to share it".
5. **The store link is text only.** It appears in a few places as plain text with no copy, share, view or preview action.
6. **Quiet saves.** Store details, hours, pickup/delivery and logo save on blur with no confirmation, so merchants can't tell whether the change stuck.
7. **Preview is a one-way trip.** The owner preview banner explains the store isn't public but offers no way back to the dashboard and no publish action.
8. **Welcome email is thin.** It arrives on registration without the storefront link, status, or where to manage products and orders. There is no email when the store actually goes live.
9. **Mobile.** The key actions (continue setup, connect payments, add item, preview, publish, view store) sit inside long wrapping rows with no persistent primary action.

## The fixes

### Continuous setup

- Payments happens **inside** the wizard: the existing payments card is embedded in that step, Stripe opens in a new tab as it does today, and the return address points back to the wizard step the merchant came from (dashboard when started there). On return, status re-syncs and the step shows "Payouts active" with Continue.
- The wizard opens at the **first unfinished step** for a returning merchant, with a short "Picking up where you left off" line and the option to jump to any completed step (already supported).
- The dashboard's "Finish" links deep-link to the matching wizard step instead of scrolling to a panel where possible.

### One publish action, clearly explained

- Both publish buttons run through the same control. When requirements are missing, the button stays disabled with the outstanding items listed beside it and a jump link for each — no more silent toast.
- A short confirm step before publishing states the exact customer link and that the store becomes publicly visible.
- After publishing, the wizard's last step becomes a success panel: Published badge, the storefront link with copy/share/view, "Manage orders" and "Go to dashboard". Incomplete stores still cannot be published (already enforced in the database).
- Wording is made consistent everywhere: Create store / Save changes / Preview / Publish / Manage store.

### Store link, always at hand

A single store-link element (link text + copy + share + view/preview) appears in the dashboard header area, the setup card, the store panel, the wizard success panel and the publish email. One helper produces the canonical customer URL so it is identical everywhere. The slug is created once and never rewritten on later saves.

### Confirmation with a next step

Logo and image uploads, item added, business details, hours and fulfilment changes, storefront created, payments connected, publish and pause each confirm briefly and point at what comes next. Existing toasts are reused; no new screens or redirects.

### Emails

- **Store created:** rebuilt on the existing Loumilab Orders email shell — business name, confirmation, the storefront link shown prominently, current status, what's left to finish, a plain line that customers cannot see it yet, buttons to the dashboard, and where to manage items, orders and payouts plus a support address. No financial detail beyond "payouts are handled by Stripe".
- **Store published:** a new short email sent once, the first time a store goes live — you're live, your link (prominent, with a view button), where to manage orders, where to see payouts.

Both are sent once per merchant and never block anything if mail fails.

### Owner preview and published management

The preview banner gains "Back to dashboard" and, when everything is ready, "Publish store". Once live, the same banner space shows a subtle owner strip with "Manage store" so the merchant always knows whether they're managing or viewing as a customer.

### Mobile

On small screens the dashboard gains a compact sticky action bar carrying the single most relevant action (Continue setup → Connect payments → Publish store → View store). Chip rows scroll horizontally instead of wrapping, and primary buttons go full-width in the wizard.

## Technical notes

- `src/lib/orders/connect.ts`: accept a caller-supplied return path so the wizard gets `?payments=return&step=<n>`; `supabase/functions/stripe-connect/index.ts` uses the passed `returnUrl` in the branch that currently hard-codes `https://loumilab.com/orders/dashboard`.
- New `src/components/orders/StoreLink.tsx` and a `storeUrl(slug)` helper in `src/lib/orders/setup.ts`; used by `SetupChecklist`, `StorePanel`, `GetStarted`, `Dashboard`.
- New `src/components/orders/PublishStoreButton.tsx` wrapping `useSetStorefrontStatus` with the confirm dialog and disabled-reason list; `SetupChecklist` and `GetStarted` both use it.
- `GetStarted.tsx`: derive the initial step from the setup snapshot when no session draft exists; embed `PayoutSetupCard` in the payments step; replace the publish handler and the final step with the shared control plus a success panel.
- `StorePanel.tsx`: confirmation toasts on the `patch` calls; keep the existing fields and layout.
- `Storefront.tsx`: owner-aware banner actions (owner detected from the merchant query already available client-side).
- New `supabase/functions/orders-store-published/index.ts` mirroring `orders-merchant-welcome` (idempotent via a stored send record); rewrite the welcome body to include link, status and management pointers. Deploy both. Small migration only if a second send-record table/column is needed.
- No schema redesign, no pricing/entitlement changes, no new secrets.

## Verification

Desktop and mobile passes through: register → setup → Stripe (return lands back in the wizard) → items → preview → publish → dashboard, for a food merchant and a service merchant; plus leaving mid-setup and returning, publishing a store and checking both emails, and confirming an incomplete store still cannot be made public.
