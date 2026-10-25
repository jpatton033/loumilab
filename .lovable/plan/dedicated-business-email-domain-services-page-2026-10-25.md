# Dedicated Business Email & Domain Services Page

Enhance the existing page at `/services/business-email` (already established — no new route, no duplicate page, no nav changes). The Services page card already links here; it stays as is.

## Sections (in order)

1. **Breadcrumbs** — Home / Services / Business Email & Domain Setup (visible + existing JSON-LD).
2. **Hero** — "Professional Business Email. Set Up for You." with the brief's copy. Primary "Get Started" to the existing questionnaire; secondary "See pricing" (anchor). Realistic photo beside the copy.
3. **What we handle** — 8 items from the brief in a clean grid; line stressing no technical knowledge needed.
4. **Packages** — keep current $99 / $149 cards and inclusions, add-ons and quote note. Add a clear disclosure: domain and email hosting charges are extra, itemized and approved before payment.
5. **How it works** — the brief's 5 steps (replaces current 4), with no promised turnaround.
6. **Supported providers** — Google Workspace, Microsoft 365, Zoho Mail with a short "who it suits" line each; text names only, no partner/reseller claims or provider logos.
7. **Optional monthly management** — Essential $19/mo and Business $39/mo, using the saved limits (1 vs. up to 5 mailboxes) and the brief's descriptions. States: optional, separate from provider renewals, cancelling does not cancel domain/email. Purchase stays in the existing status page after setup — no new checkout.
8. **Photo break** — one human image (PhotoSplit) about owning your accounts.
9. **FAQ** — the 10 questions from the brief, answers matching current policy (seven-day correction window, no passwords collected, customer owns accounts, both purchase options).
10. **Final CTA** — "Your Business Deserves Professional Email." + Get Started.

## Photography

Two new realistic, diverse small-business photos (e.g. a shop owner at a counter checking email on a phone; two professionals of different ages reviewing a laptop in a small office). Natural light, no glow or holograms. Lazy-loaded except the hero. Generated images are realistic but not real photographs — if you have licensed photos, I'll swap them in.

## SEO

- Title: "Business Email & Domain Setup Services | Loumilab"; description from the brief.
- Service JSON-LD gains management offers and an FAQPage block.
- Update the prerender head entry; sitemap already includes the route.

## Not changed

Questionnaire, checkout, Stripe, prices, admin, status page, navigation, logo.

## Technical details

- Edit `src/pages/services/BusinessEmail.tsx`; read plan prices from `MANAGEMENT_PLANS` (shared module) instead of hardcoding.
- Reuse Eyebrow, Reveal, PhotoSplit, Accordion, Button, `.photo-frame`.
- New images in `src/assets/people/email/`.
- `scripts/prerender-heads.ts` meta update.
- Check at 390 / 768 / 1280 widths.
