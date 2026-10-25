# Email Setup: provider costs, order changes and extra billing

This adds to the existing Business Email & Domain Setup service. It doesn't replace any of it. The questionnaire, Stripe checkout, admin page and checklist all stay as they are.

## 1. Provider costs shown before payment
- **Provider pricing list you can edit:** Admin → Email Setup → Provider pricing. It starts with these plans:
  - Google Workspace Business Starter
  - Microsoft 365 Business Basic
  - Microsoft Exchange Online Plan 1
  - Zoho Mail Lite
  - Domain registration and renewal estimate
- **What each plan shows:** plan name, estimated monthly cost per user, whether billing is annual or monthly, a link to the provider's official pricing page, and "prices may change."
- **Starting prices:** before I fill them in, I'll check each provider's official pricing page and note the date I checked. Promotional prices are left out.
- **Picking a provider:** each option in the questionnaire shows its estimated cost. "Help me choose" lays out all the options side by side.
- **Summary before paying:** split into two parts:
  - *Loumilab charges*: package, extra mailboxes, extra devices, taxes, and the total due to Loumilab.
  - *Third-party costs*: provider, monthly estimate × number of users, billing terms, and the domain estimate when the customer has no domain yet.
- **Required notice:** the "Additional Provider Costs" message appears prominently, with its own checkbox the customer must tick.
- **Saved with the order:** the costs shown and the time the customer agreed are stored on the request. They also appear in the confirmation email. Third-party costs are never added to the Stripe charge.

## 2. Order changes (admin)
Each request gets an **Order & billing** section with these actions:
- **Change package:** for example, $99 to $149. The difference is worked out automatically (+$50).
- **Add charge:** pick a standard add-on (mailbox $25, device $25, migration, standalone domain $49), or enter a custom charge with description, quantity and unit price. Every charge needs an internal reason and an explanation for the customer.
- **Discount or credit:** lowers the total. Downgrading after payment creates a credit. It's recorded only and never refunded automatically: you issue any refund yourself in Stripe, and it's recorded here when Stripe reports it.
- **Change set and approval:** all changes are grouped into one proposed change set that the customer must approve. Nothing is charged automatically.
- **History is kept:** the original order and earlier payments are never overwritten. Every change records who made it, when, why, and the totals before and after.

## 3. Customer approval and payment
- **Email when you click "Send for approval":** shows the original package and price, the proposed changes, why they're needed, the new total, the amount already paid, and the balance due.
- **On the private status page, the customer can:**
  - *Approve and pay*: Stripe Checkout opens for the balance only.
  - *Decline*: the order goes to Awaiting Review for you to decide.
- **After the payment is confirmed:** the package and scope update, the balance goes to $0, and both the customer and Loumilab are emailed.
- **Unpaid requests:** you can resend or cancel them. A cancelled request can't be paid, and an amount already paid can't be collected twice.

## 4. Financial summary and statuses
- **Each order shows:** original amount, approved changes, current total, paid, refunds and credits, outstanding balance, pending requests, and the full payment history.
- **Payment statuses:** Unpaid, Partially Paid, Paid, Additional Payment Required, Refunded, Partially Refunded. These are worked out on the server from recorded payments, never typed in. An order is marked Paid only when every approved charge has been collected.
- **Fulfillment statuses:**
  - New: Awaiting Review, Awaiting Customer Approval
  - Renamed: "Paid — Awaiting Setup" becomes "Ready for Setup"
  - Unchanged: the others stay as they are

## 5. Emails
New emails, all in the existing Loumilab style:
- Changes proposed / extra charge requested
- Payment request (re)sent
- Extra payment received
- Payment unsuccessful
- Scope confirmed
- Balance updated

Internal-only edits send nothing.

## Testing
Automatic checks for the money rules:
- $99 → $149 charges only $50
- Extra mailboxes after payment
- A custom charge
- A discount
- A downgrade creates a credit with no charge
- A cancelled request can't be paid
- Paid is reached only when the balance is $0

Live checks:
- Private access to another customer's order is refused
- A repeated Stripe notification is ignored
- Provider costs appear before checkout and in the email

A real payment isn't possible while Stripe is in live mode. That step is reported as unverified unless you approve a small real charge that you then refund.

## Technical details
- **Tables:**
  - `email_provider_prices`: admin-editable price list; public read through an RPC
  - `email_setup_adjustments`: immutable change lines (kind package_change, addon, custom, discount, credit; qty, unit_cents, amount_cents, reason, customer_note, created_by, change_set_id)
  - `email_setup_change_sets`: proposed, approved, declined, paid or canceled; amount_due_cents; stripe_session_id
  - `email_setup_payments`: immutable ledger of charges and refunds, unique on the Stripe id
- **Request record:** gets `third_party_snapshot` and `third_party_ack_at`.
- **Shared money rule:** a pure `_shared/emailSetupBalance.ts` works out the total, paid amount, balance and payment status in integer cents. It's shared by the server and the tests.
- **`email-setup-admin` new actions:** propose_change, send_change_set, cancel_change_set, resend_change_set, save_provider_price.
- **`email-setup` new actions:** approve_change, decline_change, pay_balance. The amount always comes from the server.
- **Webhook:** `kind=email_setup_balance` records the payment once (unique Stripe id) and applies the change set. `charge.refunded` for email-setup payments adds refund rows.
- **Status values:** service and payment status values are extended. Existing rows are moved over (`paid_awaiting_setup` → `ready_for_setup`).
