// Runs after `vite build` (postbuild). Writes dist/<route>/index.html for every public
// indexable route with that route's own title, description, canonical, og/twitter tags
// and a screen-reader-only H1 + summary inside #root, so crawlers that read raw HTML
// never see the homepage head on inner pages. React replaces #root on load.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const BASE_URL = "https://loumilab.com";
const DIST = resolve("dist");

interface Meta { path: string; title: string; description: string; ogType?: string; image?: string | null }

const S = (path: string, title: string, description: string): Meta => ({ path, title, description });

const staticMeta: Meta[] = [
  S("/services", "Technology & Software Development Services | Loumilab", "Website and product design, SaaS and web app development, workflow automation, AI and cybersecurity consulting — delivered end to end by one senior Loumilab team."),
  S("/how-we-work", "How We Work: From Idea to Launch | Loumilab", "Discovery, design, build, security, launch and growth — how Loumilab takes digital products from first idea to a secure, maintainable launch and beyond."),
  S("/products", "Digital Products Built by Loumilab | Loumilab", "Explore the products and companies built by Loumilab: Loumilab Orders for online ordering, Loumilab Local for food discovery, and Vurtti for compliance teams."),
  S("/work", "Selected Work & Digital Products | Loumilab", "Selected websites, software platforms and digital products designed, built and secured by Loumilab — real projects, the problems they solved, and their results."),
  S("/about", "About Loumilab | Technology Studio", "Loumilab is a senior technology studio that designs, builds, launches and secures digital products for businesses — and builds its own products, like Orders."),
  S("/contact", "Contact Loumilab | Start a Technology Project", "Tell Loumilab about your website, software product, automation or cybersecurity project. Share your goals and timeline — we reply to every inquiry within 24 hours."),
  S("/resources", "Technology, Business & Security Resources | Loumilab", "Practical guides from Loumilab on websites, AI, cybersecurity, online ordering and business growth — written for owners and teams building with technology."),
  S("/orders", "Loumilab Orders | Online Ordering for Small Food Businesses", "Create a free storefront, share one link, take orders and payments, and manage everything in one dashboard. Built for home chefs, bakers, pop-ups and small sellers."),
  S("/orders/get-started", "Get Started with Loumilab Orders | Create Your Storefront", "Set up your Loumilab Orders storefront in a few guided steps: create your account, add business details and your menu, connect payments, and publish your store."),
  S("/orders/custom", "Build With Loumilab — Custom Project Intake | Loumilab Orders", "Tell Loumilab what you want built — a custom website, e-commerce store, ordering system, web application, integrations or automation — and get a tailored plan back."),
  S("/orders/tools", "Free Business Tools for Food Sellers | Loumilab Orders", "Free business tools from Loumilab Orders to help you price, plan and grow — starting with a food pricing calculator for home chefs, caterers, bakers and food trucks."),
  S("/orders/tools/food-pricing-calculator", "Free Food Pricing Calculator for Small Food Businesses | Loumilab Orders", "Price plates, trays, baked goods and meal prep with confidence. Free food cost calculator with unit conversion, packaging, buffers and profit margin. No sign-up."),
  S("/orders/local", "Loumilab Local | Discover Local Food Businesses Near You", "Discover home chefs, bakers, meal-prep cooks, caterers, food trucks and pop-ups near you on Loumilab Local. Free to browse, no account needed, order in a few taps."),
  S("/orders/local/join", "List Your Food Business Free | Loumilab Local", "Get discovered by nearby customers for free. List your home kitchen, bakery, catering business or food truck on Loumilab Local in minutes, with no payment setup needed."),
  S("/orders/terms", "Loumilab Orders Terms & Conditions | Loumilab", "The terms that apply to merchants and customers using Loumilab Orders storefronts, ordering, payments, messaging and payouts."),
  S("/orders/privacy", "Loumilab Orders Privacy Policy | Loumilab", "How Loumilab Orders collects, uses and protects merchant and customer information, including orders, payments and order messaging."),
];

function readEnv(): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  try {
    for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch { /* no .env */ }
  return env;
}

async function rest<T>(url: string, key: string, query: string, body?: unknown): Promise<T[]> {
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch { return []; }
}

const clip = (s: string | null | undefined, n = 160) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

