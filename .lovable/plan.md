## Goal
Restyle the homepage hero headline "Building Secure Digital Innovations." with a modern Apple-style typeface (Urbanist), while leaving the rest of the site untouched.

## Changes
1. **Install font**: `bun add @fontsource/urbanist` (weights 500/600/700).
2. **Import in `src/main.tsx`**: add `@fontsource/urbanist/500.css`, `/600.css`, `/700.css`.
3. **Tailwind token**: add `hero: ['Urbanist', 'system-ui', 'sans-serif']` to `fontFamily` in `tailwind.config.ts`.
4. **Apply in `src/pages/Index.tsx`**: add `font-hero` plus tighter tracking (`tracking-[-0.04em]`) and weight `font-semibold` to the hero `<h1>` only. No other headings change.

## Result
Hero headline gets a crisp, modern Apple.com-like display treatment. All other typography (section headings, body, nav) stays on Space Grotesk.
