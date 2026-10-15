# Turn on Google tracking via Tag Manager (GTM-M69KVPPK)

## What changes
- Switch on Google tracking for the Loumilab site using your Tag Manager container. Everything already built stays the same:
  - People in Europe, the UK, and Switzerland see the cookie banner first. Google loads only after they press Accept. Everywhere else it loads without a banner.
  - The same events already sent to Meta (page views, sign-ups, inquiries, newsletter sign-ups, store setup starts, published stores) also flow into Google's data layer, so any tags you add inside Tag Manager (Google Analytics, Google Ads) can use them.
  - No names or emails are ever sent.
- Publish so the live site at loumilab.com has the tracking, then confirm in Tag Manager's Preview mode that the container loads and events arrive.

## Note on the ID
- GTM-M69KVPPK is a Tag Manager container, not a direct Google Analytics/Ads tag. The site will load the container; which measurements happen (Analytics page views, Ads conversions) depends on the tags you configure inside Tag Manager. If you'd rather track directly without Tag Manager, a G- or AW- ID works with the existing setup instead.

## Checks
1. Accept cookies on the preview and confirm the Tag Manager script loads once with the correct container ID and a page view is pushed.
2. Confirm visitors who press Reject load nothing from Google.
3. Publish, then use Tag Manager Preview on loumilab.com to verify.

## Technical details
- In `src/lib/tracking/index.ts`: replace the gtag.js loader with a GTM loader (`googletagmanager.com/gtm.js?id=GTM-M69KVPPK`), keeping the same consent gate (`applyConsent`, consent revoke on withdrawal) and the existing `track()` event map, pushing events to `dataLayer` with the same names.
- Update the `GOOGLE_TAG_ID` constant to accept the GTM- ID.
- Playwright check: `googletagmanager.com/gtm.js` requests with `id=GTM-M69KVPPK` on accept, none on reject.
- Update `roadmap.md` (Google tag item resolved).
