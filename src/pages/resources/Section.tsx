import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ArticleCard from "@/components/kc/ArticleCard";
import SectionIcon from "@/components/kc/SectionIcon";
import NewsletterSignup from "@/components/kc/NewsletterSignup";
import { usePublishedArticles, useSection } from "@/lib/kc/queries";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

const PAGE_SIZE = 9;

const ResourcesSection = () => {
  const { section: sectionSlug } = useParams<{ section: string }>();
  const { data: section, isLoading: sectionLoading } = useSection(sectionSlug);
  const [sort, setSort] = useState<"published_at" | "view_count">("published_at");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: articles = [], isLoading } = usePublishedArticles({ sectionSlug, orderBy: sort });

  const tags = useMemo(() => {
    const map = new Map<string, string>();
    articles.forEach((a) =>
      (a.kc_article_tags ?? []).forEach((t) => {
        if (t.kc_tags) map.set(t.kc_tags.slug, t.kc_tags.name);
      })
    );
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesQuery =
        !q || a.title.toLowerCase().includes(q) || (a.summary ?? "").toLowerCase().includes(q);
      const matchesTag =
        !activeTag || (a.kc_article_tags ?? []).some((t) => t.kc_tags?.slug === activeTag);
      return matchesQuery && matchesTag;
    });
  }, [articles, query, activeTag]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  const title = section ? `${section.title} | Loumilab Knowledge Center` : "Knowledge Center | Loumilab";
  const description =
    section?.description ??
    "Practical guides on business growth, commerce, technology, web, and security from the Loumilab team.";

  if (!sectionLoading && !section) {
    return (
      <Layout>
        <SEOHead title="Topic not found | Loumilab" description={description} path="/resources" noindex />
        <section className="section-padding pt-32">
          <div className="section-container text-center">
            <h1 className="text-3xl font-semibold">Topic not found</h1>
            <Button asChild className="mt-8">
              <Link to="/resources">Back to Knowledge Center</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        path={`/resources/${sectionSlug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: `https://loumilab.com/resources/${sectionSlug}`,
        }}
      />

      <section className="border-b border-border bg-surface-subtle">
        <div className="section-container py-16 lg:py-24">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} /> Knowledge Center
          </Link>
          <Reveal className="mt-8 max-w-3xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <SectionIcon name={section?.icon} size={22} />
            </span>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight lg:text-5xl">
              {section?.title ?? "Loading…"}
            </h1>
            {section?.description && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{section.description}</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search this topic…"
                aria-label="Search this topic"
                className="h-11 rounded-2xl pl-11"
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort</span>
              <button
                type="button"
                onClick={() => setSort("published_at")}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  sort === "published_at" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSort("view_count")}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  sort === "view_count" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Most read
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  !activeTag ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                All
              </button>
              {tags.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => {
                    setActiveTag(activeTag === t.slug ? null : t.slug);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    activeTag === t.slug ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl border border-border bg-secondary" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center">
              <h2 className="font-display text-lg font-semibold">Nothing here yet</h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                New pieces for this topic are on the way. Tell us what you need and we'll help directly.
              </p>
              <Button asChild className="mt-6">
                <Link to="/contact">
                  Get in touch <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((a, i) => (
                  <Reveal key={a.id} delay={i * 50} className="h-full">
                    <ArticleCard article={a} />
                  </Reveal>
                ))}
              </div>
              {visible.length < filtered.length && (
                <div className="mt-10 text-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="mt-16">
            <NewsletterSignup source={`resources-${sectionSlug}`} compact />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResourcesSection;
