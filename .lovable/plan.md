# Loumilab Daily Operations Brief

An automated executive brief generated server-side and emailed to the Super Admin every morning at 8:00 AM America/New_York (DST-aware), plus an in-app Reports and Settings area, manual generation, immediate critical alerts, and a delivery log.

## Important scope note before we build

The brief must never invent numbers. Today the database holds merchants, Stripe Connect accounts, plans and fee-change history, audit logs, Stripe webhook events, contact submissions, custom project leads, knowledge-center articles and views, hero slides, newsletter subscribers, and rate-limit events.

It does **not** yet hold customer orders, payments, GMV, refunds, disputes, subscriptions, payouts, or website analytics — customer checkout and plan subscriptions are still unbuilt, and no analytics/APM integration exists. So sections 9–18, 21, 23, 28 have no authoritative source yet.

The plan therefore builds the **full modular framework with every section defined**, and each section renders one of three states:

- **Live** — computed from real data.
- **Not yet available** — the capability isn't built (e.g. "Orders transactions — not yet live").
- **Not monitored** — no health/telemetry signal exists (uptime, APM, deployments).

Nothing is fabricated, and when checkout, subscriptions, refunds, payouts, and analytics land, each module flips to Live by filling in one collector — no restructuring.

## What lands on day one as Live data

- Executive summary: new merchants, new leads, new contact submissions, new subscribers, knowledge views, action-item count, each with day-over-day and 7-day-average comparison.
- Action Required: Stripe webhook failures, merchants stuck in verification / payout-restricted, uncontacted custom project leads, unread contact inquiries aging past a threshold, financial-configuration changes, failed brief deliveries.
- What Changed: merchant, plan/fee, content, hero, and admin-action movements with direction arrows.
- Merchants: totals, new, plan breakdown, payout-status breakdown, verification issues.
- Payments & Payouts: Connect mode (live/test), account counts by payout status, webhook success/failure counts, most recent event — the panel already on the admin overview, in email form.
- Leads & Opportunities: new custom project requests and contact submissions with business, type, budget range, date, status, and a deep link.
- Knowledge Center: published/updated articles, views, most-read.
- Pricing & Policy Changes: every `orders_plan_fee_changes` row and plan pricing edit, showing previous value, new value, effective date, and who changed it.
- Admin Activity & Audit Summary: significant `audit_logs` actions, counted and grouped, with a link to the full log.
- Security: rate-limit trips, admin role changes, permission changes, failed-login signals from auth logs.
- Watch Today: 2–5 items derived from real trends and open items only.
- System Health: Database and Orders payments show real signals (a probe query, Connect/webhook state); Website, Email, Scheduled Jobs show real signals from delivery and cron state; Analytics/APM/Deployments show Not Monitored.

## Email design

Loumilab branding, reusing the charcoal-header / light-footer card shell already used by the contact emails: 600px centered card, wordmark with blue accent period, hairline borders, generous spacing, web-safe font stack, single-column and mobile-safe metric tiles (2-up on phones, 3-up on desktop). Severity dots 🔴🟠🟡🟢, direction arrows ↑↓→. Empty sections collapse into a single line ("No refunds, disputes, payout failures, or critical system issues were recorded."). Deep links point at `/admin/...` routes and require normal authentication — no action tokens in email. No card, bank, token, key, or unnecessary PII data ever enters the email.

## Subject line

`Loumilab Daily Brief — August 25, 2026`, or `⚠ Action Required — Loumilab Daily Brief — August 25, 2026` only when at least one Critical or Important item exists.

## Super Admin surfaces

New nav group **Reports**:

- `/admin/reports/daily-brief` — history list: date, subject, delivery status, recipients, critical count, summary; View renders the stored snapshot; Resend re-delivers it. Snapshots are stored so historical reports never re-compute against current data.
- `/admin/settings/daily-brief` — enable/disable, delivery time, timezone, recipients (multiple, validated), reporting window (previous 24h / previous calendar day / custom), per-section toggles for all 18 sections, per-product module toggles (Website, Consulting, Knowledge, Orders, and room for future products), alert thresholds (payment-failure %, refund %, dispute count, traffic/order/revenue decline %, payout failures, webhook failures), and immediate-alert category toggles.
- Buttons: **Generate Daily Brief Now** and **Send Test Email**.

Vurtti data is never pulled in. At most a future opt-in high-level "Vurtti — Operational" line; nothing by default.

## Immediate critical alerts

A separate lightweight checker runs every 15 minutes and emails immediately (respecting a per-category cooldown so one incident doesn't spam) for: Stripe webhook failure bursts, repeated payout failures, database probe failure, security incidents, and configurable categories. These events are also summarized in the next morning's brief.

## Technical notes

- **Delivery**: reuse the existing Maileroo sender path (`MAILEROO_API_KEY`) that already powers contact emails, so no new email-domain provisioning is required. Sender identity stays on the current Loumilab sending domain.
- **Schedule**: pg_cron job runs hourly and the function itself checks whether the configured local delivery time has arrived in `America/New_York` (`now() AT TIME ZONE`), which handles DST without cron edits. A single-flight lease row plus a unique `(report_date, recipient)` key makes double-runs impossible.
- **New tables** (all with GRANTs and staff-only RLS via `is_staff`/`is_finance_admin`): `ops_brief_settings` (single row config incl. sections, thresholds, modules, recipients), `ops_brief_reports` (report_date, window, subject, snapshot jsonb, critical/important counts, summary text), `ops_brief_deliveries` (report_id, recipient, status: generated/queued/sent/failed/retrying, attempts, error, timestamps), `ops_alerts` (category, severity, detected_at, payload, notified_at, resolved_at) and `ops_job_runs` (job, started_at, finished_at, status, error) so Scheduled Jobs health is a real signal.
- **Edge functions**: `ops-brief-generate` (collect → snapshot → render → enqueue), `ops-brief-send` (delivery with bounded retry/backoff, marks failures), `ops-alerts-check` (immediate alerts). All read config from the DB, use the service role, and record `ops_job_runs`.
- **Collector architecture**: `supabase/functions/_shared/ops-brief/collectors/*.ts` — one collector per module (`website`, `orders`, `merchants`, `revenue`, `payments`, `payouts`, `refunds`, `disputes`, `subscriptions`, `leads`, `knowledge`, `seo`, `security`, `system`, `development`, `admin`, `audit`, `anomalies`). Each exports `{ key, title, enabledByDefault, collect(ctx) }` and returns either data or `{ status: "unavailable" | "not_monitored", note }`. The renderer walks the enabled list — adding a future product module is one file plus a toggle.
- **Comparisons and anomalies**: every metric is collected as `{ current, previousDay, sevenDayAvg, previousWeek, monthToDate }` where the source supports it; anomaly flags fire only when the deviation exceeds the configured threshold **and** the baseline sample is large enough, so quiet-day noise doesn't produce alarms.
- **Money**: all financial values are computed server-side in integer cents from database rows; nothing is estimated client-side. When ledger sources don't exist yet, the section reports unavailable rather than approximating.
- **Renderer**: shared `renderBrief(snapshot)` producing table-based responsive HTML plus a plain-text alternative, in `_shared/ops-brief/render.ts`.
- **Summary prose**: generated deterministically from the snapshot (template sentences over real figures). Optionally upgraded later to a Lovable AI pass over the same snapshot, never allowed to introduce numbers not present in it.
