# The Dot. — A Loumilab Brief

A recurring editorial publication inside Loumilab: a dedicated landing page, a web-readable issue archive, simple signup with topic chips, placement across the site, an engagement prompt for Resources readers, and an admin issue editor.

Decisions confirmed: dedicated page at `loumilab.com/the-dot`; Issue 001 written by us; topic preferences shown as chips after subscribing.

## Design identity

- Reuse the light premium brand system (Space Grotesk UI, Urbanist hero type, blue accent used sparingly) — no new components or themes.
- Hierarchy everywhere: **The Dot.** / *A Loumilab Brief* / Ideas, technology, and what's next.
- Editorial personality: large issue numbers, month labels ("ISSUE 001 — OCTOBER 2026"), generous whitespace, one restrained visual moment per page using the existing Blue Dot motion components (DotMarker, DotThread) — never punctuation-style dots, never a blue-heavy page.
- All colors/styles through existing semantic tokens; no hardcoded colors.

## Data (one migration)

1. `newsletter_subscribers` gains: `status` (default `subscribed`), `interests text[]` (default empty), `unsubscribe_token uuid` (unique, default `gen_random_uuid()`), `unsubscribed_at`, `updated_at`. Existing rows keep working; no auto-enrollment of existing users.
2. New `dot_issues` table: `issue_number` (unique), `slug` (unique), `title`, `subtitle`, `issue_month` label, `editors_note`, main story title + body, `short_stories jsonb`, `resource_links jsonb`, `product_update`, `closing_thought`, `cover_image_url`, `status` (draft/published), `published_at`, timestamps.
   - GRANTs + RLS: published issues readable by anyone; full management via the existing admin role check. Service role full access.
3. RPC changes (security definer, rate-limited like today):
   - `newsletter_subscribe` now reports whether the address was new or already subscribed, so the UI can show "You're already on The Dot."
   - `newsletter_set_interests(email, interests)` — validated against the five topics.
   - `newsletter_unsubscribe(token)` — unsubscribe by secret token (safe public link).

## Public pages

- `/the-dot` (new `src/pages/thedot/Index.tsx`): masthead with the three-line hierarchy, the latest published issue featured in editorial typography, the archive list (issue number, date, title), the description quote, and the signup block.
- `/the-dot/issue/:slug` (new `src/pages/thedot/Issue.tsx`): a clean web reader — issue header, editor's note, main story, short stories, links to Resources articles, optional product update, closing thought. Attractive even for people who never got the email. Drafts stay noindex (admin preview only).
- New `TheDotSignup` component (`src/components/thedot/`): email-only form, CTA "Join The Dot. →", supporting copy ("Stay connected to what's next. … Twice a month. No noise. Just useful ideas."), success state ("You're on The Dot. / Look for the next brief in your inbox."), then optional topic chips (Business & Growth, Technology & AI, Web & Digital, Security & Privacy, Orders & Commerce). Duplicate emails get the "already subscribed" message. Every placement passes a `source` (home, resources, article-slug, footer, the-dot, engagement-prompt) so origins are tracked.

## Integration across the site

- Homepage: understated The Dot. section after the Resources section — label, one line, email field, CTA. Source `home`.
- Resources hub: the current generic signup block becomes a more prominent The Dot. block (latest issue number + link to `/the-dot`). Source `resources`.
- Articles: the end-of-article signup becomes "Like what you just read? There's more in The Dot." with the short description, email field, and CTA. Source `article-<slug>`.
- Footer: "The Dot. — A Loumilab Brief" link in the Connect column. Source `footer`.
- Navigation: nothing added to the main nav.

## Engagement prompt

- New `EngagementPrompt` component used on Resources article pages: after the reader reaches roughly 60–70% of the article, show one tasteful card — "Before you go." / The Dot. / A Loumilab Brief / description / email + "Join The Dot. →" / "Twice a month. Unsubscribe anytime." Source `engagement-prompt`.
- Dismissal is remembered per browser (localStorage); once dismissed it stays away. No entry popups.

## Admin

- New "The Dot." page in the admin Content group (`/admin/the-dot`): issue list (draft/published, numbers, dates) and an issue editor with all fields from the brief, cover image upload (reusing the existing media upload helper), draft/published toggle, per-issue slug.
- Admin Newsletter page extended: interests, status, and source columns; CSV export updated; an admin unsubscribe action.

## SEO

- `SEOHead` title: "The Dot. | A Loumilab Brief" with the description quote; issue pages get their own titles via dynamic prerender heads.
- Add `/the-dot` to `scripts/prerender-heads.ts` staticMeta and published issues to its dynamic reads; add both to `scripts/generate-sitemap.ts`.

## Email delivery (important)

Lovable's email system only sends one-recipient, event-triggered emails — it cannot send a recurring issue to a subscriber list. So The Dot. ships now as a web publication with subscriber data (statuses, tokens, sources) fully provider-ready; when actual twice-a-month delivery is wanted, we connect a dedicated marketing email provider without redesigning anything. The web archive reads independently from day one.

## Files

New: `src/pages/thedot/Index.tsx`, `src/pages/thedot/Issue.tsx`, `src/components/thedot/TheDotSignup.tsx`, `src/components/thedot/EngagementPrompt.tsx`, `src/lib/thedot/queries.ts`, `src/pages/admin/TheDot.tsx`, `src/pages/admin/TheDotEditor.tsx`.
Edited: `App.tsx` (routes), `adminNav.ts`, `src/pages/Index.tsx`, `src/pages/resources/Index.tsx`, `src/pages/resources/Article.tsx`, `src/components/Footer.tsx`, `src/lib/kc/queries.ts`, `src/lib/admin/queries.ts`, `src/pages/admin/Newsletter.tsx`, `src/index.css` (editorial type utilities only), `scripts/prerender-heads.ts`, `scripts/generate-sitemap.ts`. The old generic `NewsletterSignup` component is retired once both its uses are replaced.

## Verification

Submit a test subscription (new + duplicate) through the article placement, save interests, confirm the subscriber row and interests in the database, publish Issue 001 and read it at `/the-dot` and its issue page, check homepage / resources / article / footer placements with sources, exercise the engagement prompt on an article, verify the unsubscribe token flow, check mobile layout and reduced motion, and confirm the build passes.
