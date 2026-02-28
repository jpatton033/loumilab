

## Add Information/Cybersecurity to LOUMILAB's Service Offering

Weave cybersecurity and information security into the existing business model across the site and SEO, without replacing any current services.

### 1. Services Page (`src/pages/Services.tsx`)

- Add a new service card: **"Information & Cybersecurity"** with a `Shield` icon (from lucide-react)
  - Description: "Protect your digital assets with proactive security assessments, secure architecture design, and ongoing threat monitoring."
  - Features: "Security audits", "Penetration testing", "Secure architecture", "Compliance & governance"
- Update SEO title to include cybersecurity: `"Web Design, SaaS Development, Cybersecurity & AI-Powered Builds -- LOUMILAB"`
- Update SEO description: `"Custom website design, SaaS MVP development, information security, cybersecurity consulting, and AI-assisted builds. Ship fast, scale smart, stay secure."`

### 2. Homepage (`src/pages/Index.tsx`)

- Add a 4th service preview card: `{ icon: Shield, title: "Information & Cybersecurity", desc: "Proactive security assessments and secure-by-design architecture for your digital products." }`
- Update SEO title: `"LOUMILAB -- Digital Innovation & Cybersecurity Studio | Web & SaaS Development"`
- Update SEO description to mention security: `"We build websites, SaaS products, and secure digital experiences that shine. AI-powered development and cybersecurity expertise for modern businesses."`
- Update "What we do" section heading to: `"Websites, SaaS, security, and everything in between"`

### 3. About Page (`src/pages/About.tsx`)

- Update the intro paragraph to mention security: add "...and cybersecurity solutions..." alongside websites and SaaS products
- Update SEO description to include security keywords

### 4. Global SEO -- `index.html`

- Update `<title>` and meta descriptions to include cybersecurity
- Update JSON-LD structured data:
  - Add "Cybersecurity", "Information Security", "Security Consulting" to `knowsAbout`
  - Add "Security Audits", "Cybersecurity Consulting" to `serviceType`

### 5. Footer (`src/components/Footer.tsx`)

- Update tagline from "A digital innovation studio illuminating the future of web and SaaS development" to include security: "...web, SaaS, and cybersecurity."

### Files Modified (6 total)
1. `src/pages/Services.tsx` -- new service card + updated SEO meta
2. `src/pages/Index.tsx` -- new preview card + updated SEO meta + section heading
3. `src/pages/About.tsx` -- updated copy + SEO meta
4. `index.html` -- updated title, meta, JSON-LD structured data
5. `src/components/Footer.tsx` -- updated tagline
6. `public/sitemap.xml` -- no changes needed (no new routes)

