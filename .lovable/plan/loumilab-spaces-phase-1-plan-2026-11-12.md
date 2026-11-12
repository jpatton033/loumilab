# Loumilab Spaces — Phase 1 plan

Built inside this project at `/spaces`. The existing Loumilab pages stay as they are, apart from one new "Spaces" link in the Products menu and the footer.

## 1. Important safety decision: how customer apps load
You asked for customer apps to load from the Loumilab domain, the way Orders stores do. Orders stores are pages Loumilab builds. Spaces apps are code that customers upload. If that code ran directly on loumilab.com, a harmful app could read visitors' Loumilab sign-ins and act as them.

To keep the Loumilab address and stay safe:
- Each app gets a Loumilab link: `loumilab.com/spaces/a/<app-name>`.
- That page shows the app inside a locked-down frame. The app's files come from a separate file host, so they can never reach Loumilab accounts.
- Private apps check access on every file request, not only when the first page opens.
- A real separate domain can be added later without rebuilding.

## 2. Public website (`/spaces`)
- A cinematic hero, "The home for software built anywhere.", with the five-scene loop (create, become independent, converge, deploy, continue). It is a real looping browser animation with no fake video, plus a still image for people who turn off motion.
- All 14 brief sections in order, in the Loumilab Deep Contrast style: dark and light sections, Satoshi headlines, motion that plays as you scroll.
- Pages: Specification docs, a Starter Kit download (real ZIP), Pricing (shown as "Free during beta"), plus search listings and a sitemap entry for each.

## 3. Dashboard (`/spaces/app`, sign-in required)
- **Workspaces & members:** owner, admin, developer and viewer roles; invite by email; switch between workspaces.
- **Apps:** create, rename, archive or delete (with confirmation), set visibility (private, workspace or link).
- **Deploy:** upload a built static site as a ZIP → checks (finds the `index.html` start page, checks file types and size limits, reads `spaces.json` if present) → publish → live link. Keeps a version history so you can roll back.
- **Passport:** a permanent record for each app (ID, owner, how it was built, versions, deploy log, dependencies). You can view and export it as JSON.
- **Portable Export:** download a ZIP with the built files, source (if uploaded), `spaces.json`, the Passport and a README. The same ZIP can be imported back in.
- **Specification:** `spaces.json`, `spaces.schema.json` and `SPACES.md`, published at public links. The same checker runs during deploy.
- **Library:** an organized private list with search, tags, folders, favorites and an app detail view. It respects permissions, so nobody sees apps they cannot access. This is not a marketplace.
- **Operations:** status, latest deploy, storage used, and an activity log.

## 4. Not in Phase 1
- Server code (Node, Python, databases, containers)
- Custom domains for apps
- Paid billing
- A marketplace
- Phase 3 and 4 features

## Technical details
- New tables (all with `spaces_` prefix): workspaces, members, invites, apps, versions, passport_events, library_tags/folders/favorites, audit. Each has GRANTs and row-level security through a security-definer `spaces_role(workspace, uid)` check.
- Storage: one private `spaces-artifacts` bucket for uploads, versions and exports.
- Edge functions:
  - `spaces-deploy`: unzips, checks and publishes a version.
  - `spaces-serve`: serves files from the function's own address. It checks access with a short-lived signed token for private apps, sets `nosniff`, a strict CSP and no cookies, and is safe for the frame's sandbox.
  - `spaces-export` / `spaces-import`.
  - `spaces-invite`.
- Frame: `<iframe sandbox="allow-scripts allow-forms allow-popups">` with no `allow-same-origin`.
- A shared validator in `src/lib/spaces/manifest.ts`, used by both the site and the server, with tests for the manifest and permission rules.
- Uploads are capped at 50 MB per deploy to start. The cap can be raised.
- AGENTS.md rule: uploaded customer code never runs on the loumilab.com origin.
