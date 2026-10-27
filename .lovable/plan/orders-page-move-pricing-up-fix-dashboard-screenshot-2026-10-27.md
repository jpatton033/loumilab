# Orders page: move pricing up, fix dashboard screenshot

## 1. Move pricing
New order on the Orders page:
1. Top section
2. Black storefront section
3. Slideshow (ends on "Free forever.")
4. Pricing (moved here)
5. How it works
6. Live preview
7. Dashboard
8. Who it's for
9. Features
10. Black closing section

Nothing in the pricing section changes, only where it sits on the page.

## 2. Fix the cut-off dashboard picture
The dashboard picture itself is cropped on the right edge: the third revenue card and the order prices are cut off. That's a problem with the picture, not the page layout. I'll retake the screenshot of the demo dashboard at a desktop width so the whole width fits, including all three cards and the full order prices with their status labels, then replace the old picture. The frame around it stays the same.

## Technical details
- `src/pages/Orders.tsx`: move the `#pricing` section block to right after `PromoBanner` (before `#how-it-works`).
- Recapture `/orders/dashboard` (demo data) with Playwright at 1440px. Clip to the dashboard content column, from the metric cards through the first few queue rows, with margin on both sides. Overwrite `src/assets/orders/screens/merchant-dashboard.jpg` and keep a similar aspect ratio.
- Verify at 390, 722 and 1280px that the frame shows the full right edge.
