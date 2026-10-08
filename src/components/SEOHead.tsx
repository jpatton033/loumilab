import { useEffect } from "react";

const BASE_URL = "https://loumilab.com";
const DEFAULT_TITLE = "Loumilab | Technology Studio for Digital Products";
const DEFAULT_DESCRIPTION =
  "Loumilab designs, builds, launches, and secures digital products and technology businesses. Websites, software, AI automation, and cybersecurity.";

export interface Crumb {
  name: string;
  path: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Social title/description overrides (default to title/description). */
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article" | "product";
  /** Absolute URL or site-relative path/asset URL of the page's main image. */
  image?: string;
  imageAlt?: string;
  breadcrumbs?: Crumb[];
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** Full canonical URL override (articles). */
  canonicalUrl?: string;
}

const absolute = (u: string) =>
  /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;

const normalizePath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const SEOHead = ({
  title,
  description,
  path = "/",
  noindex = false,
  jsonLd,
  ogTitle,
  ogDescription,
  ogType = "website",
  image,
  imageAlt,
  breadcrumbs,
  publishedTime,
  modifiedTime,
  canonicalUrl,
}: SEOHeadProps) => {
  const jsonKey = JSON.stringify(jsonLd ?? null) + JSON.stringify(breadcrumbs ?? null);

  useEffect(() => {
    const url = canonicalUrl || `${BASE_URL}${normalizePath(path)}`;
    const sTitle = ogTitle || title;
    const sDesc = ogDescription || description;
    const added: Element[] = [];

    document.title = title;

    const setMeta = (attr: string, key: string, content: string | null | undefined) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!content) {
        el?.remove();
        return;
      }
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", sTitle);
    setMeta("property", "og:description", sDesc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", ogType);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", sTitle);
    setMeta("name", "twitter:description", sDesc);
    const img = image ? absolute(image) : null;
    setMeta("property", "og:image", img);
    setMeta("property", "og:image:alt", img ? imageAlt || sTitle : null);
    setMeta("name", "twitter:image", img);
    setMeta("property", "article:published_time", ogType === "article" ? publishedTime : null);
    setMeta("property", "article:modified_time", ogType === "article" ? modifiedTime : null);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    if (noindex) canonical.remove();
    else canonical.setAttribute("href", url);

    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    } else robots?.remove();

    // JSON-LD: page-provided + WebPage + BreadcrumbList
    const scriptId = "seo-jsonld-route";
    document.getElementById(scriptId)?.remove();
    const blocks: Record<string, unknown>[] = [];
    if (jsonLd) blocks.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]));
    if (!noindex) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url,
        isPartOf: { "@type": "WebSite", name: "Loumilab", url: BASE_URL },
        ...(img ? { primaryImageOfPage: img } : {}),
      });
      if (breadcrumbs?.length) {
        blocks.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${BASE_URL}${normalizePath(c.path)}`,
          })),
        });
      }
    }
    if (blocks.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = scriptId;
      script.text = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks);
      document.head.appendChild(script);
      added.push(script);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      added.forEach((el) => el.remove());
      document.querySelector('meta[name="robots"]')?.remove();
      setMeta("name", "description", DEFAULT_DESCRIPTION);
      setMeta("property", "og:image", null);
      setMeta("property", "og:image:alt", null);
      setMeta("name", "twitter:image", null);
      setMeta("property", "article:published_time", null);
      setMeta("property", "article:modified_time", null);
      setMeta("property", "og:type", "website");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, noindex, jsonKey, ogTitle, ogDescription, ogType, image, imageAlt, publishedTime, modifiedTime, canonicalUrl]);

  return null;
};

export default SEOHead;
