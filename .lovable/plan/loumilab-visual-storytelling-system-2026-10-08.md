# Loumilab visual storytelling system

Make photography and short statements a regular part of how Loumilab pages flow, so pages stop reading as text, then cards, then text again. Orders and Local get the most of it. The four existing photos stay exactly as they are (baker taking orders, café pickup, studio team, reading). New photos are made to match their warm, natural look.

## 1. A shared family of visual breaks
Every page picks from one set, so the site always looks like Loumilab:
- **Immersive Image** — wide photo, no text or a single line of text.
- **Image + Statement** — strong photo with one headline.
- **People Sequence** — a row of photos you swipe or scroll sideways. On computers you can also use arrows. It never moves on its own.
- **Split Story** — the existing photo-beside-text section, kept as is.
- **Category Transition** — a short photo band with a label that opens a new topic.
- **Editorial Moment** — photo plus a short idea, or a figure we can back up. No made-up statistics.

All of them share the same rounded frames, Loumilab Blue details, spacing and fade-in. Copy stays to one headline, plus at most one sentence. On phones, photos are cropped taller instead of shrunk, text sits under the photo rather than on top of it, and sideways rows snap into place.

## 2. New photography (about 14 images)
- **Orders, from making to growing:** home chef cooking, baker decorating, caterer prepping a large order, packing meal-prep boxes, owner checking orders on a tablet, handing over a pickup, small team in a shared kitchen, pop-up stall.
- **Local, from finding to supporting:** neighborhood storefront, farmers' market, a group sharing food, someone discovering a food truck.
- **Main site:** a founder working with a designer, and a small business owner using a laptop.

## 3. Where the breaks go
- **Orders home:** a "You create it. Loumilab Orders helps you sell it." People Sequence after the benefits, a Category Transition before pricing, and an Immersive Image before the final call to action. The existing baker section stays.
- **Local home:** an Immersive Image of a market near the top, a sideways row of discovery photos (Discover, Explore, Visit, Order, Support local) between categories and listings, and the existing pickup section.
- **Local business pages and the Join page:** one welcoming human photo each.
- **Main site:** Home gets one Editorial Moment. Services gets a Category Transition between its capability groups. About and How We Work each get one Image + Statement.
- **Resources:** a header photo on the hub, and a slim photo band on topic pages. Articles themselves stay text-only so they're easy to read.
- **Unchanged:** sign-in, dashboards, admin and checkout.

## 4. Speed and checks
- Photos are compressed, sized for each screen, and load only as you scroll to them. The first screen of each page stays as fast as it is now.
- Before hand-off I'll take screenshots on phone, tablet and desktop of Orders, Local, Home and Services. I'll also check swiping, keyboard arrows, and reduced-motion settings.

All new headlines are my own drafts for you to review.

## Technical details
- New `src/components/brand/story/` with `ImmersiveImage`, `ImageStatement`, `PeopleSequence` (CSS scroll-snap plus prev/next buttons, no autoplay, aria-roledescription carousel), `CategoryTransition` and `EditorialMoment`. They reuse `.photo-frame`, `Reveal` and `Eyebrow`. `PhotoSplit` doesn't change.
- `<picture>`-free approach: imported JPGs with explicit width/height, `loading="lazy"`, `decoding="async"`, `sizes`. Mobile crops use `object-position` and aspect classes per breakpoint.
- Images go in `src/assets/people/{orders,local,studio}/`. Generated at about 1600px wide as JPG.
- Add an AGENTS.md rule: visual breaks use the shared story components.
- Frontend only. No data or routing changes.
