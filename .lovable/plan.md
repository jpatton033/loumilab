# Unique, fitting photos for every sample website

## The problem
The six sample websites in "See what you can create" keep reusing the same few photos:
- **Ember Kitchen (catering):** one caterer photo is used four times, as the hero and all three menu items.
- **Brightside Cleaning:** one photo is used four times.
- **NORTHLINE streetwear:** it uses a boutique photo and a ceramic designer photo for a tee, a hoodie and a cap, so none of them show clothing.
- **Mae's Bakehouse:** the hero photo is also the "Celebration cake" product.
- **Crown Studio:** the braids photo is both the hero and the first gallery photo.
- **Ines Duarte Studio:** the flower photo appears three times, and the designer and boutique photos come back from other sites.
- **Orders page:** the cake photo is used in both the showcase and the "Build" column.

## The fix
Every photo appears once across the whole Orders page, and each one shows exactly what its label says.

| Site | Hero | Products / gallery |
|---|---|---|
| Mae's Bakehouse | new: baker's counter with a morning bake | cake, cupcakes, cookies (existing) |
| NORTHLINE | new: street-style model in a hoodie | new: folded heavyweight tee, printed hoodie, logo cap |
| Ember Kitchen | new: catering buffet spread | wings tray, mac & cheese, alfredo (existing; menu renamed to match) |
| Crown Studio | new: stylist with a client in the salon | braids, silk press, cut (existing) |
| Brightside Cleaning | new: cleaner in a bright living room | standard, deep, move-out clean (existing, each different) |
| Ines Duarte Studio | new: studio installation | bouquet, gift arrangement, arrangement (existing) for commissions and the gallery |

- **New photos:** about 8, all AI-made in the site's style: real people from many cultures, natural light, and no laptops, coffee, plants or phone mockups as the subject. Each product photo is square-friendly and centered, so it isn't cut off in the cards.
- **Names and prices** change only where needed to match a photo, for example Ember's menu.
- **Orders page "Build" column:** gets its own photo, so the cake isn't shown twice.
- **Check:** an automatic test fails if any photo is used twice in the sample websites. I'll also look at every slide on desktop and phone.

## Technical details
- New images go in `src/assets/orders/showcase/` as imported JPGs (vite-imagetools WebP), following the existing pattern.
- Update `SHOWCASE` in `src/lib/orders/builder/presets.ts` and the cakeShot import in `src/pages/Orders.tsx`.
- Add `src/test/showcaseImages.test.ts`, which collects hero, product and gallery images across `SHOWCASE` and asserts they're all unique.
