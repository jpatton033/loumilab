# Sitewide Scroll Behavior

Make every navigation land at the top of the page instantly, and add smooth, polished scrolling with scroll-triggered reveals on desktop and mobile.

## 1. Land at the top on every navigation

- Add a `ScrollToTop` component mounted inside the router that resets scroll to the very top on every route change, using an instant jump (no animation).
- Keep the existing behavior where clicking the logo on the homepage smooth-scrolls to top.
- Restore top position on browser back/forward as well, so a returning page never opens mid-scroll.

## 2. Smooth scrolling (web + mobile)

- Enable smooth scrolling for in-page anchor links only, so route changes stay instant while jumps to sections glide.
- Add mobile-friendly scroll polish: overscroll containment so menus don't scroll the page behind them, and consistent touch scrolling inside the mobile nav.
- Add a small "back to top" control that appears after scrolling down and smooth-scrolls to the top; hidden at the top of the page.
- Respect `prefers-reduced-motion`: all smooth behavior falls back to instant.

## 3. Scroll-triggered reveals

- Use the existing `Reveal` component as the single reveal primitive; extend it if needed with stagger and direction options.
- Apply reveals consistently to section headers, cards, and grids across Home, Services, Products, Orders, Work, About, How We Work, Insights, and Contact — one shared easing and short fade-and-rise distance.
- Reveals run once per element, never block content (content is visible if animation cannot run), and are disabled under reduced motion.

## Technical notes

- New: `src/components/ScrollToTop.tsx`, `src/components/BackToTop.tsx`.
- Edited: `src/App.tsx` (mount both inside `BrowserRouter`), `src/index.css` (anchor smooth-scroll, `scroll-padding-top` for the fixed header, overscroll rules), `src/components/Reveal.tsx` (stagger/direction), and page files to wrap sections in `Reveal`.
- No backend, routing, or content changes. Verified with screenshots at desktop and mobile widths.
