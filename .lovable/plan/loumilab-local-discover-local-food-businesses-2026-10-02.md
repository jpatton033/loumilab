# Loumilab Local — discover local food businesses

Search, discover, view the business, then order. It's free for every plan, and customers don't need an account.

## What customers get
- **New page `/orders/local`** ("Loumilab Local"): a hero that reads "Discover what's cooking near you." with one search bar (business, food, cuisine, keyword) plus a location box (city or ZIP) and a distance choice (5 / 10 / 25 / 50 miles).
- **Explore Categories**: a row of image tiles (Home chefs, Bakers, Meal prep, Caterers, Food trucks, Pop-ups, Desserts, Specialty, Plate sales). Tapping one filters the results.
- **Featured Local Businesses**: a curated row that Loumilab staff choose. It does not affect the ranking of the main results.
- **Results grid**: cards show the image or logo, name, category, cuisines, general area (city, state), a short description, Pickup/Delivery chips, an "Accepting orders" state, and a **View store** button that opens the merchant's existing storefront.
- **Filters**: Category, Distance, Pickup, Delivery, Accepting orders now. On phones they sit in a sheet that slides up.
- Empty and no-results states point people to nearby categories. The footer band says "Own a food business? Create your store." and links to Get started.
- **Navigation**: "Loumilab Local" is added to the Products menu next to Business Tools, plus a link from the Orders homepage. Each storefront gets a small "Found on Loumilab Local" back link when the visitor came from Local.

## What merchants get
- A **Loumilab Local** card in the dashboard with the toggle "Appear on Loumilab Local: Allow customers to discover your business through Loumilab Local." It is off by default.
- The profile fills itself in from the store's existing name, logo, banner image, description, city, pickup and delivery settings, and product photos. The merchant can optionally set a category, cuisines/food types, a short discovery description (up to 160 characters), a service-area label (for example "Serving East Baltimore"), and a featured image.
- **Live preview** of the card exactly as customers will see it.
- A business only appears when it is opted in **and** its store is published. Paused stores show as "Not accepting orders" or are hidden by a filter.

## Privacy
- Only the city/state or the merchant's service-area label is ever shown. The street address is never shown.
- Distance is measured from the centre of the merchant's ZIP code, never from their exact address. Pickup details stay in the existing after-checkout flow.

## Reviews and future features
- No reviews in this release. The card and data layout leave room for verified-order reviews, favourites, a map, badges, trending, and sponsored spots later.

## Technical details
- Migration: a new `merchant_local_profiles` table (merchant_id unique, storefront_id, is_listed, category, cuisines text[], tagline, service_area_label, featured_image_url, postal_code, lat/lng taken from the ZIP centre, is_featured plus featured_rank, which only staff can edit, and timestamps). It includes the grants and RLS: owners manage their own row, staff manage all, and there is no direct anonymous access.
- A `zip_centroids` reference table seeded from the free US ZIP centroid dataset (about 33k rows). This needs no Google Maps calls and adds no recurring cost.
- A security-definer RPC `search_local_businesses(q, zip_or_city, radius_miles, category, pickup, delivery, accepting)`. It returns only safe public fields for listings that are opted in and published, uses haversine distance, has a capped page size, and is granted to anon. A second RPC `get_local_featured()` returns the featured row.
- When a merchant's profile ZIP or city changes, it is matched to a lat/lng from `zip_centroids` by a trigger.
- Frontend files: `src/pages/orders/local/Index.tsx`, `src/lib/orders/local.ts` (queries plus a category list), `LocalBusinessCard.tsx`, `LocalFilters.tsx`, and `LocalProfileCard.tsx` in the dashboard. The search is debounced and state is kept in the URL query.
- Admin: a "Feature on Local" toggle and ordering in the admin Orders merchant panel, recorded in the audit log.
- SEO: SEOHead plus ItemList JSON-LD. Add the page to the sitemap generator and llms.txt.
