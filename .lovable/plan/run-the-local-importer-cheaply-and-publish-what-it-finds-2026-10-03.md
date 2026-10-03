# Run the Local Importer cheaply and publish what it finds

## Goal
Find real Baltimore food businesses, read their own websites, and publish the good ones to Loumilab Local as "Unclaimed" listings. Usage stays under a hard weekly cap.

## Spending cap
- New **weekly limit: 250 Firecrawl credits** (resets each Monday). On the managed connection that works out to about 1 Lovable credit per week, so the cap is set well below your 250.
- The importer counts real credits, not page visits. A search costs about 2, and each website read costs about 5 (1 for the page plus 4 for structured extraction).
- When the next step would go over the cap, work stops and the Overview shows "Weekly limit reached".
- The weekly figure and remaining credits show in Settings and Overview, and you can change the cap there.

## Cheapest settings
- **1 page per site.** Only the homepage is read, with no site map lookup, which cuts each site from about 6 credits to about 5.
- 5 results per search instead of 10.
- Never re-read a site within 30 days instead of 7.

## First run (done by me after approval, signed in as you)
1. Search 4 categories in Baltimore City and Baltimore County: restaurants, bakers, caterers and food trucks. That is 8 searches, about 16 credits.
2. Approve only domains that are clearly a business's own website. Directories, delivery apps and social sites are skipped.
3. Read up to about 30 sites, about 150 credits. Total use is about 170 of 250.
4. Publish only listings that have a name, a city in Baltimore City or County, a food category, and no duplicate or suppression flag. Everything else stays in the Review queue for you.
5. Report how many were found, published and held back, plus credits used.

Every published listing shows the Unclaimed tag, the public-sources notice, Claim, Suggest update and Request removal, and never an Order Online button.

## Technical details
- Migration: add `weekly_credit_limit` (default 250), `credits_used_week` and `usage_week` to `local_importer_settings`. Change the defaults to `max_pages_per_domain = 1` and `recrawl_cooldown_days = 30`.
- `local-import-run`: add a credit ledger (search = 2, json scrape = 5, map = 1) checked before each call; skip `/map` when the page limit is 1; search limit is 5; return weekly usage.
- Admin UI: show the weekly usage meter and an editable cap in Settings and Overview.
- Publishing goes through the existing `publish_local_candidate` RPC as a staff user. Approval stays the only path to public.
