# Simplify Orders Pricing Examples and Verify Fee Accuracy

Plan names stay as saved: Starter ($0), Business ($19), Premium ($49). Rates, thresholds and subscriptions do not change. Hero, cards and builder stay as they are. Progressive pricing stays switched off until you activate it.

## 1. Audit and fix examples
- Check the Orders homepage, the pricing page, FAQ, store setup, the merchant dashboard and the fee explanations for wrong, confusing or inconsistent numbers.
- Fix the $6,000 example label so the plan name matches the rates shown. Today it says "Starter" for the $0 plan, which reads like the $19 plan.
- Take large monthly examples off the homepage. The detailed worked example appears only on the pricing page.
- Update the Premium card line "Lowest 2.9% platform fee" so it doesn't contradict progressive pricing once it's live.

## 2. New $100 example (pricing section and pricing page)
Compact card: "You make a $100 sale." on the Starter plan ($0):
- Loumilab platform fee (5%): $5.00
- Estimated Stripe processing (2.9% + $0.30): $3.20
- Estimated merchant proceeds: $91.80

Small note: Stripe processing is an estimate. Assumes a $100 merchandise subtotal with no tax, tips, delivery or promotions. Proceeds are not a guaranteed payout. The numbers come from the saved rates, not typed in by hand.

## 3. Simpler homepage language
- Headline "Your business grows. Our fees shrink." with the new supporting line.
- An expandable "How do lower fees work?" with five plain points: starting fee, lower rates as sales grow, only on additional sales, monthly reset, nothing to request. Plus a link to the full table on the pricing page.
- Clear separation of Loumilab fee, Stripe processing and subscription. No Loumilab fee on tips or tax.

## 4. Verify charges (Stripe test mode)
- Run the automated fee tests for every plan, threshold-crossing orders, tax/tip exclusion, monthly reset, refund volume and the 0% promotion.
- Review checkout, invoice payments and the Stripe webhook: correct application fee, refunds, failed and canceled payments, and the dashboard breakdown.
- If test-mode keys are available: place test orders and compare the expected fee with Stripe's recorded application fee. If not, report this as unverified rather than claiming it passed.
- Nothing is activated in production. Any real problem found is reported for your approval before payments code changes.

## 5. Final summary
Incorrect examples fixed, wording simplified, what was verified and how, any mismatches between displayed fees and actual charges, and open items.

## Technical details
- Add a `FeeSaleExample` to `ProgressiveFees.tsx` that uses `progressiveFee` with Stripe's 2.9% + 30¢ estimate as a labelled constant. Plan names come from `useFeePlans`.
- Homepage section: replace `FeeExample` and the table with a `<details>` explainer. The table and example stay on `/orders/pricing`.
- Before activation, the $100 example uses the plan's flat fee.
- Add a test asserting $100 → $5.00 / $3.20 / $91.80, then run the existing `progressiveFee` and `promotions` tests.
