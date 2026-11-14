# Get more visitors — first step: make ad visits count

## What I found (Oct 16 – Nov 14, 2026)
- About 513 visits, mostly US phones. About 268 came from Instagram/Facebook ads, landing on the Orders and Business Email pages; 88% of those left after one page.
- 22 visits started store setup in the last 30 days; 1 store is published in total.
- Google: homepage indexed, 10 clicks / 169 views in search (Oct 15 – Nov 11). Search basics all pass.
- Audiences: home bakers/caterers stuck with orders in DMs and Venmo (holiday rush); small owners afraid email setup will "break the website".

## Ranked plan
1. **Fix the ad landing pages (this plan).** More ads won't help while most ad visitors leave right away.
2. Ask KTaylor'd Cakes (Akron) for feedback and a short case study; offer her the $99 email setup (she uses a Gmail address).
3. Akron outreach: Akron Food Works volunteer form, Akron library small-business center, SCORE Northeast Ohio events (Nov 17, 18).
4. "Loumilab vs Hotplate" page and a plain-language business email setup guide.
5. Review the Meta ad campaigns before spending more.

## What this plan changes
Orders page (top section):
- Under the headline, add the real $100-sale example ("You keep $93.30") and the line "No monthly fee to start."
- One main button, "Get Started", plus "See how pricing works".
- A short three-step strip: build your menu, share your link, get paid orders.

Business Email page (top section):
- Lead with the worry: "Professional email, without breaking your website."
- Show "$99 one-time · we do the DNS for you · 7 days of support" near the top, and one main button to start.

## Your decision needed (not changed by this plan)
- On the Starter plan, the fee drops to 2.7%, then goes back up to 3.5% above $7,500 a month. The pricing page says fees shrink as you grow. Should that top band be changed, or the wording?

## Technical details
- Orders hero: src/pages/orders/Index (hero block) using existing saleExample.ts for the $100 figure — no hardcoded numbers.
- Business Email hero: src/pages/services/BusinessEmail, prices from _shared/emailSetupPricing.ts.
- Existing tracking events unchanged; compare ad bounce and setup starts for 7–14 days after publish.