async function dynamicMeta(): Promise<Meta[]> {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  type Art = { slug: string; title: string; excerpt?: string | null; seo_title?: string | null; seo_description?: string | null; og_image_url?: string | null; cover_image_url?: string | null; kc_sections: { slug: string } | null };
  const [sections, articles, stores, local] = await Promise.all([
    rest<{ slug: string; title: string; description?: string | null }>(url, key, "kc_sections?select=slug,title,description&is_visible=eq.true"),
    rest<Art>(url, key, "kc_articles?select=*,kc_sections(slug)&status=eq.published&noindex=eq.false&canonical_url=is.null"),
    rest<{ slug: string; name?: string | null; tagline?: string | null; description?: string | null }>(url, key, "merchant_storefronts?select=*&is_published=eq.true&status=eq.published"),
    rest<{ slug: string; display_name?: string | null; name?: string | null; tagline?: string | null; description?: string | null; city?: string | null }>(url, key, "rpc/search_local_businesses", { _q: null, _place: null, _radius_miles: 25, _category: null, _pickup: false, _delivery: false, _accepting: false, _featured_only: false, _limit: 500 }),
  ]);
  return [
    ...sections.map((s) => S(`/resources/${s.slug}`, `${s.title} Resources | Loumilab`, clip(s.description || `Loumilab guides on ${s.title.toLowerCase()} for business owners and teams.`))),
    ...articles.filter((a) => a.kc_sections?.slug).map((a) => ({
      path: `/resources/${a.kc_sections!.slug}/${encodeURIComponent(a.slug)}`,
      title: a.seo_title || `${a.title} | Loumilab`,
      description: clip(a.seo_description || a.excerpt || a.title),
      ogType: "article",
      image: a.og_image_url || a.cover_image_url || null,
    })),
    ...stores.filter((s) => s.slug).map((s) => {
      const n = s.name || "Storefront";
      return S(`/orders/store/${encodeURIComponent(s.slug)}`, `${n} — Order Online | Loumilab Orders`, clip(s.tagline || s.description || `Order online from ${n} on Loumilab Orders.`));
    }),
    ...local.filter((l) => l.slug).map((l) => {
      const n = l.display_name || l.name || "Local business";
      return S(`/orders/local/${encodeURIComponent(l.slug)}`, `${n}${l.city ? ` in ${l.city}` : ""} | Loumilab Local`, clip(l.tagline || l.description || `Discover and order from ${n} on Loumilab Local.`));
    }),
  ];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function setTag(html: string, re: RegExp, tag: string) {
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function render(template: string, m: Meta) {
  const url = `${BASE_URL}${m.path}`;
  const t = esc(m.title), d = esc(m.description);
  let h = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  h = setTag(h, /<meta\s+name="description"[^>]*>/, `<meta name="description" content="${d}" />`);
  h = setTag(h, /<link\s+rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  h = setTag(h, /<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${t}" />`);
  h = setTag(h, /<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${d}" />`);
  h = setTag(h, /<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = setTag(h, /<meta\s+property="og:type"[^>]*>/, `<meta property="og:type" content="${m.ogType ?? "website"}" />`);
  h = setTag(h, /<meta\s+name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${t}" />`);
  h = setTag(h, /<meta\s+name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${d}" />`);
  if (m.image && /^https:\/\//.test(m.image)) {
    h = setTag(h, /<meta\s+property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(m.image)}" />`);
    h = setTag(h, /<meta\s+name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(m.image)}" />`);
  }
  const shell = `<div class="sr-only"><h1>${t.replace(/\s*\|\s*Loumilab.*$/, "")}</h1><p>${d}</p><a href="/">Loumilab</a></div>`;
  return h.replace(/<div id="root"><\/div>/, `<div id="root">${shell}</div>`);
}

const templatePath = resolve(DIST, "index.html");
if (!existsSync(templatePath)) {
  console.log("prerender-heads: dist/index.html missing, skipped");
} else {
  const template = readFileSync(templatePath, "utf8");
  const all = [...staticMeta, ...(await dynamicMeta())];
  for (const m of all) {
    const out = resolve(DIST, `.${decodeURIComponent(m.path)}`, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, render(template, m));
  }
  console.log(`prerender-heads: wrote ${all.length} route heads`);
}
