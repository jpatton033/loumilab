# Business Tools + Food Pricing Calculator

## What you'll get
- **Business Tools page** at `/orders/tools`: the heading "Business Tools" with the line "Free tools to help you price, plan, and grow your business." The Food Pricing Calculator is the main card. Below it are quiet "Coming soon" cards for the Profit & Margin, Catering Quote and Delivery Fee calculators.
- **Food Pricing Calculator** at `/orders/tools/food-pricing-calculator`. It's free and public: no sign-in, no email and no store needed.
- **Navigation**: "Business Tools" goes in the Products menu under Loumilab Orders, on desktop and mobile. There's also a link on the Orders homepage and in the Orders footer links. No other page changes.

## How the calculator works
1. **What are you pricing?** You pick Meal / Plate, Individual Item, Recipe / Batch, Catering Tray, Baked Goods or Other. The wording adjusts to match, for example "How many plates does this recipe make?"
2. **Ingredients**: stacked cards, one per ingredient, with name, package price, package amount and unit, and amount used and unit. You can add, duplicate or remove an ingredient. Compatible units convert automatically: weight to weight, volume to volume, and each to each. For example, a 5 lb bag at $20 with 8 oz used costs $2.00. If the units don't match (say pounds bought but cups used), the card shows a clear note and leaves that ingredient out until it's fixed. Nothing gets converted silently.
3. **Yield**: how many sellable units the batch makes.
4. **Packaging** (optional): containers, labels, bags, boxes and so on. Each item can be set as "per item" or "for the whole batch."
5. **Additional costs** (optional): labor, kitchen rental, utilities and similar, with short helper text.
6. **Cost buffer**: off by default. It has a "What is this?" explanation, you enter your own percentage, and its dollar amount is shown separately.
7. **Pricing**: two tabs.
   - **Suggested price**: you enter the margin you want. Price = cost ÷ (1 − margin). This is true margin math, not markup.
   - **Check my price**: you enter your price and see cost, profit per item, margin and batch profit.
8. **Results panel**: updates as you type. It sticks beside the form on desktop and becomes a pinned summary bar on phones. It shows the cost breakdown, cost per item, suggested and current price, profit, margin and markup (each clearly labelled), and batch profit. Unfamiliar terms have small tooltips. A "How was this calculated?" section expands to show each step in plain words. A small disclaimer notes that these are estimates.
9. **Soft call to action after the results**: "Know what to charge. Now start taking orders." with a **Create Your Store** button to Get Started and a smaller "Learn about Loumilab Orders" link. There are no pop-ups or gates.

## Mobile
Large touch-friendly fields. Number keyboards for prices, amounts and percentages. Cards instead of tables, so there's no sideways scrolling. A quick "Add ingredient" button that jumps to the new card. Your inputs are saved on your device, so a refresh won't lose your work.

## Future-ready
The calculations live in their own module, separate from the screens, and all inputs are one saveable object. Later, logged-in merchants can save, reopen or duplicate calculations and apply a price to a store product. None of that is built now.

## Technical details
- `src/lib/tools/foodPricing.ts`: unit tables (lb, oz, kg, g, gal, qt, pt, fl oz, cup, tbsp, tsp, each), `convert()` returning null for mismatched unit types, `calculate(state)` for the totals, and the wording map for each type. Unit tests go in `src/test/foodPricing.test.ts`.
- `src/data/orders/tools.ts`: the tool registry (slug, name, description, status live/soon).
- Pages: `src/pages/orders/tools/Index.tsx` and `FoodPricingCalculator.tsx`. Components go in `src/components/orders/tools/`: IngredientCard, CostLineCard, BufferToggle, ResultsPanel, HowCalculated, ToolsCta.
- Routes in `App.tsx`. A Products menu entry through `src/data/products.ts`. SEOHead gets a unique title and description, plus WebApplication and BreadcrumbList structured data. Both pages are added to the sitemap and llms.txt.
- Existing tokens, `Layout`, `Eyebrow`, shadcn inputs, rounded-3xl cards and localStorage for drafts. No backend changes.
