## Changes

### 1. Add SaaS Development as a service

Add a new top-level service card on the homepage alongside the existing four (Website Design & Dev, Technology Consulting, Cybersecurity, AI & Innovation).

**SaaS Development** — `Code` icon
- Desc: "Custom SaaS platforms and web applications — from MVP to scale, engineered for speed and security."
- Items: MVP Development, Custom SaaS Platforms, Multi-Tenant Architecture, Authentication & Billing, Admin Dashboards, API Development, Database Design, Subscription Workflows, Integrations & Webhooks, Scalable Infrastructure

Layout: keep Website Design & Development as the full-width featured card (lg:col-span-6). The remaining five (SaaS, Tech Consulting, Cybersecurity, AI & Innovation, plus one re-balanced) sit beneath. Update grid to `lg:grid-cols-6` with the 5 secondary cards spanning `lg:col-span-2` each on a flexible row — they wrap naturally (3 on row 2, 2 on row 3, or 2/2/1 depending on breakpoint).

Also mirror the addition on `/services` (Services.tsx) so the page stays in sync — insert SaaS Development as the second card, right after Website Design & Development.

### 2. Slow, cinematic intro — "Designed by Loumilab"

Rework `src/components/IntroAnimation.tsx` to feel slower, more deliberate, and clearly showcase the "Designed by Loumilab" wordmark.

**Timing** (total ~5.5s, up from 3.3s):
- 0.0s – Black screen with ambient gradient fades in
- 0.4s – Logo mark scales + fades in (1.4s ease-out)
- 1.6s – Thin accent rule draws horizontally beneath the logo (0.9s)
- 2.0s – "DESIGNED BY" small caps fades up (0.8s)
- 2.6s – "Loumilab" wordmark fades up + shimmer sweep across it (1.6s, slower shimmer)
- 4.6s – Hold (0.6s) so the user can read it
- 5.2s – Whole overlay fades to transparent (0.8s)
- 5.5s – Overlay unmounts, body scroll restored

**Visual upgrades:**
- Larger wordmark on the intro (`text-5xl md:text-7xl`), tighter tracking
- Replace the fast light-sweep with a slow shimmer that travels across the "Loumilab" wordmark only (4s cycle, runs once)
- Particles drift slower (8–12s duration vs 4–9s)
- Logo + tagline grouped tighter with a subtle drawn underline accent
- Overlay fade-out uses 800ms easing instead of 700ms for a softer exit

**Mechanics:**
- Keep `sessionStorage` gate so it shows once per session
- Bump `setTimeout` values to match new timing (fadeOut at 5200ms, unmount at 6000ms)
- Add new tailwind keyframes if needed (`intro-rule-draw`, slower `intro-shimmer-slow`) in `tailwind.config.ts`
- Respect `prefers-reduced-motion`: if set, skip particles + shimmer and shorten to ~2s static display

### 3. Files touched

- `src/pages/Index.tsx` — add SaaS service entry, adjust grid spans
- `src/pages/Services.tsx` — add SaaS card
- `src/components/IntroAnimation.tsx` — new timing, larger wordmark, prefers-reduced-motion branch
- `tailwind.config.ts` — add/adjust intro keyframes for slower shimmer and rule draw

No backend, routing, or design-token changes. Visual identity (dark theme, Space Grotesk, near-black surfaces) preserved.
