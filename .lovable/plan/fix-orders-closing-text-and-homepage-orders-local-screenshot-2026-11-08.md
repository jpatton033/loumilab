# Fix Orders closing text and homepage Orders & Local screenshots

## 1. Orders page — "Start taking Orders." legibility
The closing black panel shows "Start taking Orders." in the accent color, which nearly matches the dark background.
- Change that line to the bright off-white headline color so it reads clearly on black (keeps blue reserved for the Dot).
- Check the small text in the same panel ("Your storefront is only a few minutes away…", "Compare alternatives: Square · Shopify · Toast") and switch it to the light muted tone used on dark sections so it also reads well.
- Make the main button off-white with black text, matching the dark-section button rule.

## 2. Homepage — Orders & Local screenshots cut off
The rotating stack forces every image into a fixed 4:3 frame and crops to fill it, so the store builder, Local and dashboard screenshots lose their edges/bottom.
- Let each slide declare how it fits: screenshots show in full (fit inside the frame on a matching dark surface, top-aligned), while the market photo keeps filling the frame.
- Keep the off-to-the-right "next" card from being clipped by the section edge on smaller screens.
- Verify on desktop (1280) and phone (390) that each of the four slides shows the whole screenshot with no sideways scrolling.

## Technical details
- `src/pages/Orders.tsx` final CTA: `text-accent` → `text-inverse`; muted copy → `text-inverse-muted`; competitor links → `text-inverse`; button → `bg-background text-foreground`.
- `src/components/brand/story/Horizontal.tsx` `LayeredStack`: add optional `fit?: "cover" | "contain"` on `Frame`; contain uses `object-contain object-top bg-ink`.
- `src/pages/Index.tsx` `productStack`: mark the three screenshots `fit: "contain"`.
