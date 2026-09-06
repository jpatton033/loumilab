# Add merchant "Go to dashboard" link to Loumilab Orders homepage

Add a clear, secondary entry point for returning merchants on the Loumilab Orders marketing page (`/orders`) that takes them to `/orders/dashboard`.

## What will change
- In `src/pages/Orders.tsx`, inside the hero section below the primary "Create Your Store" CTA, add a "Go to dashboard" link.
- Style it as a subtle, underlined text link (e.g., "Already have a store? Go to dashboard") so it does not compete with the primary conversion action but is easy to find for merchants.
- Link target: `/orders/dashboard`. The existing dashboard route already handles unauthenticated users by redirecting them through the sign-in flow.

## What will not change
- No new pages, routes, backend logic, or dependencies.
- Primary "Create Your Store" CTA remains unchanged.
- Other marketing copy, layout, and styling remain unchanged.

## Verification
- Confirm the link appears on `/orders` and navigates to `/orders/dashboard`.
- Confirm build passes with no errors.
