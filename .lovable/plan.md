# Loumilab Super Admin Dashboard

A dedicated, unified admin workspace at `/admin/*` that replaces the current single-page contact inbox — a persistent sidebar shell, an overview command centre, and every existing tool folded in as a module. Built to grow: new modules drop into one nav config.

## What it looks like

```text
+----------------------+---------------------------------------------+
| LOUMILAB.  Admin     |  Overview                         [refresh] |
|                      |---------------------------------------------|
| Overview             |  [Inquiries] [New] [Articles] [Subscribers] |
| Inquiries        (3) |  [Views]     [Hero slides]                  |
| Knowledge Center     |                                             |
| Hero Showcase        |  Recent inquiries        Recent articles     |
| Orders        (soon) |  ...                     ...                 |
| Newsletter           |                                             |
|----------------------|  Quick actions: New article / New hero slide |
| account@... Sign out |                                             |
+----------------------+---------------------------------------------+
```

Light premium theme, hairline borders, rounded-3xl cards, soft shadows — consistent with the marketing site but without the public navbar/footer. Collapses to a slide-over drawer on mobile.

## Modules

1. **Overview** — metric tiles (total inquiries, new this week, published articles, drafts, newsletter subscribers, total article views, active hero slides), recent-inquiry and recent-article lists, and quick-action buttons.
2. **Inquiries** — the current contact submissions table and detail/status panel, moved into the shell unchanged in behaviour, with filters and a copy-email action.
3. **Knowledge Center** — existing article/section management and editor, re-hosted in the shell.
4. **Hero Showcase** — existing hero product CMS, re-hosted in the shell.
5. **Orders (scaffold)** — read-only panels rendered from the existing mock data files (`src/data/orders/*`): merchant/storefront list, order queue snapshot, plan tiers. Clearly labelled "Preview — mock data", structured so swapping in real tables later touches only the data hook.
6. **Newsletter** — subscriber list with signup source and date, search, and CSV export.

## Technical notes

- New `src/components/admin/AdminShell.tsx` (sidebar + topbar + content slot) and `src/components/admin/adminNav.ts` (single source of nav items, icons, badge counts). New pages under `src/pages/admin/`: `Overview.tsx`, `Inquiries.tsx`, `Orders.tsx`, `Newsletter.tsx`.
- `src/pages/Admin.tsx` becomes a thin redirect to `/admin/overview`; its inbox logic moves to `Inquiries.tsx`. `KnowledgeCenter.tsx`, `ArticleEditor.tsx`, `HeroShowcase.tsx` swap `Layout` for `AdminShell` — their logic is untouched.
- Routes added under the existing `ProtectedRoute`: `/admin/overview`, `/admin/inquiries`, `/admin/orders`, `/admin/newsletter` (hero and knowledge routes stay as-is).
- Data via TanStack Query in `src/lib/admin/queries.ts`: count queries against `contact_submissions`, `kc_articles`, `kc_sections`, `newsletter_subscribers`, `hero_products`. All are admin-only under existing RLS — no schema or policy changes needed. Orders panels read local mock data.
- Reuse `MetricCard` pattern from `src/components/orders/MetricCard.tsx` for the overview tiles.
- Admin pages carry `noindex` via `SEOHead`.

## Out of scope for now

User/role management, editable site settings, and an audit log — the shell reserves nav space so they can be added without restructuring.
