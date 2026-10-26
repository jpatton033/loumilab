# Loumilab comprehensive website redesign

A redesign of the public pages only. This brief replaces the earlier refinement plan, and the "What do you need?" row and grouped Services menu added last round will be absorbed into the new structure. Logins, Orders store building, payments, Local listings, the newsletter, tracking, prices, promotions and published content are not touched.

## Decisions from the brief that change earlier rules
- **Selective dark sections are back**, in charcoal or near-black, used for a featured product band and closing calls to action (about 15–25% of a page). The saved "no dark surfaces" rule will be updated to match. Glass effects stay banned.
- **New top menu:** Logo | Solutions | Products | Resources | About | Start a Project (blue button).
  - Services, Work, How We Work, The Dot. and Contact leave the top bar. They move into dropdowns and the footer, and every existing web address keeps working.

## Phase 1: Audit and foundation
- Walk every public page at phone, tablet and desktop sizes. Write a short findings list.
- Design basics: hero headlines about 52–68px on desktop, body text 16–18px, content width about 1200–1280px, and one set of section spacing, button, card and form styles. Add dark section styles.
- New menu:
  - **Solutions:** Technology Studio (Website Development, Custom Software, AI & Automation, Cybersecurity) and Managed Business Technology (Business Email Setup & Management, Domain Setup & Management).
  - **Products:** Orders, Local, Business Tools, Vurtti.
  - **Resources:** Resources / Knowledge Center, Free Business Tools, The Dot.
  - Phone menu uses the same groups as fold-out sections.
- Footer gets the same groups, plus Work, How We Work, Contact, Terms and Privacy.

## Phase 2: Homepage
1. Hero: "We build what's next." with the brief's supporting line. Buttons: Explore Solutions (main) and Start a Project.
2. Three pathways in columns: Technology Studio, Loumilab Products, Managed Business Technology, each with its own button.
3. Dark product band: Orders ("Less managing. More business." and "Transparent. First and Always.", Build Your Store / See How It Works) and Local (Explore Local / List Your Business), shown with real screenshots of the products.
4. Studio services: four editorial blocks that link to the new service pages.
5. Managed Business Technology: email and domain setup with established providers.
6. Resources: three published articles, Business Tools and The Dot.
7. Dark closing band: "Have something in mind? Let's build it." with a Start a Project button.

## Phase 3: Services and products
- **Four new service pages:** `/services/website-development`, `/services/custom-software`, `/services/ai-automation` and `/services/cybersecurity`. Each has a hero, what we deliver, example problems and solutions, process, capabilities, questions, and a Start a Project button. `/services` stays as the overview.
- **Domain Setup & Management:** a new page at `/services/domains`, built on the existing Business Email service and its prices. It starts at the domain step of the same order form. There is no new pricing and no domain registration of our own.
- **Business Email page:** a clearer split between provider costs and Loumilab fees, and the support plans. The content is the same.
- **Orders pages:** Build Your Store (main) and See How It Works. Real screenshots, the industry examples, prices and promotions exactly as they are, and building a store before sign-up kept up front.
- **Local:** a separate section for people looking for businesses (Explore Local Businesses) and for owners (List Your Business).
- **Start a Project form:** service choice and optional budget, if the current form doesn't already have them. It uses the existing form and email process.

## Phase 4: Supporting pages
- Resources and The Dot.: better article spacing and paragraphs, topic navigation, related articles, no public view counts. The Dot. keeps its own look and existing signup.
- About: studio plus products, plain language, no unsupported claims.
- Contact: three clear paths (project, product question, general), using the existing form.

## Phase 5: Checks
- Screenshots at 390px, 768px and 1280px for every changed page. No sideways scrolling.
- Contact form, store builder, Local sign-up, newsletter signup and Business Email order still work.
- Tracking fires once per page change, with no duplicate events. Every old web address still opens. Titles, descriptions, sitemap and headings are correct.

## Needs your approval
- Product screenshots: I'll capture them from the live store builder and Local. Real customer stores appear only with your OK; otherwise I use a demo store.
- Any new photography beyond the current photo library.

## Technical details
- Marketing-only components live in `src/components/brand/*`. Dashboard, admin and checkout code is untouched. Shared buttons keep their current variants, and only new variants are added.
- Dark tokens (`--surface-inverse`, `--inverse-foreground`) go in `src/index.css` and `tailwind.config.ts`, used through a `tone="dark"` prop on the flow blocks.
- Navbar and Footer read a single `src/data/navigation.ts`.
- New routes go in `App.tsx`. Each one gets an entry in SEOHead, `scripts/prerender-heads.ts` and `generate-sitemap`. The service page content lives in `src/data/services.ts`.
- Update the Visual Identity memory and Core rule about dark surfaces. Update roadmap.md and AGENTS.md (navigation data rule).
- Front end only: no database, functions, pricing source, tracking or auth changes.
