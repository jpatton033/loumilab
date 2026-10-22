# Progressive Pricing on the Orders Website

Shows the new fee structure clearly on the Orders website and on a new pricing page. Payments and Stripe stay exactly as they are. The hero, navigation and page layout stay the same.

## Important: nothing goes live early

The progressive pricing is still off in Super Admin. Everything below that mentions lower fees stays hidden until a version is active (or scheduled with a start date, which shows "Starting [date]"). Before then, visitors only see today's pricing, unchanged. Once you activate it in Plans & Fees, all of these update automatically from the same saved rates. Nothing is typed in twice.

## 1. Orders homepage

- **Short announcement just above pricing** (one line plus a link, no banner): "Your business grows. Our fees shrink." with "As your monthly sales increase, your Loumilab platform fee automatically decreases on additional sales." and a "See how pricing works" link to the new page. It sits under the hero area, so it doesn't compete with "Build Your Free Store".
- **Pricing cards**: same plans, features and buttons. The fee line reads "Starting at 5% / 3.9% / 2.9% platform fee", with one small line: "Lower fees automatically as monthly sales grow."
- **Under the cards**: the existing fee section, refined. It gets the "First $2,500 / Next $2,500 / Next $5,000 / Above $10,000" wording, the $6,000 Launch worked example ($125 + $112.50 + $40 = $277.50, Stripe fees not included), and a phone-friendly layout (each plan stacks as its own small list on phones instead of a sideways-scrolling table). The full calculator moves to the pricing page, and a link points there.

## 2. New page: /orders/pricing

- Plans and features (the same cards as the homepage).
- The fee table, a "How monthly thresholds work" explanation (marginal rates, reset on the 1st Eastern, no retroactive discounts, no need to request anything) and the worked example.
- A "Loumilab fees vs Stripe fees" note: Stripe charges card processing separately, and there's no Loumilab fee on tips or sales tax. Subscriptions and plan features don't change.
- **Calculator**: pick a plan, enter monthly sales, and see the platform fee, the subscription, an estimated monthly total and the overall rate. It's clearly labelled an estimate that excludes Stripe fees and tax.
- **FAQ** (about 6 questions): Do lower rates apply to all my sales? When do thresholds reset? Do I need to request it? What about refunds? Are tips and tax charged? What about Stripe fees? The answers also go into search-engine data (FAQ format).
- A closing "Build Your Free Store" button.
- Its own page title and description, and it's added to the sitemap and the pre-built page list. It's linked from the pricing section and the Orders footer, but not added to the main menu.
- Before activation, the page shows today's plans and flat fees with no progressive claims.

## 3. Merchant dashboard

The "Your fee this month" card is already in place and only shows real numbers once pricing is live. Small additions: the plan's starting fee and "Next reduction: X% after $Y". The card stays hidden when there's no live pricing, so it never shows made-up numbers.

## Checks

- A test that the page example and the calculator use the same math as checkout ($6,000 Launch = $277.50, and all three plans at the threshold amounts).
- Phone (390px), tablet (768px) and desktop screenshots of the homepage pricing and /orders/pricing, with a pricing version temporarily active in a test-only way. The test version is removed afterwards so nothing goes live.
- Links and buttons go to the right places; the homepage's search-engine details are unchanged.

## Technical details

- New `src/pages/orders/Pricing.tsx`, route in `App.tsx`, entries in `scripts/prerender-heads.ts` staticMeta and `scripts/generate-sitemap.ts`.
- Split `ProgressiveFees.tsx` into `FeeAnnouncement`, `FeeTiersTable` (responsive: table at sm+, per-plan lists on mobile), `FeeExample` and `FeeCalculator`. All read `useFeeSchedule()` and the shared `progressiveFee.ts`; plan prices come from `orders_plans` via the existing plans hook.
- `PricingTable.tsx`: when a schedule is live, show the "Starting at" label plus a one-line note per plan; otherwise use the existing `fee_label`.
- Testing preview: a temporary activation in the test browser only. Then: no change to the database or real activation without your approval in Super Admin.
