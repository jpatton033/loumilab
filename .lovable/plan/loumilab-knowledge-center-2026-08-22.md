# Loumilab Knowledge Center

A full, database-backed knowledge center at `/resources`, modeled on Vurtti's but tuned for Loumilab's audience (small businesses, commerce, AI, security) and built in the current light premium design system.

## Public experience

Routes:
- `/resources` — hub: hero, six section cards with published counts, search, latest articles, most-read strip, newsletter capture.
- `/resources/:section` — section listing: description, keyword search + tag filters, sorting (newest / most read), pagination.
- `/resources/:section/:slug` — article: title, summary, author, published date, read time, tags, body, table of contents on desktop, attachments/downloads, related articles, newsletter block, share links.

Launch sections:
1. Business Growth — selling online, social commerce, acquisition, pricing, repeat customers
2. Orders & Commerce — order management, payments, storefronts, pickup workflows, menus (ties into Loumilab Orders)
3. Technology & AI — automation, AI for small business, choosing software, digital operations
4. Web & Digital — websites, SEO, conversion, e-commerce, digital presence
5. Security & Privacy — payment security, customer data, account security, small-business cybersecurity
6. Templates & Tools — downloadable/editable resources

For Templates & Tools, each entry supports an attached file plus an optional "open in document app" link field, so items can point at the Loumilab document application once it exists — no dead buttons in the meantime.

## Admin CMS

Extends the existing protected admin area (`/admin`) with a Knowledge Center area:
- Articles list with status filter (draft / published / archived), search, quick publish/unpublish.
- Article editor: title, auto slug, section, summary, body (markdown), hero image, tags, author, SEO title/description, featured flag, attachments, publish date.
- Section manager: title, slug, description, icon, sort order, visibility.
- Tag manager.
- Media/attachment uploads into a storage bucket.
- Preview a draft before publishing.

## Improvements over the Vurtti version

- Search and tag filtering on the hub, not just section browsing.
- "Most read" powered by view counts, with a de-duplicated view counter so refreshes don't inflate numbers.
- Cross-links from articles to the relevant Loumilab service or Orders page.
- Newsletter capture stored in the backend with duplicate protection and rate limiting.
- Reading-time estimates and a sticky table of contents on long articles.
- Sitemap includes every published article and section automatically.

## Technical notes

Database (new tables, all with RLS + explicit grants):
- `kc_sections`, `kc_tags`, `kc_articles`, `kc_article_tags`, `kc_attachments`, `kc_article_views`, `newsletter_subscribers`.
- Public read policies limited to published rows only (`anon` + `authenticated` SELECT); all writes restricted to `has_role(auth.uid(), 'admin')`.
- Security-definer RPCs: `kc_increment_view(article_id)` for anonymous view counting, and section published-count aggregation.
- Newsletter inserts go through a rate-limited path reusing the existing `check_and_increment_rate_limit` function.
- Public storage bucket for hero images and template files; admin-only write policies.

Frontend:
- New pages under `src/pages/resources/`, routes added to `src/App.tsx`, data hooks in `src/lib/kc/`.
- Markdown rendering with a sanitizing renderer (no raw HTML injection).
- Article and collection JSON-LD via the existing `SEOHead` component; canonical URLs per route.
- "Resources" added to the navbar and footer; the existing `/insights` route redirects to `/resources`.
- Reuses existing tokens, `Reveal`, `Eyebrow`, and rounded-3xl card patterns — no new visual language.

Seeding: each section ships with one or two starter articles so the hub is not empty on launch; you can edit or replace them in the admin.
