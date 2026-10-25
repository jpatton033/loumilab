# Business Email under Services in the menu

Turn "Services" in the top menu into a small dropdown, styled and behaving like the existing Products dropdown.

## Desktop
- Clicking "Services" opens a small panel with:
  - **All services**: overview of design, build, innovate and secure (links to /services)
  - **Business Email & Domain Setup**: professional email on your own domain, from $99 (links to /services/business-email)
- It closes on outside click, Escape and route change, the same way Products does. Only one dropdown is open at a time.

## Mobile
- "Services" becomes an expandable row like Products, with the same two links indented beneath it.

## Not changed
Other menu items, their order, styling, and all pages.

## Technical details
- Edit `src/components/Navbar.tsx` only: add `servicesOpen` / `mobileServices` state and reuse the Products panel markup and close handlers.
- Check at 390px and 1280px.
