# Make the Orders dashboard require sign-in

## What's wrong
Anyone can open the Orders dashboard without signing in. A signed-out visitor sees a sample business, "Sunday Kitchen", with made-up orders instead of being asked to sign in. Every way into the dashboard leads there, including the "Dashboard" buttons after setup and the "Manage store" and "Back to dashboard" links.

## The fix
- **Signed out:** going to the dashboard sends you straight to the Orders sign-in page. You return to your dashboard after signing in, including with Google or a password reset.
- **Signed in, but no store yet:** you go to the store setup page instead of an empty or sample dashboard.
- **Signed in with a store:** your own dashboard opens, showing only your business name and orders.
- **No sample data:** Sunday Kitchen and the fake orders are removed from the dashboard, so they can never show up again. This includes the "Sign in" button and the "industry preview" switcher that only existed for the sample.
- **No flash:** while sign-in is being checked, a short loading state shows instead of sample content.
- **Same for the website builder:** it also requires sign-in.

## End-to-end check
1. Signed out, open the dashboard. It should land on Orders sign-in.
2. Sign in as a test merchant with a store. It should return to the dashboard showing that store's name.
3. A test account without a store should land on setup.
4. Sign out, then try the dashboard again. It should go back to sign-in.

The test users are removed afterward.

## Technical details
- Add a `RequireMerchant` wrapper using `supabase.auth.getSession()` plus `useMyMerchant()`. If there's no session, `<Navigate replace to="/orders/sign-in?next=/orders/dashboard" />`. If there's a session but no merchant, go to `/orders/get-started`. Wrap the `/orders/dashboard` and `/orders/dashboard/website` routes.
- In `Dashboard.tsx`, drop the `demoOrders`/`demoStorefront` fallbacks and `previewIndustry`, so the dashboard always uses merchant data.
- Add a small test confirming that the sign-in redirect keeps `next=/orders/dashboard`.
