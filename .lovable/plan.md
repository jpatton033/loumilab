Change the Orders button wording from "Build Your Free Store" to "Get Started".

- Update the shared Orders button label (used on the Orders page, homepage Orders band, Pricing, Compare pages, live preview picker, and the closing statement) to "Get Started".
- Update the two slideshow slides on the Orders page that still say "Build Your Free Store" to "Get Started".
- The button still opens the same store setup page. Nothing else changes.

Technical: `src/data/orders/cta.ts` label (variant renamed to `get-started-v1` so tracking separates the wording), and two `cta_primary` labels in `src/data/orders/hero-slides.ts`.
