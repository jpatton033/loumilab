## Goal
Remove Lovable build references and rebrand homepage content toward Loumilab / AI.

## Changes

### 1. Homepage content (`src/pages/Index.tsx`)
- Line 14: Change service description from `Lovable-powered development for 10x faster delivery.` to `AI-powered development for 10x faster delivery.`

### 2. Structured data (`index.html`)
- Line 31: Update JSON-LD `url` from `https://loumilab.lovable.app` to `https://loumilab.com`

### 3. Build tooling (`vite.config.ts`)
- Remove `lovable-tagger` import and the `componentTagger()` plugin from the Vite config. This removes the dev-only `data-lovable-id` attributes and the Lovable build reference entirely.

## Outcome
Zero Lovable branding remains in the codebase (content, metadata, or build config).