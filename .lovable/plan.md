# Customer-first subdomain addresses

Every published customer site moves from `loumilab.com/<product>/.../<name>` to `<name>.loumilab.com`.

| Product | Today | New |
|---|---|---|
| Orders storefronts | loumilab.com/orders/store/name | name.loumilab.com |
| Spaces apps | loumilab.com/spaces/a/name | name.loumilab.com |
| Local listings | loumilab.com/orders/local/name | name.loumilab.com (only when the business has no storefront; otherwise the storefront wins) |

## What changes
1. **One shared address rule** used everywhere an address is built or shown.
2. **Names are unique across products**, so a store and a Space can't both claim `bakery`. Reserved names blocked: www, app, admin, api, mail, spaces, orders, local, help, status, and other Loumilab words.
3. **Opening a subdomain** shows that customer's site on its own (no Loumilab header/footer for stores and Spaces; Local keeps its listing layout).
4. **Old links keep working**: the old paths forward to the new subdomain.
5. **Every input and display updated**: store setup step (name preview), "Storefront created" message, store panel, custom-project form placeholder, Spaces "Address" field and app header, "Open app" button, Local listings, share/QR links, customer emails and receipts, SEO canonical links, sitemap.
6. **Spaces safety kept**: customer code still runs in the sealed frame; subdomains also give each app its own browser origin.

## Required outside setup (blocker)
Subdomains only work once `*.loumilab.com` (wildcard) points at the published site. Lovable hosting connects domains one at a time and I can't confirm it accepts a wildcard. Options:
- Connect the wildcard if your domain settings allow it, or
- Put the domain behind Cloudflare with a wildcard record forwarding to the published site.
Until that's live, the new addresses are shown but the old paths keep serving, so nothing breaks.

## Technical details
- `src/lib/siteAddress.ts`: `customerUrl(slug)`, `RESERVED_SLUGS`, `slugFromHost(host)`; unit tests for reserved names and host parsing.
- `App.tsx`: host check before routing; on `<slug>.loumilab.com` resolve slug via a new security-definer RPC `resolve_customer_slug(slug)` returning product type, then render Storefront / SpacesRun / Local Business.
- Migration: cross-product uniqueness check trigger on merchant_storefronts.slug, spaces_apps.slug and merchant_local_profiles.slug, plus reserved-name check; report any existing collisions before enforcing.
- Old routes render a redirect to `customerUrl` only when the host is configured (flag), else serve as today.
- Update edge-function email templates and prerender/sitemap scripts to `customerUrl`.
- Record the rule in AGENTS.md.
