# Spaces Phase 1 — Real hosting at company-name.loumilab.com

## What you get
Customers upload a ready-built website or app as a ZIP, click Deploy, and get a real working HTTPS address like `my-company.loumilab.com`. Spaces marks it "Live" only after it checks that the address actually loads. Rollback switches the live site back to an older version, and that change is checked too. Source-only React/Vite projects show "Build Required". They are kept safely but not published.

## Decisions already made
- Address: `<name>.loumilab.com`, as you chose. loumilab.com is already on Cloudflare, so no new domain is needed.
- Hosting: Cloudflare R2 holds the files, and a Cloudflare Worker serves `*.loumilab.com`. You approved the cost (Workers Paid is about $5/month, and R2 costs about $0.015/GB).
- The same address rule also covers Orders storefronts and Local listings. Those names go to the main site until their own switch is turned on.

## Safety trade-off with loumilab.com
The brief asked for a separate domain because customer apps would share loumilab.com. To reduce the risk:
- Logins are stored in each browser's own storage, not in loumilab.com cookies, so hosted apps can't read them.
- The Worker removes any incoming `Cookie` header. It also adds strict security headers (CSP, no framing of Loumilab, nosniff).
- Reserved names (www, admin, app, api, mail, spaces, orders and others) can never be claimed.
- Any future loumilab.com cookie must stay host-only, never `.loumilab.com`. This rule will be recorded.
You can move to a separate domain later without rebuilding.

## Steps
1. **Connect Cloudflare.** You'll see a connect card. Create an API token with these permissions: Workers Scripts Edit, Workers R2 Storage Edit, Zone DNS Edit, Workers Routes Edit and Cache Purge, all for loumilab.com.
2. **Set up the edge (I do this after you confirm each change):**
   - Create the private R2 bucket `loumilab-spaces-sites`.
   - Upload the Worker, which can only read that bucket.
   - Add the wildcard DNS record `*` (proxied) and the route `*.loumilab.com/*`.
   - Cloudflare issues the certificates. Existing records (root, www, Zoho mail) stay untouched.
3. **Serving rules in the Worker:**
   - Hostname → app name → active version, read from a small routing record in R2. Each app has its own folder, and versions never change once written.
   - Correct file types, so `index.html` isn't cached and hashed files are cached for a long time.
   - App pages fall back to `index.html` for in-app links. Missing JS, CSS, image or font files still return a real 404.
   - Query strings are kept. Private apps return 404 at the edge for now; signed access comes later.
4. **Deploy flow in the backend:** check the user's permissions and the ZIP (existing checks), create the version, then copy the compiled files to R2 under that version.
   - Status moves through Uploaded → Validating → Ready to Deploy → Deploying → Live / Failed / Build Required / Configuration Required. Every status comes from saved backend state.
   - Live is set only after the site address returns the expected version marker.
5. **Rollback:** switch the routing record, clear the cache for that address, and confirm the old version marker loads.
6. **Dashboard (layout unchanged):** the app detail view shows status, the confirmed address, active version, last deploy, type and any errors. Buttons: Open Application, Deploy New Version, History, Roll Back, Download Export. Deploy shows real progress.
7. **Passport/export:** confirmed deployment details are kept apart from what the user typed in. Exports are still labeled honestly when only compiled files exist.
8. **Abuse limits:** a limit on deploys per user per hour, plus the existing size and file-count caps.
9. **Tests and checks:**
   - A deploy test: a sample static app and a sample SPA go live at real addresses, and a direct visit to `/dashboard/settings` loads.
   - Rollback is checked against the live address.
   - A source ZIP stays in Build Required.
   - The old `/spaces/a/:slug` preview keeps working while this rolls out.

## Not in Phase 1
Running builds (Phase 2), backend services and environment variables (Phase 3), and custom customer domains.

## Technical details
- New `_shared/spacesEdge.ts` (R2 S3-compatible signed PUTs through the Cloudflare gateway) and `cloudflare/spaces-worker.js`, kept in the repo and uploaded through the API.
- Migration: `spaces_versions` gets the new statuses plus `deployed_at`, `verified_at`, `edge_prefix` and `deploy_error`. `spaces_apps` gets `live_version_id`, `hosting_status` and `verified_url`. Existing rows are backfilled and nothing is deleted.
- `SUBDOMAINS_LIVE` changes per product: Spaces turns on, while Orders and Local stay off until their Worker rule sends traffic to the main site.
