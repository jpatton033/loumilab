# Homepage sample websites: add the slow top-to-bottom glide

## What's going on
The slow top-to-bottom glide was only ever added to the sample websites on the Orders page. The homepage uses a separate slideshow that never had it. Recent homepage changes didn't remove anything. The homepage version just stops at the top of each sample site.

## Change
Give the homepage slideshow the same gentle glide as the Orders page:
- Each sample website starts at the top, then slowly glides to the bottom over about 4 seconds.
- It starts over at the top when the next site appears or when switching between phone and desktop view.
- It stops when the pause button is pressed or motion is turned off.
- Page scrolling is never held up, same as the Orders page.

## Technical details
- File: `src/components/orders/showcase/SiteShowcase.tsx`.
- Copy the auto-pan from CustomizeShowcase: frame/inner refs, a `pan` state reset when i/viewport/paused/reduced change, and an 800ms timeout that sets pan to scrollHeight − clientHeight.
- Apply `translateY(-pan)` with a 4s transition on the slide wrapper. The SitePreview wrapper loses `h-full` so content can be taller than the frame.
- Check in the browser at 390px and 1280px that the transform value changes over time.
