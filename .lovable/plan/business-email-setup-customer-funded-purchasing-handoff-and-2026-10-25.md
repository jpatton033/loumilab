# Business Email Setup: Customer-Funded Purchasing, Handoff and Management Plans

This builds on the current Business Email & Domain Setup service. The questionnaire, $99/$149 packages, add-ons, Stripe checkout, change requests, payment records and admin page all stay as they are and get extended.

## What changes for customers
1. **Pay once upfront (optional).** After the questionnaire, customers choose between:
   - "Loumilab buys it for me": we confirm the real domain and email-hosting prices, then send a quote.
   - "I'll pay providers myself": works the way it does today.
2. **Quote, then pay.** For the "Loumilab buys it" option, an admin enters the confirmed prices: domain cost for the first year, plus email hosting for the first period with the correct monthly or annual billing. The customer reviews an itemized summary on their private status page: setup fee, add-ons, domain, email hosting, and the billing period and commitment for each. Checkout only happens after this. No estimated amounts are ever charged.
3. **Purchase authorization.** Before paying, customers must check seven acknowledgements: Loumilab may buy on their behalf, the providers are independent companies, the customer owns the accounts, provider terms apply, the setup fee is separate, the customer pays future renewals, and anything extra needs new approval. We save the wording, the approved amounts and the time.
4. **Status page with eight stages:** Submitted, Payment confirmed, Purchasing services, Domain configuration, Email configuration, Testing, Billing & ownership handoff, Completed. Each stage lists what the customer needs to do, such as accepting an invitation or setting up their own password. Internal payment methods and credentials are never shown.
5. **Optional management plans:** Essential at $19/month and Business at $39/month. Customers can choose one, but it only starts after setup is complete and they confirm activation. It runs as a Stripe subscription and can be cancelled at any time without affecting their domain or email. Monitoring is described as checks we do by hand. We don't claim it's automated.

## What changes for Loumilab admins
- **Purchasing budget vs. what we actually spent.** Each order records the approved third-party budget, plus each real purchase: provider, amount, date, reference number, billing commitment and renewal date. Purchases are entered by hand. Nothing is bought automatically.
- **Money breakdown:** Customer funds collected, Loumilab service revenue, Third-party budget, Actual purchase expenses, Remaining balance.
- **Over budget:** the order is flagged, and the existing change-request flow asks the customer to approve and pay the difference before we buy.
- **Under budget:** the order shows the leftover amount owed back to the customer. An admin then records a refund (issued in Stripe) or a credit the customer approved. The leftover can't be counted as revenue.
- **Handoff checklist (10 items).** All items must be checked before an order can be marked Completed. If a provider can't transfer billing, the order is flagged "Needs manual review" and offers customer-direct payment instead.
- **Management tab:** subscription status, plus a monthly or quarterly manual check log.

## Emails (existing sender)
New messages: purchase authorization confirmed, services purchased, approval or extra payment needed, progress updates, handoff action required, setup complete with ownership and renewal details, and management plan activated. Each email lists one-time Loumilab fees, third-party amounts and recurring fees separately.

## Technical details
- Migration adds:
  - `purchase_mode` and `third_party_budget_cents` fields, plus an authorization snapshot, on orders.
  - A `email_setup_purchases` table (immutable expense entries, staff only).
  - Handoff checklist stored as JSON, plus a fulfillment stage enum.
  - A `email_setup_management` table (Stripe subscription id, plan, status) and a manual check log.
  - An extended hashed-token status RPC.
- `_shared/emailSetupPricing.ts` gains the management plan prices. `_shared/emailSetupBalance.ts` is extended to work out the third-party budget vs. spent vs. leftover (in cents, pure function, with tests).
- `email-setup` adds actions: `approve_quote` (server-priced checkout that splits service and third-party line items with metadata), and `activate_management` (Stripe Checkout in subscription mode).
- `email-setup-admin` adds actions: `set_quote`, `record_purchase`, `update_handoff`, `set_stage`. The server blocks Completed until the handoff is done.
- The Stripe webhook branch handles `customer.subscription.*` events for kind=email_setup_mgmt. Duplicate events are ignored.
- Tests cover: budget over and under, completion blocked without handoff, the quote amount matching checkout, and management prices.

## Out of scope and prerequisites
- Domain and email purchases are not automated. No reseller APIs.
- Before going live: turn on the Stripe subscription events and the async, expired and refund events. Then run a small real end-to-end test. Add the service's refund and nonrefundable-fees terms. Decide how sales tax is handled (not charged today).
