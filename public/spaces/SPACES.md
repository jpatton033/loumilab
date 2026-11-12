# SPACES.md — Spaces App Specification v1.0

A Spaces package is a folder (or ZIP) with:

- `index.html` and the rest of your **built** app (for example the contents of `dist/`).
- `spaces.json` — a manifest that follows `spaces.schema.json`.
- `SPACES.md` (optional) — notes for the next person who maintains the app.

## Supported apps (v1)
Static sites and compiled frontend apps (React, Vue, Svelte, Astro, plain HTML). Apps may call external APIs; list them under `dependencies.external`.
Not supported: server code (Node, Python, PHP), databases, containers or background workers.

## Build rules
1. Use relative asset paths. Vite: `base: "./"`. Create React App: `"homepage": "."`.
2. Use hash routing for single-page apps (`#/about`).
3. Don't include secrets. Anything in the package is visible to people who can open the app.

## Limits
50 MB ZIP, 150 MB unpacked, 3,000 files, 25 MB per file.

## Portability
Every export contains `app/`, `spaces.json`, `passport.json` and a README, and runs on any static host.
