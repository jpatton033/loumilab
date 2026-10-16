# Check the 42 "not indexed" pages in Google Search Console

## What I already checked

- The homepage is indexed. Google crawled it on Oct 2 and accepts loumilab.com as the main address.
- Your sitemap lists 62 public pages: 18 main pages, 6 Resources topics, 21 articles, 5 issues of The Dot., 13 Local listings and 1 storefront.
- Private pages are blocked on purpose: admin, sign-in, the Orders dashboard, receipts, quotes and invoices. Google also counts blocked pages as "not indexed," and that's expected.
- Every public page sends search engines its own title, description and main address.

"Not indexed" is usually normal for a site this new, with only 25 search appearances in the last month. Google tends to hold back new or low-traffic pages at first. It labels them "Discovered" or "Crawled – currently not indexed." Search Console doesn't tell me which 42 pages it means, so I'll look them up one at a time.

## What I'll do

1. **Ask Google about every page in the sitemap.** I'll read Google's saved status for each of the 62 pages. This only reads data and changes nothing.
2. **Sort the results** into:
   - Expected: private or blocked pages, redirects, and duplicate addresses such as www or a trailing slash. No action needed.
   - Waiting on Google: discovered or crawled but not yet indexed. This takes time and links, not code.
   - Real problems: wrong main address, "noindex" tags, broken pages, or "page not found" errors. I'll fix these.
3. **Fix only the real problems,** if there are any. Possible fixes: correcting a page's main address, removing a listing that no longer exists from the sitemap, or turning a missing page into a real "not found" response.
4. **Report back** with a short breakdown: how many are fine, how many are waiting on Google, and what I fixed.

Not included: requesting indexing or a live re-crawl. Google only allows that inside Search Console, so I'll tell you which pages are worth requesting there by hand.

## Technical details

- Use one-off calls to Search Console's URL Inspection for the verified `sc-domain:loumilab.com` property, once for each sitemap `<loc>`. Group the results by `coverageState`, `googleCanonical` vs `userCanonical`, `robotsTxtState` and `pageFetchState`.
- Use the sitemap status read for error and warning counts.
- Code changes, if needed, go in `scripts/generate-sitemap.ts` and `scripts/prerender-heads.ts`, or in a route's SEOHead.
