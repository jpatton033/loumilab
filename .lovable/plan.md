# Spaces — Deployment Infrastructure Preparation

Two parts: (A) real changes to Spaces now, with no outside services; (B) a written blueprint for hosting and builds, covering every item in the brief, for your approval before any outside account, DNS change or routing change.

Everything that exists today stays: Library, Passport, versions, rollback, export/import, sign-in and workspaces. No simulated builds or invented results.

## Part A — Build now

### 1. Upload classification
Every uploaded ZIP is inspected, nothing is run, and it gets exactly one type:
- **Static app**: built output with an HTML entry and no build step needed. This is the only type that can go live today.
- **Build required (React/Vite)**: a project with package.json that uses vite/react, a vite config or src/main.*, and no built output. It shows "Build Required" with a plain explanation that it will be compiled once the build service exists.
- **Source archive**: kept for preservation only.
- **Needs outside services**: server code, a database URL, or an "external" dependency. It shows which services are missing.
- **Unsupported runtime**: Next.js server, PHP, Python, Ruby, Docker and similar. Stored only if you choose that, never run.

A ZIP that contains both source and a built dist/ is treated as a static app, and the source is kept alongside it.

### 2. Keeping files vs going live
- Source files are no longer rejected just because they can't be hosted. Each upload is stored in up to four separate places: source, build inputs, compiled files and the portable export.
- Executables, .env files and .git folders are still blocked from going live. In stored source, .env files are removed and listed in a notice to you, and node_modules is dropped.
- Each version shows "Compiled files: yes/no".

### 3. Clear version statuses
Versions show one of these labels: Received → Inspecting → Ready to publish / Build required / Preserved only / Needs outside services / Unsupported / Failed → Live (current) / Superseded.
A version shows as live only when compiled files exist and are stored. Old "ready" versions keep working and are labelled as static.

### 4. Import screen
The upload screen shows the detected type, why it was chosen, what will happen next, and a choice between "Preserve only" and "Publish". Publish is available only for static apps.

### 5. Safer uploads
The upload limits are enforced while files are unpacked (total size, file count, compression ratio of 100:1 or less, and nesting depth), so a "ZIP bomb" can't fill memory. Unsafe file paths, links to other files and duplicate names are refused.

### 6. Tests
Classification and safety checks are tested with sample projects: plain static, Vite source, Vite with dist, Next server, PHP, an .env leak, a path-escape attempt and a ZIP bomb.

## Part B — Blueprint document (saved to Files)
A copy-ready report covering the brief's deliverables 1–10:
- **Hosting**: Cloudflare Workers + R2 on a separate, newly registered app domain (for example `*.loumi.app`). It covers hostname routing, HTTPS, single-page app fallback, versions that never change once published, instant rollback by moving a pointer, cache clearing and keeping customers separated. Loumilab sign-in cookies never reach customer apps.
- **Builds**: AWS ECS Fargate and Fly.io Machines compared side by side. The blueprint defines the job queue, signed short-lived job tokens, CPU/memory/time limits (for example 2 vCPU, 4 GB, 10 minutes), internet access limited to the npm registry only, no access to cloud metadata, lockfile-only installs (`npm ci` / `--frozen-lockfile`), install scripts off by default, log redaction, where finished files go, cleanup, retries and failure reasons.
- **Security review** of all 10 topics in the brief.
- **Costs** for Cloudflare, AWS and Fly.io at stated workloads (for example 50, 500 and 5,000 builds a month), with fixed and minimum charges, storage, requests, data transfer, logs and day-to-day running effort. All figures are estimates, sourced and dated.
- **Accounts and credentials needed**, milestones, end-to-end acceptance tests and the approval list.

## Needs your approval later (not done in this plan)
- Registering the customer app domain and turning on its DNS.
- Creating Cloudflare, AWS or Fly.io accounts and adding their keys.
- Moving live app serving off the current setup.
- Turning on real builds.

## Technical details
- `_shared/spacesSpec.ts`: add `classifyArchive()` (parses package.json and vite/next configs), `ArchiveKind`, status enum and streaming limit checks. It stays the single source of rules.
- `spaces-api` deploy: stream unzip through fflate with running byte, count and ratio caps; write source/compiled files under separate storage prefixes (`source/`, `compiled/`); record `kind`, `has_compiled`, `classification`.
- Migration on `spaces_versions`: add `kind`, `has_compiled`, `source_path` and the expanded status check; backfill existing rows to kind=static.
- UI: Dashboard upload dialog and version list badges. Export includes source when present.
- Update the AGENTS.md Spaces rule for classification and the four storage areas.
