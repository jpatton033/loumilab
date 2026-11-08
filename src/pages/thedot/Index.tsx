import heroDot from "@/assets/heroes/thedot.jpg";
import { PageHero } from "@/components/brand/flow/Flow";
import { ClosingCta } from "@/components/brand/flow/Flow";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/Reveal";
import { DotMarker, DotThread } from "@/components/brand/dot";
import TheDotSignup from "@/components/thedot/TheDotSignup";
import { issueMonthLabel, useLatestIssue, usePublishedIssues } from "@/lib/thedot/queries";
import { ArrowRight } from "lucide-react";

const TITLE = "The Dot. | A Loumilab Brief";
const DESCRIPTION =
  "The Dot. is a brief from Loumilab exploring the ideas, technology, and shifts shaping how businesses work, build, and grow. We focus on what matters, why it matters, and what's worth watching next.";

const theDotJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "The Dot.",
  alternateName: "A Loumilab Brief",
  description: DESCRIPTION,
  url: "https://loumilab.com/the-dot",
  isPartOf: { "@type": "WebSite", name: "Loumilab", url: "https://loumilab.com" },
  publisher: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
};

const TheDotIndex = () => {
  const { data: latest } = useLatestIssue();
  const { data: issues = [] } = usePublishedIssues();
  const archive = issues.filter((i) => !latest || i.id !== latest.id);

  return (
    <Layout>
      <SEOHead
        title={TITLE}
        description={DESCRIPTION}
        path="/the-dot"
        jsonLd={theDotJsonLd}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "The Dot.", path: "/the-dot" }]}
      />

      {/* Masthead */}
      <PageHero image={heroDot} imageAlt="A single circle of skylight falling on a plaster floor in a dark room" eyebrow="A Loumilab Brief" title={<>The Dot<span aria-hidden="true" className="text-dot">.</span></>} lede="Ideas, technology, and what's next." links={[{ label: "Subscribe", to: "#dot-signup" }, { label: "Latest issue", to: "#dot-latest" }]} />
      <section id="dot-signup" className="scroll-mt-24 border-b border-border">
        <div className="section-container pt-16 pb-20 lg:pt-20 lg:pb-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
              The Dot. is a brief from Loumilab exploring the ideas, technology, and shifts shaping how businesses
              work, build, and grow. We focus on what matters, why it matters, and what's worth watching next.
            </p>
          </Reveal>
          <Reveal delay={120} className="mx-auto mt-10 max-w-xl">
            <TheDotSignup
              source="the-dot"
              variant="panel"
              heading="Ideas worth staying curious about."
              description="The Dot. explores the intersection of technology, business, culture, and the changing digital world. Subscribe to receive new perspectives directly in your inbox."
            />
          </Reveal>
        </div>
      </section>

      <DotThread />

      {/* Latest issue */}
      {latest && (
        <section id="dot-latest" className="section-padding scroll-mt-24">
          <div className="section-container">
            <Reveal>
              <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] lg:p-12">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Latest issue — Issue {String(latest.issue_number).padStart(3, "0")} ·{" "}
                  {issueMonthLabel(latest.issue_month, latest.published_at)}
                </p>
                <h2 className="mt-4 max-w-3xl font-hero text-3xl font-semibold leading-[1.08] tracking-[-0.02em] text-foreground lg:text-5xl">
                  {latest.title}
                </h2>
                {latest.subtitle && (
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{latest.subtitle}</p>
                )}
                <Button asChild className="mt-8 dot-action">
                  <Link to={`/the-dot/issue/${latest.slug}`}>
                    Read Issue {String(latest.issue_number).padStart(3, "0")} <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Archive */}
      <section className="pb-24 lg:pb-32">
        <div className="section-container">
          <Reveal>
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              The archive
            </h2>
          </Reveal>
          {issues.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              The first issue is being written now. Subscribe above and you'll see it the moment it publishes.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {(archive.length > 0 ? archive : issues).map((issue) => (
                <li key={issue.id}>
                  <Link
                    to={`/the-dot/issue/${issue.slug}`}
                    className="group flex flex-col gap-2 py-6 transition-colors sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:w-40 sm:shrink-0">
                      Issue {String(issue.issue_number).padStart(3, "0")} · {issueMonthLabel(issue.issue_month, issue.published_at)}
                    </span>
                    <span className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-accent">
                      {issue.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <ClosingCta tone="dark" title="Have something in mind? Let's build it." lede="When an idea is ready to become a product, Loumilab can help." cta={{ label: "Start a Project", to: "/contact" }} />
    </Layout>
  );
};

export default TheDotIndex;
