import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ArticleBody from "@/components/kc/ArticleBody";
import ArticleCard from "@/components/kc/ArticleCard";
import NewsletterSignup from "@/components/kc/NewsletterSignup";
import { recordArticleView, useArticle, usePublishedArticles } from "@/lib/kc/queries";
import { slugify } from "@/lib/kc/types";
import { ArrowLeft, ArrowRight, Clock, Download, Eye, ExternalLink, Link2 } from "lucide-react";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

const ResourceArticle = () => {
  const { section: sectionSlug, slug } = useParams<{ section: string; slug: string }>();
  const { data: article, isLoading } = useArticle(slug);
  const { data: siblings = [] } = usePublishedArticles({ sectionSlug, limit: 4 });
  const { toast } = useToast();

  useEffect(() => {
    if (article?.status === "published" && slug) {
      recordArticleView(slug).catch(() => undefined);
    }
  }, [article?.status, slug]);

  const headings = useMemo(() => {
    if (!article?.body) return [] as { id: string; text: string }[];
    return article.body
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => {
        const text = line.replace(/^##\s+/, "").trim();
        return { id: slugify(text), text };
      });
  }, [article?.body]);

  const related = siblings.filter((a) => a.slug !== slug).slice(0, 3);
  const attachments = (article?.kc_attachments ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const tags = (article?.kc_article_tags ?? []).map((t) => t.kc_tags).filter(Boolean);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="section-container py-32">
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-secondary" />
          <div className="mt-6 h-4 w-1/2 animate-pulse rounded-xl bg-secondary" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <SEOHead
          title="Article not found | Loumilab"
          description="This resource is no longer available."
          path="/resources"
          noindex
        />
        <section className="section-padding pt-32 text-center">
          <div className="section-container">
            <h1 className="text-3xl font-semibold">Article not found</h1>
            <p className="mt-4 text-muted-foreground">It may have moved or been unpublished.</p>
            <Button asChild className="mt-8">
              <Link to="/resources">Back to Knowledge Center</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const canonicalSection = article.kc_sections?.slug ?? sectionSlug ?? "";
  const title = article.seo_title || `${article.title} | Loumilab`;
  const description =
    article.seo_description || article.summary || "A practical guide from the Loumilab Knowledge Center.";

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        path={`/resources/${canonicalSection}/${article.slug}`}
        noindex={article.status !== "published"}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description,
          datePublished: article.published_at ?? article.created_at,
          dateModified: article.updated_at,
          author: { "@type": "Organization", name: article.author || "Loumilab" },
          publisher: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
          mainEntityOfPage: `https://loumilab.com/resources/${canonicalSection}/${article.slug}`,
        }}
      />

      <article className="section-padding pt-16 lg:pt-24">
        <div className="section-container">
          <Link
            to={`/resources/${canonicalSection}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} /> {article.kc_sections?.title ?? "Knowledge Center"}
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <Reveal>
                {article.status !== "published" && (
                  <span className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                    Draft preview
                  </span>
                )}
                <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight lg:text-5xl">
                  {article.title}
                </h1>
                {article.summary && (
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.summary}</p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-border pb-6 text-sm text-muted-foreground">
                  {article.author && <span>{article.author}</span>}
                  {article.published_at && <span>{formatDate(article.published_at)}</span>}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> {article.read_minutes} min read
                  </span>
                  {article.view_count > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Eye size={14} /> {article.view_count} views
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={copyLink}
                    className="ml-auto inline-flex items-center gap-1.5 transition-colors hover:text-accent"
                  >
                    <Link2 size={14} /> Copy link
                  </button>
                </div>
              </Reveal>

              {article.hero_image_url && (
                <img
                  src={article.hero_image_url}
                  alt={article.title}
                  loading="lazy"
                  className="mt-8 aspect-[16/8] w-full rounded-3xl border border-border object-cover"
                />
              )}

              <ArticleBody body={article.body} />

              {(attachments.length > 0 || article.document_url) && (
                <div className="mt-12 rounded-3xl border border-border bg-surface-subtle p-7">
                  <h2 className="font-display text-lg font-semibold">Downloads & tools</h2>
                  <div className="mt-5 space-y-3">
                    {article.document_url && (
                      <a
                        href={article.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-accent/40"
                      >
                        Open in the Loumilab document app
                        <ExternalLink size={15} className="text-accent" />
                      </a>
                    )}
                    {attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-accent/40"
                      >
                        {file.label}
                        <Download size={15} className="text-accent" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {article.related_link_href && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-display font-semibold">{article.related_link_label ?? "Related from Loumilab"}</p>
                  <Button asChild variant="outline">
                    {article.related_link_href.startsWith("http") ? (
                      <a href={article.related_link_href} target="_blank" rel="noopener noreferrer">
                        Learn more <ArrowRight size={15} />
                      </a>
                    ) : (
                      <Link to={article.related_link_href}>
                        Learn more <ArrowRight size={15} />
                      </Link>
                    )}
                  </Button>
                </div>
              )}

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag!.id} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      {tag!.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {headings.length > 1 && (
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    On this page
                  </p>
                  <nav className="mt-4 space-y-2 border-l border-border pl-4">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>

          {related.length > 0 && (
            <div className="mt-20 border-t border-border pt-12">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                More in {article.kc_sections?.title ?? "the Knowledge Center"}
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-16">
            <NewsletterSignup source={`article-${article.slug}`} compact />
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ResourceArticle;
