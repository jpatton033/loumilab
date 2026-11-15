# Fix: signing in sends Spaces users to Orders

## What's happening
The "Sign in" link in the main site header always opens the general sign-in page, which has no idea you want Spaces. With no product chosen, it falls back to Orders whenever the account has a store — so jpatton033@icloud.com always lands in Orders.

## Changes
1. **Header sign-in follows the page you're on.** On any Spaces page, header "Sign in" opens the Spaces sign-in; on Orders pages, the Orders sign-in. Elsewhere it stays general.
2. **General sign-in asks when you use both.** If someone signs in from the general page and has both a store and Spaces access, show a simple "Where to?" choice: Spaces Library or Orders dashboard. One product only goes straight there, as today.
3. **Remember the last product.** After choosing (or using a product's own sign-in), the browser remembers it, and the general sign-in suggests that product first next time.
4. **Spaces entry points.** Every "Sign in" / "Open Library" button on the public Spaces pages goes to the Spaces sign-in (checked, not assumed).

Already-built product sign-ins (/spaces/sign-in, /orders/sign-in) keep working as they do.

## Technical details
- `Navbar.tsx`: derive portal via `portalForPath(location.pathname)`; link to `portalSignInPath(portal)` or `/sign-in`.
- `portal.ts`: add `hasSpaces` to `DestinationInput`; when no portal/next and both are true, return a chooser marker; add last-portal storage helper (localStorage, no identity). Tests in `portal.test.ts` for: both-products → chooser, Spaces-only → Library, Spaces page header → Spaces sign-in.
- `SignIn.tsx`: look up Spaces workspace membership alongside merchant; render chooser step when needed; save chosen portal.
- Audit public Spaces page buttons for generic `/sign-in` links.
