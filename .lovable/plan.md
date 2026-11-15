# Spaces & Orders portal access refinement

## What exists today
- One shared account system for all of Loumilab (email/password + Google). Spaces and Orders already use the same accounts, so no merging or migration is needed.
- One generic sign-in page (`/sign-in`) for everything. With no destination given, it sends everyone to the Orders dashboard (admins to Admin). A Spaces customer who signs in directly lands in Orders.
- Spaces sends signed-out visitors to `/sign-in?next=/spaces/app`, so that path works, but the page never says "Spaces".
- Sign-up is generic: nothing tells the person which product they are joining.
- Sign out (`/sign-out`) ends the whole shared session and always returns to the homepage.
- Password reset is shared (`/reset-password`) and returns to a generic place.
- Orders access is based on owning a merchant record. Spaces access is based on workspace membership. Both are checked by the server. Nothing is created automatically for the other product.

## Recommended approach
Keep one shared account and one session, which is secure and already works. Make each product feel like its own portal by giving it its own branded entry pages and destinations. No account migration.

## Changes
1. **Product-aware sign-in and sign-up.** `/sign-in` accepts a product (`spaces` or `orders`):
   - The heading, wording, and logo treatment say "Loumilab Spaces" (current Spaces look) or "Loumilab Orders" (current Loumilab logo).
   - Short entry addresses `/spaces/sign-in` and `/orders/sign-in` point to the same page with the product set. The existing `/sign-in` keeps working.
2. **Correct landing after sign-in:**
   - Spaces: the Library. If the person has no workspace yet, they go to Spaces onboarding to create one.
   - Orders: the merchant dashboard. If they have no business yet, they go to Orders setup and continue saved progress, never back to step 1.
   - Any protected page the person asked for is still kept as the destination and is only allowed if it is a same-site path.
   - Admins still go to Admin only when no product was chosen.
3. **Sign-up per product.** Confirmation and Google sign-in links return to the chosen product. No storefront or workspace is created automatically.
4. **Sign out.** Each portal shows a clear Sign Out. It ends the shared session (stated plainly: "You'll be signed out of all Loumilab products"), clears cached data, and returns to that product's sign-in page.
5. **Expired sessions.** Protected pages in both portals send the person to their product's sign-in page with the page kept, plus a short "Your session expired" note.
6. **Password reset.** It remembers the product and returns the person to that product's sign-in after the password is changed. A signed-in password change asks for the current password.
7. **Returning customers.** Restore the last selected Spaces workspace and Orders business; show a picker when there are several.
8. **Clear links.** Each product's public page, sign-in page, and portal link to each other. There is no cross-product menu inside the portals.

## Security notes
- All data access stays enforced by existing server rules. This work changes only routing and messaging.
- Customer apps run in an isolated sandbox. Customer subdomains will not receive the sign-in session; the session stays scoped to loumilab.com.
- Destination links are limited to same-site paths to prevent open redirects.

## Testing
I'll add small tests for the destination rules: product to landing page, safe destination only, and no access leading to onboarding. I'll also check in the browser: sign in and sign out for each product, an expired session, and a password-reset start. I won't complete a real password-reset email round trip.

## Technical details
- New `src/lib/portal.ts`: `type Portal = "spaces" | "orders"`, `portalSignInPath`, `resolvePostAuthDestination({portal, next, hasMerchant, hasWorkspace, isAdmin})` (pure and tested).
- Edit `SignIn.tsx` (portal param, branding, routing), `SignOut.tsx` (`?portal=` return), `ResetPassword.tsx`, `authRedirect.ts`, `spaces/Dashboard.tsx` and `orders/Dashboard.tsx` guards, and `App.tsx` alias routes. Add the new sign-in URLs to prerender/sitemap as noindex-safe or exclude them.
- Record a rule in AGENTS.md: post-auth routing only through `resolvePostAuthDestination`.
