# Spaces: Phase 2 builds first, then Phase 3 backend connections

Spaces can host finished (already compiled) apps today, but it can't turn source code into a working site yet. Phase 3's "rebuild with new settings" needs that, so Phase 2 comes first.

## Part A — Phase 2: real builds (first)
- **Build machines on Fly.io.** Each build runs on its own short-lived machine with no access to other customers or to Loumilab systems. The machine is deleted when the build finishes.
- **Flow:** upload source ZIP → Spaces checks it → queued → install packages → compile (React/Vite only) → scan output for leaked secrets → publish to the app's web address through the existing hosting.
- **Limits:** time limit, memory/disk caps, network allowed only for the package registry, and a cap on builds per day per account.
- **Build logs** shown live in the dashboard, with secret values hidden.
- **Off by default** behind an admin switch until you approve.

**What you need to provide:** a Fly.io account with a card on file, an access token (I'll show a secure box for it), and a monthly spending cap. Rough cost: a few cents per build; at low volume, likely under $10/month. I'll confirm current Fly pricing before turning anything on.

## Part B — Phase 3: backend connections
1. **Dependency report** on every import (no AI used): Supabase database/sign-in/functions/migrations, Stripe, other APIs. Each item shows the evidence, what it needs, and whether it's detected, needs setup, needs manual migration, verified, or not verified.
2. **Connect Supabase:** customer enters project URL and public key only. Spaces checks the URL and key work. Service-role keys are refused.
3. **Settings (environment variables):** public values (clearly warned as visible to anyone) and private build values, stored encrypted, masked, never returned to the browser, kept out of logs and exports, with a change history. No "runtime secrets", because static hosting can't run private server code.
4. **Rebuild** from the saved source with the new settings. Each version records which settings it was built with, so rollback works too.
5. **Sign-in setup guide** using the app's real address (site URL, redirect, password reset, Google callback).
6. **Stripe:** detected and explained. Secret keys are never accepted as public values. Payments are marked "External setup required."
7. **Application → Configuration** tab with four areas: Overview, Settings, Backend connections and Readiness checklist. Status shown separately for website, backend, sign-in and payments. Nothing says "Fully operational" unless it was actually checked.
8. **Passport** adds detected/verified backend info, never secret values.
9. **Legal:** draft Terms/Privacy/agreement changes for your approval. Nothing gets published automatically.

## Testing
- Automated tests cover detection, secret blocking, and keeping customers out of each other's settings.
- A real build, deploy and rollback test, once Fly.io is connected.
- You have no test Supabase project, so the real Supabase connection, sign-in and database tests (brief tests A, D, E) will be marked **not verified** until one exists.

## Technical notes
- New tables: spaces_build_jobs, spaces_app_env (AES-GCM encrypted values, key in backend secrets), spaces_backend_connections, spaces_dependency_reports, spaces_config_audit. All locked down by RLS through spaces_can_manage_app, with values written only through spaces-api.
- Detection rules go in _shared/spacesDeps.ts, with tests.
- The build worker is a Fly Machines API call from spaces-api. It gets a one-time signed download URL for the source and a single upload token. Results go through the existing spacesEdge.ts.
- The agreement check also applies to build and settings actions.
