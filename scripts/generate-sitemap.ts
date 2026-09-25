// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Static routes plus published storefronts and published Knowledge Center articles.
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://loumilab.com";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "monthly", priority: "0.8" },
  { path: "/how-we-work", changefreq: "monthly", priority: "0.7" },
  { path: "/products", changefreq: "weekly", priority: "0.8" },
  { path: "/orders", changefreq: "weekly", priority: "0.9" },
  { path: "/orders/get-started", changefreq: "monthly", priority: "0.8" },
  { path: "/orders/custom", changefreq: "monthly", priority: "0.6" },
  { path: "/orders/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/orders/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/resources", changefreq: "weekly", priority: "0.8" },
  { path: "/work", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
];

function readEnv(): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  try {
    for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    /* no .env */
  }
  return env;
}

async function rest<T>(url: string, key: string, query: string): Promise<T[]> {
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);

async function dynamicEntries(): Promise<Entry[]> {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  const [stores, articles] = await Promise.all([
    rest<{ slug: string; updated_at?: string }>(
      url,
      key,
      "merchant_storefronts?select=slug,updated_at&is_published=eq.true&status=eq.published",
    ),
    rest<{ slug: string; updated_at?: string; kc_sections: { slug: string } | null }>(
      url,
      key,
      "kc_articles?select=slug,updated_at,kc_sections(slug)&status=eq.published",
    ),
  ]);

  return [
    ...stores.map((s) => ({
      path: `/orders/store/${encodeURIComponent(s.slug)}`,
      lastmod: day(s.updated_at),
      changefreq: "weekly",
      priority: "0.6",
    })),
    ...articles
      .filter((a) => a.kc_sections?.slug)
      .map((a) => ({
        path: `/resources/${a.kc_sections!.slug}/${encodeURIComponent(a.slug)}`,
        lastmod: day(a.updated_at),
        changefreq: "monthly",
        priority: "0.6",
      })),
  ];
}

function render(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n");
}

const entries = [...staticEntries, ...(await dynamicEntries())];
writeFileSync(resolve("public/sitemap.xml"), render(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
