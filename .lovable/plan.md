# Domain search across the site

One search (the existing Cloudflare-backed one) shown five ways. No new backend; no purchases; Orders untouched.

## Business Email page
- Rework the current "Find your domain" block into a full-width deep-black section: "Your business deserves its own domain." with soft-gray supporting line, placeholder "Search your business domain...", button "Search Domains".
- Oversized headline, search directly beneath, no card wrapper; results shown on dark surfaces.
- Kept between "What we handle" and Pricing, with straight, clean transitions (no rounded overlaps) and the existing gentle reveal on scroll.

## Homepage
- Compact editorial row inside the "04 Managed Business Technology" section (same background, no new dark panel): "Your next idea starts with a name." + "Find a domain for your business, brand, or next big idea." + inline search.
- Results open inline under the field (first 5, "See all" expands). "Request Domain Setup" leads to the Business Domain service request.
- Hero and Start a Project stay first.

## Business Domain page (/services/domains)
- Search placed directly under the hero: "Find the right domain. We'll handle the rest." / "Search available domains and explore professional registration, setup, and management with Loumilab." / placeholder "Search a domain or business name...".
- Fullest version: extension, prices, Premium tag, suggestions vs. live-checked, side-by-side easy comparison, and "Request Domain Setup" carrying the domain into the existing request form with the "does not reserve or buy" note.

## Spaces public page
- No new section: refine an existing chapter's copy into "Your app. Your domain." + one sentence + three short benefits (Your identity / Easy to share / More control), horizontal on desktop, stacked on mobile.
- Buttons "Find a Domain" (opens a small search sheet in place) and "Connect an Existing Domain" (goes to sign-in, then the app's Domains tab). Redundant copy in that chapter is trimmed so page length stays about the same.

## Spaces dashboard (app → Domains)
- Heading "Connect a domain to your application." + "Find a new domain or connect one you already own."; same two options as today, app stays selected; existing DNS steps and status kept.

## Shared design
- The one search component gets three looks — dark, editorial (compact), full — plus focus/hover polish, loading state, subtle result fade, reduced-motion respected, keyboard accessible.

## Checks
- Real searches on each of the five places, desktop and phone; selected domain arrives in the request form; Spaces page length compared before/after; screenshots for the report, including Business Email before/after.

## Technical details
- `DomainSearch` gains `variant: "dark" | "editorial" | "full"`, `placeholder`, `cta`, `limit` props; all variants call the same `domain-search` function. Tokens only (atmo/ink/inverse), no hard-coded colors.
- ServiceDetail renders the search for slug `domains` via an optional `search` field in services.ts.
- Spaces "Connect an Existing Domain" deep-links `/spaces/app?next=domains`.
