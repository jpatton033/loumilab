# Refresh photos: Business Email, Domain Setup, and Orders "Who it's for"

## What changes
New realistic, warm, natural-light photos of real-looking people at work, matching the light premium Loumilab style. No text, logos, or brand marks in images.

**Business Email page (2 photos)**
- Top photo: small-business owner at a counter checking a professional inbox on a laptop.
- Ownership section photo: two colleagues reviewing account setup together at a bright desk.

**Domain Setup page (1 photo)**
- Its own new photo (it currently reuses a Business Email photo): owner at a laptop setting up a website address, a storefront visible behind them.

**Orders "Who it's for" (6 photos)**
- Food Sellers: home chef packaging plated meals.
- Pop-Ups: vendor at a farmers-market tent handing over an order.
- Creators: creator packing merch for a limited drop.
- Local Businesses: shop owner behind the counter of a neighborhood store.
- Service Businesses: stylist or technician with a client, booking on a tablet.
- Side Hustles: person photographing products at home for social media.

Titles, descriptions, and layout stay the same. Photos are AI-generated; swap in licensed photos any time.

## Technical details
- Replace `src/assets/people/email/shop-owner.jpg` and `office-review.jpg` in place; add `src/assets/people/email/domain-setup.jpg` and point the `domains` entry in `src/data/services.ts` to it.
- Replace `src/assets/orders/aud-{food,popup,creator,local,service,side}.jpg` in place (same names, same aspect ratio), so no code changes are needed there.
- Verify Orders and both service pages at 390px and 1280px.
