# Loumilab Local Importer: controlled listing acquisition

An admin-only pipeline for adding accurate, unclaimed food-business listings to Loumilab Local. It starts with Baltimore City and Baltimore County. Nothing is published without an admin's approval. Local stays free, and the public pages stay the same apart from the new "Unclaimed" treatment.

This brief is large, so it will be built in three passes. Each pass works on its own before the next one starts.

## Pass 1: Staging, review and publishing (no crawler needed)
- New admin section **Local Importer** in the admin sidebar, under Orders. It has these screens: Overview, Add Businesses, Review Queue, Published Listings, Claims & Requests, Settings.
- **Add Businesses:**
  - Manual entry form.
  - CSV upload with a downloadable template, column mapping, row-by-row errors, a 250-row cap, duplicate and suppression flags, and a preview before anything is saved.
  - Pasted URLs are saved as candidates, with a note that automatic extraction needs setup.
- **Review Queue:** proposed public fields shown next to their source and date. Missing or conflicting values are highlighted, and a listing preview is shown. Actions are Approve & Publish, Save Draft, Reject, Link/Merge, and Suppress. Bulk publishing only works on records you select, and every selected record must pass checks.
- **Duplicate checks** use website domain + branch, normalized phone, and name + city. A shared website or phone alone never merges two branches. Probable matches need an admin decision.
- **Public unclaimed listings:**
  - Initials or a category icon instead of photos.
  - An "Unclaimed" badge, the required notice, and the date information was last checked.
  - Links: "Claim it for free", "Suggest an update", "Request removal".
  - Never an "Order Online" button.
  - Location shows city/state or a reviewed service area only.
- **Claims:** the business owner signs in with their existing account and submits a short claim. You review it manually. Approval gives them edit access to that listing only. "Set Up Online Ordering" reuses the same business record.
- **Corrections and removals:** forms with sending limits feed a private queue. An approved removal hides the listing right away and blocks it from being imported again.
- **Markets and categories:** Baltimore City and Baltimore County are seeded, and you can add more Maryland markets.
- Clearly labelled sample records are used for testing. They are never shown in public search.

## Pass 2: Website extraction (needs Firecrawl)
- **Sources registry:** each domain is pending, approved, blocked or paused, with permitted fields, notes, the reviewer and the date. Yelp, Google Maps, DoorDash, Uber Eats, Facebook, Instagram and similar sites are blocked by default.
- **Bounded extraction:** only approved domains, at most 4 pages each (home, about, contact, hours), on the same domain. No images, reviews, menus or logos. Structured business data is read first. Every field keeps its source page, date and a short excerpt.
- **Background jobs:** work is queued with retries, up to 3 attempts, and failed jobs are kept for review. The Jobs screen shows progress and lets you retry, cancel, pause and resume.
- **Discovery:** optional search by market and category. Search results are treated as leads only and must be reviewed before anything else happens.

## Pass 3: Cost controls and freshness
- **Default limits:** 25 domains per batch, 4 pages per domain, 3 seconds between requests to the same site, and 100 page fetches per day. You see the maximum page count before a job starts.
- **Kill switch:** work pauses automatically when the daily limit is reached and needs an explicit resume. A global kill switch stops all new work.
- **No repeats or top-ups:** the same site is not re-crawled within 7 days unless you override it. There are no automatic credit purchases.
- **Freshness:** a 90-day freshness review exists but is off until you turn it on. Re-checks only propose changes. They never overwrite fields a merchant has claimed.
- **Retention:** short source excerpts are kept 90 days and raw provider output 7 days. You can change both.

## Out of scope (V1)
Reviews, ratings, nationwide crawling, automated outreach, image scraping and automatic publishing.

## Technical details
- **Reuse:** `merchant_local_profiles` stays the canonical public listing. Add `ownership_status` (unclaimed/claimed), `publication_status`, `source_kind`, `last_checked_at`, and a nullable `merchant_id`, because unclaimed listings have no owner yet. This is a non-destructive migration, and existing rows count as claimed and published.
- **New staff-only tables (RLS via has_role/is_staff, GRANTs included):** `local_markets`, `local_sources`, `local_import_batches`, `local_jobs` (state, attempts, lease_until, idempotency_key), `local_candidates`, `local_field_evidence`, `local_claims`, `local_requests` (corrections/removals), `local_suppressions`, `local_importer_settings` (limits, retention, kill switch, budget counters).
- **Database functions (security-definer):** `publish_local_candidate` re-runs the duplicate and suppression checks inside a transaction with an advisory lock. `approve_local_claim` assigns ownership server-side. `submit_local_claim` and `submit_local_request` are rate-limited, using the existing rate-limit helper.
- **Public functions:** `search_local_businesses` and `get_local_business` also return `ownership_status` and `last_checked_at`, and only return `store_slug` for claimed merchants with a published storefront. They never return evidence or notes.
- **Pass 2 functions:** edge functions `local-import-dispatch` and `local-import-worker`. Job leasing uses `FOR UPDATE SKIP LOCKED`. URL checks allow only http/https and block private IPs, localhost, metadata addresses, URLs with embedded credentials, and unsafe redirects. Responses have size and time limits. Page text is treated as untrusted data.
- **Firecrawl:** connected in Pass 2 through the connector, choosing gateway or direct mode based on the connection.
- **Exports:** CSV exports escape values that could run as spreadsheet formulas.
- **Docs:** `AGENTS.md` gains rules for the importer. Admin operating notes are added to the Knowledge Center docs page in admin.
