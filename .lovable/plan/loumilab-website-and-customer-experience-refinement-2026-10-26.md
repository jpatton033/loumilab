# Loumilab website and customer experience refinement

This is a refinement, not a rebuild. It continues the page-flow work already started (the Orders comparison pages) and replaces the open "move every page to the new layout" task with the fuller brief below. Prices, product features, business rules, the logo, logins, payments, tracking and existing web addresses stay exactly as they are.

## Phase 1: Audit (first, reported back before larger changes)
- Walk every public page at phone, tablet and desktop sizes. Note unclear wording, competing buttons, dead ends, repeated content, weak links between pages, and article readability.
- Technical check: page titles, descriptions, one main heading per page, sitemap coverage, broken links, image sizes, contrast, keyboard use and labels.
- Short written findings list, ranked by impact. Anything in the "needs approval" list below waits for your go-ahead.

## Phase 2: Structure and homepage
- Present Loumilab as three connected areas: **Technology Studio** (websites, software, AI automation, security), **Loumilab Products** (Orders, Local, Business Tools, Vurtti), and **Managed Business Technology** (business email, domains, setup and support).
- Homepage, in order: headline and one "Start a Project" button; a "What do you need?" row with five clear paths (build a website or software, take orders online, set up business email, AI or security, free tools and resources); Orders and Local; studio capabilities; Vurtti; Resources and The Dot.; closing button. Fewer sections than today, not more.
- Menu: keep the current items and the Services and Products dropdowns. Group Services into the Studio and Managed Business Technology sections (Business Email stays there). No items removed or renamed.

## Phase 3: Every page on the same flow
Each page gets the same order: headline with one main button, a real image, three short benefits, details (who it's for, how it works, pricing explained, questions), then a closing button that repeats the main button.
- Pages: Services, Business Email, Products, Orders, Orders Pricing, Local, Business Tools, Work, About, How We Work, Resources, The Dot., Contact.
- Main buttons: studio pages "Start a Project"; Orders "Build Your Free Store" (store preview before sign-up stays); Local "List your business"; Business Email "Get started".
- Short "related" links between pages that fit together (Orders and Local, Orders and Business Email, Resources and Services), kept light on editorial pages.
- Business Email copy says clearly that Loumilab sets up and supports Google, Microsoft or Zoho, and does not run its own email.

## Phase 4: Trust, resources and polish
- Add short "how we work" steps and questions-and-answers where missing. No made-up reviews, numbers, clients or partnerships. I'll list where real proof (client quotes, photos, results) would help.
- Resources and The Dot.: easier to find from the homepage and Services, better article spacing and text, one quiet newsletter signup per page. The Dot. keeps its own look.
- Consistent buttons, cards and spacing; the blue dot used in at most three quiet moments per page.
- Fix technical issues the audit finds: missing titles or descriptions, sitemap gaps, oversized images, contrast and labels.

## Needs your approval before I do it
- New photography beyond the current photo library.
- Any menu change beyond the grouping above.
- Any change to prices, plans, product features or sign-up steps.

## Checks
- Screenshots at phone, tablet and desktop for each changed page.
- Contact form, Orders store builder, Local sign-up, newsletter signup and Business Email order flow still work.
- Tracking still fires on page changes and sign-ups; every existing web address still opens.

## Technical details
- Reuse `src/components/brand/flow` (FlowHero, BenefitTrio, ClosingCta), story, Tiles and PhotoSplit; add a small `PathPicker` for the homepage paths in the flow folder.
- Navbar data: Services dropdown gets two labelled groups; Products dropdown continues to read `src/data/products.ts`.
- SEO stays in SEOHead; new or changed metadata mirrored in `scripts/prerender-heads.ts` and `generate-sitemap`.
- Front end only. No database, function, pricing source, tracking or auth changes. Update roadmap.md to replace the open site-wide layout task.
