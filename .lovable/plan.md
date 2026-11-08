# Loumilab — Comprehensive Refinement (Establish. Run. Improve.)

Refine the current off-white / deep-black site. No restart, no route changes, no feature removal, logo untouched.

## Stage 1 — Font (decided)
- Satoshi, with a period in the headline color (Option B), becomes the headline font on every public page. Italic serif accents removed site-wide. The preview-only font comparison is taken out.

## Stage 2 — Homepage
Order: hero (cinematic film + moving previews) -> three pathways -> What we build (studio) -> Orders & Local -> Companies (Vurtti returns) -> Knowledge Center & The Dot. -> closing.

The three pathways, one continuous story, not cards:
- A thin "Establish / Run / Improve" progress line that stays in view while you scroll through the three chapters.
- **Establish Your Business** (off-white): a business name animating into a domain, then a matching email (e.g. "Harbor Bakery" -> harborbakery.com -> hello@harborbakery.com). Buttons to Business Email and Domains.
- **Run Your Business** (deep black): "Less Managing. More Business." with a moving sequence of new photos — bakery packing orders, retail counter, service provider, owner at pickup. Button to Orders.
- **Improve Your Business** (off-white): scattered tasks (spreadsheet, sticky note, email, invoice) drawing together into one tidy flow. Button to Workflow Optimization.

## Stage 3 — Visibility for the four main offerings
- **Menu:** Solutions panel gets a highlighted "Start here" row with Business Email, Domains and Workflow Optimization; Technology Studio and Managed Business Technology stay separate columns. Orders first in Products. Companies added (Vurtti).
- **Search:** grouped results (Solutions, Products, Companies, Knowledge Center, The Dot.) with suggestions before typing (these four first), keyboard friendly.
- **Pages:** Business Email and Domains pages cover what's included, who it's for, what we manage, setup steps, pricing/next step. Workflow Optimization gets the "scattered tasks become one process" motion at the top. Cross-links between these three and Orders.

## Stage 4 — Imagery
- Replace cropped Orders screenshots on the homepage and Orders sequences with new art-directed photos (bakery fulfillment, retail purchase, service work, owner coordinating, customer pickup). Real product screens kept only where a feature is explained, fully framed.
- New photos per page; no envelope icons, staged laptops or abstract AI art.

## Stage 5 — Shared interactions and footer
- One hover system: images scale very slightly, links get a sliding thin underline, cards lift by a hairline shadow; blue focus ring everywhere.
- Footer becomes deep black (#080808), off-white text, gray secondary text, faint dividers, same links and logo, blue only for the dot.
- Motion automatic while visible, pauses for reduced motion and hidden tabs; no scroll hijacking.

## Stage 6 — Rest of the site
Apply the type, hover system and page-specific imagery to Solutions, service pages, Products, Orders marketing pages, Local, Companies, About, Start a Project, Knowledge Center and The Dot. Dashboards and admin keep their current look.

## Note
New photos need workspace credits; earlier video generation ran out. If credits run out, I'll use existing photos and list which ones still need replacing.

## Technical details
- Satoshi via Fontshare CSS in index.html; `font-hero` token set to Satoshi; FontPreview removed; `font-serif` italic usages removed.
- New `Pathways.tsx` in src/components/brand/story; reuse RtlSequence/TimedCrossfade and useAutoMotion.
- Footer uses `--surface-inverse` at #080808 equivalent HSL.
- SiteSearch gains category groups and default suggestions; nav data in src/data/navigation.ts.
- Each stage verified at 390px and 1280px in a browser.
