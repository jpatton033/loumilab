# Terms of Service and Privacy Policy in the footer

## What changes
- Add "Terms of Service" and "Privacy Policy" links to the bottom bar of the shared footer, next to "Cookie settings". This bar appears on every page that uses the site footer.
- Same small text style and Loumilab Blue hover as the existing "Cookie settings" link. Nothing else in the footer moves.
- On phones the links wrap neatly under the copyright line.

## Where they go
- The only Terms and Privacy pages today are the Loumilab Orders ones. The links point there:
  - Terms of Service: /orders/terms
  - Privacy Policy: /orders/privacy
- If you'd like separate studio-wide Terms and Privacy pages later, that's a separate piece of work.

## Technical details
- Edit `src/components/Footer.tsx` only: two `Link`s added to the bottom-bar `span` alongside the Cookie settings button.
