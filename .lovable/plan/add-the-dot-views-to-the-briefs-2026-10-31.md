# Add The Dot. views to the briefs

Add The Dot. numbers to the existing "Website & Growth" section of the daily brief and to the Monday weekly deep dive. The same anonymous page-view data is used, with no new tracking.

## What appears

**Every brief (the brief's normal period, compared with the previous period):**
- The Dot. views: the total, plus the change from the previous period
- The Dot. visits: how many separate visits included any newsletter page
- Hub vs. issues: views of the main The Dot. page and views of individual issues
- Top issues: the three most-viewed issues

**Monday deep dive (7 days, compared with the prior week):**
- 7-day The Dot. views and visits, with the % change
- The five most-viewed issues over the 7 days

If there were no newsletter views, the section shows a single line: "No The Dot. views in this period."

## Technical details
- The only file that changes is `supabase/functions/_shared/ops-brief/collectors/traffic.ts`. `summarize()` gets a `dot` block that filters paths starting with `/the-dot`, splits `/the-dot` from `/the-dot/<slug>`, and returns views, sessions, and the top issue slugs.
- The new figures are added to the section as rows, plus one "The Dot. views" headline metric with a previous-period comparison. They also go into the deep-dive rows.
- After the change I redeploy `ops-brief-run` and do a preview run to check the new rows.
- About "bi-weekly": the code only has the daily brief and the Monday weekly deep dive, so both get the new numbers. If you meant a separate brief that goes out twice a week, tell me and I'll find it.
