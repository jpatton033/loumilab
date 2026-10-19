# Live Preview: choose your own storefront

Turn the "This is what your customers see." section on the Orders homepage into a picker of example stores. Sunday Kitchen stays first and selected by default. Everything else on the page stays the same.

## Example stores (fixed sample data, the same on every visit)
Food and retail:
1. Sunday Kitchen: plates (the current store, unchanged)
2. Sweet Crumb Bakery: cakes, cupcakes, cookies
3. Petal & Stem Florist: bouquets, arrangements, gift boxes

Services:
4. Bright Current Electric: diagnostic visit, outlet/fixture install, panel upgrade (already in the sample data)
5. Fix-It Handyman Co.: hourly help, TV mounting, furniture assembly
6. Studio Luxe Hair Salon: silk press, braids, cut & style
7. Fresh Nest Cleaning: standard clean, deep clean, move-out clean

## How it works
- A row of labeled chips (business name plus type, like "Electrician") appears above the store. It scrolls sideways on phones, and visitors can also use previous/next arrows and the arrow keys.
- Each example uses the same store header and product cards real merchants get, so it shows exactly what customers would see.
- Food and retail stores keep the "Add" button and sample cart.
- Service stores use the wording real service merchants get, for example "Request" or "Book" with a "Sample request" button. Service listings without photos show the regular no-photo card.
- Switching stores clears the sample cart. A quiet "Demo store, no payment or order is sent" note stays.
- Below the store, a link reads "Build a store like this", leading to setup as it does today.

## Images
I'll generate three photos each for the bakery and florist. The service stores follow what real service merchants usually upload, so they won't have product photos.

## Safety
These stores exist only on this page. They create no real stores, orders, payments, notifications or analytics events.

## Technical notes
- Add the sample stores to `src/data/orders/storefronts.ts` (each with an industrySlug: bakery, retail, electrician, handyman, beauty, cleaning).
- New `LivePreviewPicker` component in `src/components/orders/` that holds the selected store and the `useCart` state, and renders `StorefrontHeader` + `StoreProductCard` + `CartBar`. Wording for the action and checkout buttons comes from the existing industry terminology in `src/lib/orders/industries.ts`.
- Replace only the inner block of the Live Preview section in `src/pages/Orders.tsx`.
- Test at phone, tablet and desktop sizes.
