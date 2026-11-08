# Loumilab — Comprehensive Refinement (Establish. Run. Improve.)

Refine the current off-white / deep-black site. No restart, no route changes, no feature removal, logo untouched.

## Stage 1 — Review choices (you approve before anything goes live)
- A temporary preview section on the homepage (visible only in the preview link) showing "We build what's next" in three typefaces: **Geist**, **Satoshi**, **General Sans** (Neue Montreal is a paid font, so a close free match is used). Each shown with and without a period; the period matches the headline color. The blue dot is removed from the headline either way.
- You pick one font and one period option; that font then becomes the headline font on every public page. All italic serif accents are removed site-wide.

## Stage 2 — Homepage
Order: hero (unchanged cinematic film + moving previews) -> three pathways -> What we build (studio) -> Orders & Local -> Companies (Vurtti returns) -> Knowledge Center & The Dot. -> closing.

The three pathways, one continuous story, not cards:
- A thin "Establish / Run / Improve" progress line that stays in view while you scroll through the three chapters.
- **Establish Your Business** (off-white): a business name animating into a domain, then into a matching email address (e.g. "Harbor Bakery" -> harborbakery.com -> hello@harborbakery.com). Buttons to Business Email and Domains.
- **Run Your Business** (deep black): "Less Managing. More Business." with a moving sequence of new photos — bakery packing orders, retail counter, service provider, owner at pickup. Button to Orders.
- **Improve Your Business** (off-white): scattered tasks (spreadsheet, sticky note, email, invoice) drawing together into one tidy flow. Button to Workflow Optimization.

## Stage 3 — Visibility for the four main offerings
- **Menu:** Solutions panel gets a highlighted "Start here" row with Business Email, Domains and Workflow Optimization; Technology Studio and Managed Business Technology stay as separate columns. Orders stays first in Products. Companies added (Vurtti).
- **Search:** grouped results (Solutions, Products, Companies, Knowledge Center, The Dot.) with suggestions shown before typing (these four first), keyboard friendly.
- **Pages:** Business Email and Domains pages refined to cover what's included, who it's for, what we manage, the setup steps, pricing/next step. Workflow Optimization gets the "scattered tasks become one process" motion at the top. Cross-links between these three and Orders.

## Stage 4 — Imagery
- Remove the cropped Orders screenshots from the homepage and Orders sequences; replace with new art-directed photos (bakery fulfillment, retail purchase, service work, owner coordinating, customer pickup). Real product screens kept only where a feature is explained, fully framed, never cropped.
- New photos per page so galleries are not repeated; no envelope icons, staged laptops or abstract AI art.

## Stage 5 — Shared interactions and footer
- One hover system: images scale very slightly, links get a thin underline that slides in, cards lift by a hairline shadow; same focus ring (blue) everywhere.
- Footer becomes deep black (#080808), off-white text, gray secondary text, faint dividers, same links and logo, blue only for the dot.
- Motion stays automatic while visible, pauses for reduced motion and hidden tabs; no scroll snapping or hijacking.

## Stage 6 — Rest of the site
Apply the type, hover system and page-specific imagery to Solutions, service pages, Products, Orders marketing pages, Local, Companies, About, Start a Project, Knowledge Center and The Dot. Dashboards and admin keep their current usability-first look.

## Decisions I need from you
1. Font and period choice (Stage 1 preview).
2. Image generation needs workspace credits; earlier video generation ran out. New photos may need a top-up.

## Technical details
- Fonts self-hosted via @fontsource (Geist) / Fontshare CSS (Satoshi, General Sans); `font-hero` token swapped after choice; `font-serif` italic usages removed.
- New `Pathways.tsx` in src/components/brand/story; reuse RtlSequence/TimedCrossfade; motion via existing useAutoMotion.
- Footer uses `--surface-inverse` set to #080808 equivalent HSL.
- SiteSearch gains category groups and a default suggestions list; nav data in src/data/navigation.ts.
- Each stage verified at 390px and 1280px in a browser.
