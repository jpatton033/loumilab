# Orders page: homepage-style preview + shorter page

## 1. Add the homepage Orders showcase
Bring the homepage's dark "Loumilab Orders" band (title, short pitch, phone frame with the example storefront) onto the Orders page, right after the opening section. On phones, the full-width builder screenshot (too small and simple there) is hidden and the phone-frame storefront shows instead; on desktop the builder screenshot stays.

## 2. Shorten the page (about 17 sections down to 9)

Keep, in this order:
1. Opening section (headline, Get Started button)
2. New dark storefront showcase (from homepage)
3. Slideshow
4. How it works (3 steps)
5. Live preview picker (try a store type), merged with the "Try it" invitation
6. Merchant dashboard screenshot, with order status badges folded into it (replaces separate "Order management" section)
7. Who it's for (six photo cards; industry strip removed)
8. Pricing (cards, fee announcement, $100 example; full fee bands stay on /orders/pricing with a link)
9. Features grid (trimmed to the 6 strongest)
10. Black closing section + compare links + Local/Tools/Terms/Privacy links

Remove:
- "Start building" statement band (repeats the opening)
- Storefront assembly animation (repeats How it works)
- Social commerce section and flow diagram (one line folded into Features)
- Photo split and dot-thread / people sequence (repeat "Who it's for")
- Industry strip
- Immersive image break before the closing
- Separate "Order management" section
- Detailed progressive-fee breakdown (lives on the Pricing page)

Promo banner stays where it is. No text, prices or plans change; removed pieces are only hidden from this page.

## Technical details
- Extract the homepage band into `src/components/orders/OrdersShowcase.tsx`, use it on both `Index.tsx` and `Orders.tsx`.
- Builder `ScreenFrame` gets `hidden md:block`.
- Edits limited to `src/pages/Orders.tsx`, `src/pages/Index.tsx`, new component. Check at 390px and 1280px afterward.
