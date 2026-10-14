# Turn on the Meta Pixel (ID 1096079062830163)

## What changes
- Switch on Meta tracking for the Loumilab site using your Pixel ID. Everything else is already built and stays the same:
  - People in Europe, the UK, and Switzerland see the cookie banner first. Tracking only starts there after they press Accept. Everywhere else it runs without a banner.
  - Meta counts page views, sign-ups, inquiries, newsletter sign-ups, store setup starts, and published stores.
  - No names or emails are ever sent to Meta.
- Check that the privacy policy names Meta, what's shared (page visits and sign-up actions), and why (measuring ads). Add that wording if it's missing.

## Checks before you run ads
1. Open the site in a test browser, accept cookies, and confirm Meta actually receives the page view and a test sign-up for this Pixel ID.
2. Confirm visitors in a consent region who press Reject send nothing to Meta.
3. Confirm the Pixel loads only once.
4. Publish so the live site at loumilab.com has the tracking, then check that Meta shows the Pixel as active.

## Still open
- Sign-ups through Google aren't counted yet, only email sign-ups. This can be fixed next.
- Letting people build their store before creating an account (next on the list).
- Google tag: waiting on your G- or AW- ID.

## Technical details
- Set `META_PIXEL_ID = "1096079062830163"` in `src/lib/tracking/index.ts`. The existing consent gate and event map stay unchanged.
- Run a Playwright check against `facebook.com/tr` requests with `id=1096079062830163`, for both accept and reject.
- Review the Meta disclosure in `src/data/orders/legal.ts`.
- Update `roadmap.md`.
