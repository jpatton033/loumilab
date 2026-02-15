
## SEO Optimization for LOUMILAB Website

Since this is a single-page React app (SPA), search engines can struggle to index it properly. Here's a comprehensive plan to maximize your visibility.

### 1. Add Page-Level Meta Tags (Title + Description)

Create a reusable `SEOHead` component that sets the page title and meta description dynamically for each route using `document.title` and meta tag manipulation. Each page will get unique, keyword-rich metadata:

| Page | Title | Description |
|------|-------|-------------|
| Home | LOUMILAB -- Digital Innovation Studio, Web & SaaS Development | We build websites, SaaS products, and digital experiences that shine. AI-powered development for 10x faster delivery. |
| Services | Web Design, SaaS Development & AI-Powered Builds -- LOUMILAB | Custom website design, SaaS MVP development, product strategy, and AI-assisted builds. Ship fast, scale smart. |
| How We Work | Our Process -- From Idea to Launch -- LOUMILAB | Discovery, design, build, launch, and scale. Learn how LOUMILAB delivers digital products with speed and precision. |
| Products | Our Products -- FormFlow, MetricPulse, ShipKit -- LOUMILAB | Explore LOUMILAB's product suite: AI form builder, SaaS analytics dashboard, and rapid launch boilerplate. |
| Work | Case Studies & Portfolio -- LOUMILAB | See how we've helped startups and brands ship faster. Real projects, real results. |
| About | About LOUMILAB -- A Senior Product-Driven Digital Studio | A small, senior team building pristine digital products. Website design, SaaS development, and product strategy. |
| Contact | Contact LOUMILAB -- Start Your Project Today | Get in touch to discuss your next website, SaaS product, or digital project. Fast quotes, transparent process. |

### 2. Add Semantic HTML and Structured Data

- Add JSON-LD structured data (Organization schema) to `index.html` so Google understands what LOUMILAB is (name, URL, description, logo, contact info)
- Add JSON-LD LocalBusiness or ProfessionalService schema for richer search results

### 3. Add a Sitemap

Create a `public/sitemap.xml` listing all public pages with their URLs so search engines can discover and crawl every page.

### 4. Update robots.txt

Add a reference to the sitemap in the existing `robots.txt` file.

### 5. Update index.html Open Graph & Twitter Tags

Replace the generic Lovable placeholder OG image URL and description with LOUMILAB-specific content so links shared on social media look professional and branded.

### 6. Add Canonical URLs

The `SEOHead` component will also set a `<link rel="canonical">` tag for each page to prevent duplicate content issues.

### Technical Details

**New file: `src/components/SEOHead.tsx`**
- A React component using `useEffect` to set `document.title`, meta description, canonical URL, and OG tags dynamically
- Props: `title`, `description`, `path`

**Modified files:**
- `src/pages/Index.tsx` -- add `<SEOHead>` with homepage metadata
- `src/pages/Services.tsx` -- add `<SEOHead>` with services metadata
- `src/pages/HowWeWork.tsx` -- add `<SEOHead>` with process metadata
- `src/pages/Products.tsx` -- add `<SEOHead>` with products metadata
- `src/pages/Work.tsx` -- add `<SEOHead>` with portfolio metadata
- `src/pages/About.tsx` -- add `<SEOHead>` with about metadata
- `src/pages/Contact.tsx` -- add `<SEOHead>` with contact metadata
- `index.html` -- update OG/Twitter meta tags, add JSON-LD structured data
- `public/robots.txt` -- add sitemap reference
- **New file:** `public/sitemap.xml` -- list all public page URLs
