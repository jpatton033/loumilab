import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionIcon from "@/components/kc/SectionIcon";
import ArticleCard from "@/components/kc/ArticleCard";
import NewsletterSignup from "@/components/kc/NewsletterSignup";
import { usePublishedArticles, useSectionCounts, useSections } from "@/lib/kc/queries";
import { ArrowRight, Search, Flame } from "lucide-react";

const TITLE = "Knowledge Center | Loumilab";
const DESCRIPTION =
  "Practical guides on business growth, orders and commerce, technology and AI, web, and security — written for owners and operators by the Loumilab team.";

const ResourcesIndex = () => {
  const [query, setQuery] = useState("");
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: counts = {} } = useSectionCounts();
  const { data: latest = [] } = usePublishedArticles({ limit: 9 });
  const { data: popular = [] } = usePublishedArticles({ limit: 4, orderBy: "view_count" });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return latest.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.summary ?? "").toLowerCase().includes(q) ||
        (a.kc_sections?.title ?? "").toLowerCase().includes(q)
    );
  }, [query, latest]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url: "https://loumilab.com/resources",
    hasPart: sections.map((s) => ({
      "@type": "CreativeWork",
      name: s.title,
      description: s.description,
      url: `https://loumilab.com/resources/${s.slug}`,
    })),
  };

  return (
    <Layout>
      <SEOHead title={TITLE} description={DESCRIPTION} path="/resources" jsonLd={jsonLd} />

      <section className="border-b border-border bg-surface-subtle">
        <div className="section-container py-20 lg:py-28">
          <Reveal className="max-w-3xl">
            <Eyebrow>Knowledge Center</Eyebrow>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight lg:text-6xl">
              Guides for building, selling, and securing a modern business.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Plain-language playbooks, checklists, and templates from the Loumilab team — covering growth, order
              operations, technology and AI, digital presence, and security.
            </p>
          </Reveal>

          <Reveal delay={80} className="mt-10 max-w-xl">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources…"
                aria-label="Search resources"
                className="h-12 rounded-2xl pl-11"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {query.trim() && (
        <section className="section-padding">
          <div className="section-container">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
            </h2>
            {results.length === 0 ? (
              <p className="mt-6 text-muted-foreground">
                Nothing matched. Try a broader term, or{" "}
                <Link to="/contact" className="text-accent hover:underline">
                  ask us directly
                </Link>
                .
              </p>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section-padding">
        <div className="section-container">
          <Reveal>
            <Eyebrow>Browse by topic</Eyebrow>
          </Reveal>
          {sectionsLoading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-3xl border border-border bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((s, i) => (
                <Reveal key={s.id} delay={i * 60}>
                  <Link
                    to={`/resources/${s.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-lift)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <SectionIcon name={s.icon} size={22} />
                    </span>
                    <h3 className="mt-6 font-display text-xl font-semibold transition-colors group-hover:text-accent">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{s.description}</p>
                    )}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      {counts[s.slug] ?? 0} article{(counts[s.slug] ?? 0) === 1 ? "" : "s"}
                      <ArrowRight size={15} className="text-accent transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {popular.some((a) => a.view_count > 0) && (
        <section className="border-y border-border bg-surface-subtle py-16 lg:py-20">
          <div className="section-container">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-accent" />
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Most read
              </h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popular
                .filter((a) => a.view_count > 0)
                .map((a, i) => (
                  <Reveal key={a.id} delay={i * 50}>
                    <Link
                      to={`/resources/${a.kc_sections?.slug ?? ""}/${a.slug}`}
                      className="group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/40"
                    >
                      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {a.kc_sections?.title}
                      </span>
                      <p className="mt-2 font-display text-sm font-semibold leading-snug group-hover:text-accent">
                        {a.title}
                      </p>
                    </Link>
                  </Reveal>
                ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding">
        <div className="section-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Eyebrow>Latest</Eyebrow>
          </div>
          {latest.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
              <h3 className="font-display text-lg font-semibold">First guides publishing shortly</h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                We're writing the first set of resources now. Tell us what you're working on and we'll point you in the
                right direction in the meantime.
              </p>
              <Button asChild className="mt-6">
                <Link to="/contact">
                  Get in touch <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((a, i) => (
                <Reveal key={a.id} delay={i * 50} className="h-full">
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-24 lg:pb-32">
        <div className="section-container">
          <Reveal>
            <NewsletterSignup source="resources-hub" />
          </Reveal>
        </div>
      </section>
    </Layout>
  );
};

export default ResourcesIndex;
