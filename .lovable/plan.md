# Loumilab Local: free standalone listings, connected to Orders

A refinement, not a rebuild. Local stays at `/orders/local` with the same design language, plus a short `/local` address for marketing links.

## What changes for visitors
- Local page gets its own small identity: a "Loumilab Local" wordmark eyebrow, a Local-focused header line ("Discover local food businesses"), and a quiet "List your business on Loumilab Local. It's free." band. Same colors, fonts, cards.
- Results show every listed business — not only ones with an Orders store.
- New public business profile at `/orders/local/:slug`: photos, category, cuisines, area (city/state or service-area label only), pickup/delivery, website and social links, contact options the merchant chose to show.
  - Local-only business: profile with contact/website buttons.
  - Local + Orders business: same profile plus a prominent **Order Online** button to their store.
- Cards open this profile (Orders merchants also get a direct "Order online" on the card). No account needed to browse.

## What changes for merchants
- New free listing flow at `/orders/local/join` — one short page, a few minutes:
  business name, category, cuisine, city + ZIP or service area, short description, logo/main image, up to 6 food photos, pickup/delivery, website + social links, optional public phone/email.
  Requires only a quick sign-in (email or Google). No plan, no Stripe, no store setup.
- After publishing: optional note "Want customers to order directly from your Local listing? Set Up Online Ordering" — links to Get started, which reuses the same merchant record and prefills name, category, city, logo and photos. No second account.
- Existing Orders merchants: the dashboard Local card becomes **List My Business on Loumilab Local**, prefilled from their store, with preview before publishing (keeps today's behavior, adds the new fields).
- Local-only merchants signing in see a simple "My Local listing" view instead of the full Orders dashboard, with the same optional ordering note.

## Admin
- Admin Orders merchant list labels each merchant Local-only / Orders / both; "Feature on Local" works for both.

## Technical details
- Local-only merchant = a `merchants` row with no storefront; reuse existing ownership/RLS. Add `merchants.has_local_only` not needed — derived from storefront existence.
- Migration on `merchant_local_profiles`: add `slug` (unique), `display_name`, `logo_url`, `gallery_urls text[]`, `offers_pickup`, `offers_delivery`, `website_url`, `social_links jsonb`, `public_phone`, `public_email`, `city`, `region`. Validation of URLs/lengths in a trigger.
- Rewrite `search_local_businesses` to LEFT JOIN storefronts: listed if `is_listed` and (no storefront or storefront published); return `slug`, `store_slug` (null when no Orders store), `accepting`. Paused Orders stores still show, as "Not accepting orders".
- New security-definer `get_local_business(_slug)` returning safe public fields only; granted to anon.
- Get started wizard: if the user already has a merchant row from Local, prefill and create only the storefront.
- Files: `src/lib/orders/local.ts`, `LocalBusinessCard.tsx`, `LocalProfileCard.tsx` (shared form), new `src/pages/orders/local/Join.tsx`, `Business.tsx`, routes in `App.tsx` (+ `/local` redirect), Dashboard branch for Local-only, GetStarted prefill, sitemap/llms.txt, Terms/Privacy line on free Local listings.
