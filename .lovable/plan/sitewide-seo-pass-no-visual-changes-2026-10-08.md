# Sitewide SEO pass (no visual changes)

Visitors won't see any change. Everything happens in page titles, search descriptions, sharing previews and other details that search engines read. Already in place and kept: the sitemap that rebuilds itself (it already adds new articles and live stores), robots.txt, Search Console verification, and the Organization details.

## What changes

1. **A unique title and description on every page.** These use your suggested titles for Home, Services, Products, Work, About, Contact and Resources. Orders, Get started, Tools, the calculator, Local, Local Join, Local business pages, storefronts and legal pages get their own too. Descriptions are 140–160 characters, and I'll write them in plain Loumilab language.
2. **Sharing previews per page.** Each page gets its own sharing title and description, the right page type (website, article or product), and a sharing image that is the main photo already on that page. X/Twitter cards come with it.
3. **Article SEO fields in the Resources editor:** SEO title, meta description, focus topic, canonical link, sharing title, sharing description, sharing image, and an "Hide from search" switch. If a field is left blank, it falls back to the article title, summary and cover photo. Anything you type always wins. Articles also get published and updated dates, author and publisher, and breadcrumbs.
4. **One main heading per page.** Section, Article, Custom build, Local business, receipts and quote/invoice pages currently have two. I'll fix the tags without changing how they look.
5. **Page structure tags.** I'll check that header, nav, main, footer, article and aside are used correctly, with no visual effect.
6. **Structured data:** a WebSite entry for the whole site; WebPage and breadcrumbs on major pages; Service entries on Services; SoftwareApplication on Orders and Local; Article entries on articles. Nothing fake: no ratings, and prices only where they are shown on the page.
7. **Canonical links.** Every public page will point to its own loumilab.com address. Blank or not-found pages won't point to the homepage. A trailing slash will be handled the same way everywhere.
8. **Natural internal links,** a few per page. Articles link to Services. Services links to Work and Resources. Orders and Local link to each other and back to Products.
9. **Images:** clear alt text, set width and height to stop the page jumping while it loads, lazy-loading below the fold, and the top photo loaded first. Decorative images get empty alt text.
10. **Speed:** an unused font (Inter) is loaded on every page, and I'll remove it. I'll also check for oversized photos and heavy code loaded up front, and load admin and dashboard code only when it's needed.
11. **Audit:** check for duplicate or missing titles, broken internal links, stray "noindex" tags, and sitemap entries that point to private or duplicate pages. I'll also run a fresh SEO scan and fix anything it finds.

No addresses change, so no redirects are needed. If the audit finds a link that has to move, I'll add a permanent redirect.

## Limitation

This site loads in the browser, so Google sees each page's title and description. Facebook, LinkedIn and Slack previews only read the homepage's details, so per-page previews will mostly help on Google and X. Getting full per-page previews would mean moving to Lovable's newer template, which renders pages on the server first. I can do that separately if you want.

These changes reach loumilab.com the next time you publish.

## Technical details

- Extend `SEOHead`: `ogType`, `image`, `imageAlt`, `breadcrumbs`, `publishedTime`/`modifiedTime`. Write og:image, twitter:image, og:type, article:* tags, and restore defaults on unmount. Merge WebPage + BreadcrumbList into the JSON-LD array.
- `index.html`: add WebSite JSON-LD, drop the Inter font, and add Local to `owns`.
- Migration: add nullable columns to `kc_articles`: `canonical_url`, `focus_keyword`, `og_title`, `og_description`, `og_image_url`, `noindex boolean default false`. Admin ArticleEditor gets an "SEO" panel. The sitemap script skips noindex articles.
- Heading fixes: change secondary `<h1>` tags to `<h2>`/`<p>` with the same classes.
- Images: shared story/tile/PhotoSplit components get `width`/`height`/`loading`/`decoding`, and the hero gets `fetchpriority="high"`.
- Lazy-load routes in `App.tsx` for admin and the dashboard, if they aren't already.
- Afterward: rescan with seo_chat, check the generated sitemap, and use a Playwright check to grab each page's title, description, canonical and number of H1s.
