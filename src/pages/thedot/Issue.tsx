import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { DotThread } from "@/components/brand/dot";
import IssueRichContent from "@/components/thedot/IssueRichContent";
import TheDotSignup from "@/components/thedot/TheDotSignup";
import { issueMonthLabel, useDotIssue, type DotShortStory } from "@/lib/thedot/queries";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

const pad = (n: number) => String(n).padStart(3, "0");

const paragraphs = (text: string | null | undefined): string[] => {
  if (!text) return [];
  const blocks = text.trim().split(/\n{2,}/);
  return (blocks.length > 1 ? blocks : text.trim().split(/\n/))
    .map((p) => p.trim())
    .filter(Boolean);
};

const IssuePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: issue, isLoading } = useDotIssue(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="section-container pt-16 pb-32">
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-secondary" />
          <div className="mt-6 h-4 w-1/2 animate-pulse rounded-xl bg-secondary" />
        </div>
      </Layout>
    );
  }

  if (!issue) {
    return (
      <Layout>
        <SEOHead title="Issue not found | The Dot." description="This issue is no longer available." path="/the-dot" noindex />
        <section className="section-padding pt-16 text-center">
          <div className="section-container">
            <h1 className="text-3xl font-semibold">Issue not found</h1>
            <p className="mt-4 text-muted-foreground">It may have moved or been unpublished.</p>
            <Button asChild className="mt-8">
              <Link to="/the-dot">Back to The Dot.</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const published = issue.status === "published";
  const title = published
    ? `${issue.title} — The Dot. | Loumilab`
    : `Draft preview — The Dot. | Loumilab`;
  const description =
    issue.subtitle ||
    (issue.story_title ? `${issue.story_title} — A brief from Loumilab on ideas, technology, and what's next.` : "A brief from Loumilab.");
  const storyParas = paragraphs(issue.story_body);
  const rich = issue.content_format === "html";

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        path={`/the-dot/issue/${issue.slug}`}
        noindex={!published}
        ogType="article"
        ogTitle={issue.title}
        ogDescription={description}
        image={issue.cover_image_url || undefined}
        imageAlt={issue.title}
        publishedTime={issue.published_at ?? undefined}
        modifiedTime={issue.updated_at}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "The Dot.", path: "/the-dot" },
          { name: `Issue ${pad(issue.issue_number)}`, path: `/the-dot/issue/${issue.slug}` },
        ]}
      />

      <article className="section-padding pt-8 lg:pt-12">
        <div className="mx-auto max-w-3xl px-4 lg:px-0">
          <Reveal>
            <Link
              to="/the-dot"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeft size={15} /> The Dot.
            </Link>

            {!published && (
              <span className="mt-4 block w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                Draft preview
              </span>
            )}

            <p className="mt-8 font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Issue {pad(issue.issue_number)} · {issueMonthLabel(issue.issue_month, issue.published_at)}
            </p>
            <h1 className="mt-4 font-hero text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground lg:text-6xl">
              {issue.title}
            </h1>
            {issue.subtitle && (
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground lg:text-xl">{issue.subtitle}</p>
            )}
          </Reveal>

          {issue.editors_note && (
            <Reveal delay={60}>
              <div className="mt-10 border-l-2 border-accent/40 pl-6">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Editor's note
                </p>
                {rich ? <IssueRichContent body={issue.editors_note} className="mt-3 leading-relaxed text-foreground/80" /> : paragraphs(issue.editors_note).map((p, i) => (
                  <p key={i} className="mt-3 leading-relaxed text-foreground/80">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          )}

          <DotThread className="mt-12" />

          {issue.story_title && storyParas.length > 0 && (
            <Reveal className="mt-12">
              <h2 className="text-2xl font-semibold leading-snug lg:text-3xl">{issue.story_title}</h2>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-foreground/90">
                {rich ? <IssueRichContent body={issue.story_body ?? ""} /> : storyParas.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>
          )}

          {(issue.short_stories ?? []).length > 0 && (
            <div className="mt-16 space-y-10">
              {(issue.short_stories as DotShortStory[]).map((story, i) => (
                <Reveal key={i}>
                  <div className="rounded-3xl border border-border bg-card p-7">
                    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} · Also in this issue
                    </p>
                    <h3 className="mt-3 font-display text-xl font-semibold">{story.title}</h3>
                    {rich ? <IssueRichContent body={story.body} className="mt-3 leading-relaxed text-muted-foreground" /> : paragraphs(story.body).map((p, j) => (
                      <p key={j} className="mt-3 leading-relaxed text-muted-foreground">
                        {p}
                      </p>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {(issue.resource_links ?? []).length > 0 && (
            <Reveal className="mt-16">
              <div className="rounded-3xl border border-border bg-surface-subtle p-7">
                <h2 className="font-display text-lg font-semibold">Worth your time</h2>
                <div className="mt-5 space-y-3">
                  {(issue.resource_links ?? []).map((link, i) =>
                    link.href.startsWith("http") ? (
                      <a
                        key={i}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-accent/40"
                      >
                        {link.label}
                        <ArrowUpRight size={15} className="shrink-0 text-accent" />
                      </a>
                    ) : (
                      <Link
                        key={i}
                        to={link.href}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-accent/40"
                      >
                        {link.label}
                        <ArrowRight size={15} className="shrink-0 text-accent" />
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {issue.product_update && paragraphs(issue.product_update).length > 0 && (
            <Reveal className="mt-16">
              <div className="rounded-3xl border border-border bg-card p-7">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  From Loumilab
                </p>
                {rich ? <IssueRichContent body={issue.product_update} className="mt-3 leading-relaxed text-muted-foreground" /> : paragraphs(issue.product_update).map((p, i) => (
                  <p key={i} className="mt-3 leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          )}

          {issue.closing_thought && (
            <Reveal className="mt-16">
              {rich ? <IssueRichContent body={issue.closing_thought} className="font-display text-xl font-medium leading-relaxed text-foreground lg:text-2xl" /> : <p className="font-display text-xl font-medium leading-relaxed text-foreground lg:text-2xl">{issue.closing_thought}</p>}
            </Reveal>
          )}

          <div className="mt-16">
            <TheDotSignup source={`the-dot-issue-${issue.slug}`} variant="panel" />
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default IssuePage;
