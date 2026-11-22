# Loumilab Orders 2.0 — Review and Phased Plan

The brief asks for an architecture review first and development in approved phases. This plan covers the review findings, then builds **Phase 1 (Visual Builder Foundation)** only. Phases 2–4 are listed for later approval.

## What exists today (checked)

- **Storefronts:** each store has fixed fields: name, description, logo, hero image, hours, pickup/delivery settings and status. There is no saved layout, section list, theme or version history. Every store renders through one fixed template.
- **Setup flow:** you pick a business type and preview a live store before signing up, and drafts carry through sign-in. This is the existing "Live Preview" the brief wants kept.
- **Plans:** Starter ($0), Business ($19), Premium ($49), with a Custom tier. Plan feature lists still mention flat fees (3.9%, 2.9%), but **progressive monthly fee tiers are live** and decide what merchants actually pay.
- **Already built:** Stripe Connect payouts, checkout, pickup/delivery tiers, tips, order statuses, messaging (paid plans), estimates/deposits/invoices, discounts, scheduling, calendar sync, analytics, and promotions.
- **Addresses:** stores show `name.loumilab.com`, but links still use the old `/orders/store/...` paths until subdomains go live. Spaces already connects outside domains through Cloudflare. Orders has no way to connect a custom domain yet.

## Decisions to confirm (I'll assume these unless you say otherwise)

1. **Plan names:** keep Starter / Business / Premium for now. The brief's Launch / Build / Grow names are held until pricing is approved.
2. **Fees:** leave live pricing and progressive fees untouched. The brief's 5% / 2.5% / 1.5% plan fees would replace the progressive tiers, so they wait for a separate decision.
3. **Custom domains on every plan:** promised only once Phase 2 actually works. Nothing advertises it before then.

## Phase 1 — Visual Builder Foundation (this build)

**For merchants**
- A new **Website** area in the dashboard with three panels:
  - **Left:** a section library (Header, Hero, About, Products, Services, Featured, Gallery, Promo banner, Testimonials, FAQ, Contact, Hours, Footer).
  - **Center:** a live canvas with tap-to-select and drag-to-reorder.
  - **Right:** settings for colors, fonts, spacing, background, images, alignment and text.
- Desktop, tablet and mobile preview toggles; on phones, a simple step-by-step editor.
- Undo/redo, autosave of a **draft**, then **Publish**. The live site changes only when you publish, so orders in progress are never affected.
- Version history with one-click restore of an earlier published version.
- **Six distinct starter templates:** Food & Catering, Bakery & Desserts, Retail & Custom Products, Beauty & Personal Services, Home Services, Minimal Professional. Each has its own type pairing, layout rhythm and generated imagery.
- Product, cart and checkout blocks are locked components. Merchants style them but cannot break ordering.

**Existing stores**
- Stores that never open the builder look exactly as they do today. On first open, a store's current details turn into a matching layout automatically. No data is moved or deleted.

**Setup flow**
- After choosing your business type, a "Choose your starting design" step shows the six templates in the live preview. Your choice carries through sign-up like the other answers do today.

**Plan gating (light)**
- Starter gets every template plus colors, fonts, logo and showing/hiding sections. Business and Premium also get full section add/reorder and advanced type and spacing. This matches the brief and changes no billing.

## Later phases (separate approval)

- **Phase 2:** custom domains on all plans (DNS check, automatic HTTPS, status, safe removal, reassignment protection) using the Cloudflare setup Spaces already uses; multiple pages; navigation; SEO controls; domain registration through Business Domain search.
- **Phase 3:** product variants, add-ons, required/optional options, preorders, ordering windows/cutoffs, bundles. Deposits and discount codes already exist and get extended.
- **Phase 4:** customer management, inventory, deeper analytics, automation, staff permissions, plan refinements and any approved pricing change.
- **Orders page refresh** ("Your business. Your website. Your orders. One place.", "Build Your Website — Free") ships at the end of Phase 1, using real builder output and advertising only live features.

## Technical details

- **Schema (additive only):** new `storefront_designs` table (storefront_id, draft jsonb, published jsonb, schema_version, template_key, updated_at), plus an immutable `storefront_design_versions` log. RLS: owner via `merchants.owner_id = auth.uid()`; support staff through the existing support RPCs. Public reads go only through a security-definer `get_public_storefront_design(slug)` RPC that returns the published layout.
- **Layout model:** Store → Pages (one in Phase 1) → Sections → props/styles, validated with zod in `src/lib/orders/builder/schema.ts`. There is a per-section allowlist, colors limited to hex, fonts from a fixed list, image URLs only from the merchant media bucket, and text rendered as plain text (no HTML), so no scripts can run.
- **Publish:** a `publish_storefront_design` RPC validates the draft server-side, copies it to published, writes a version row and bumps the version. `restore_storefront_design(version)` handles rollback.
- **Rendering:** `src/components/orders/builder/sections/*` is shared by the editor and the public storefront. Editor-only code (drag and drop via `@dnd-kit`, panels) is lazy-loaded in a separate chunk, so public stores never download it. `Storefront.tsx` renders the published design when present and falls back to the current template.
- **Reuse:** StorefrontHeader, StoreProductCard, CartBar, CheckoutSheet, ImageUpload/ImageEditorDialog and LivePreviewPicker. Checkout pricing, fees and Stripe are untouched.
- **Tests:** schema validation (rejects scripts, unknown sections and outside image hosts), converting a legacy store to a layout, plan gating rules, and publish/restore through SQL checks.
- **Not touched:** Stripe prices, subscriptions, the fee engine, order and checkout tables.
