import { useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import fintrackImg from "@/assets/work/fintrack.jpg";
import bloomImg from "@/assets/work/bloom.jpg";
import careconnectImg from "@/assets/work/careconnect.jpg";

const caseStudies = [
  {
    title: "FinTrack Dashboard",
    category: "Software",
    desc: "A real-time financial analytics platform built for a Series A fintech startup. Shipped MVP in 3 weeks.",
    metrics: ["40% faster onboarding", "12k MAU in month 1", "3-week delivery"],
    image: fintrackImg,
    alt: "FinTrack analytics dashboard interface with portfolio charts and summary metric cards",
  },
  {
    title: "Bloom E-Commerce",
    category: "Websites",
    desc: "A modern DTC storefront for a sustainable beauty brand. Conversion-optimized design with headless CMS.",
    metrics: ["2.4x conversion lift", "< 1s load time", "Mobile-first"],
    image: bloomImg,
    alt: "Bloom skincare storefront shown on desktop and mobile with a product grid",
  },
  {
    title: "CareConnect Portal",
    category: "Digital Products",
    desc: "Patient management platform for a healthtech company. Secure, HIPAA-aware, and beautifully designed.",
    metrics: ["60% time savings", "99.9% uptime", "HIPAA-aligned"],
    image: careconnectImg,
    alt: "CareConnect patient portal with appointment schedule and patient record panel",
  },
];


const categories = ["All", ...Array.from(new Set(caseStudies.map((c) => c.category)))];

const workJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Loumilab Selected Work",
  url: "https://loumilab.com/work",
  hasPart: caseStudies.map((c) => ({
    "@type": "CreativeWork",
    name: c.title,
    about: c.category,
    description: c.desc,
  })),
};

const Work = () => {
  const [active, setActive] = useState("All");
  const visible = active === "All" ? caseStudies : caseStudies.filter((c) => c.category === active);

  return (
    <Layout>
      <SEOHead
        title="Selected Work — Case Studies — Loumilab | Technology Studio for Digital Products"
        description="Websites, software, and digital products built by Loumilab. Real projects and the outcomes they delivered."
        path="/work"
        jsonLd={workJsonLd}
      />

      <section className="relative overflow-hidden pt-32 pb-12 lg:pt-44 lg:pb-16">
        <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
        <div className="section-container relative max-w-3xl">
          <Eyebrow>Selected work</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
            Work that had to hold up.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            A look at what we&apos;ve designed, built, and shipped — and the difference it made once it was live.
          </p>
        </div>
      </section>

      <section className="section-padding pt-4">
        <div className="section-container">
          <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter work by category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active === c
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-6">
            {visible.map((study, i) => (
              <Reveal key={study.title} delay={i * 70}>
                <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40">
                  <div className="relative flex h-52 items-center justify-center overflow-hidden bg-surface-subtle lg:h-64">
                    <div className="absolute inset-0 hero-grid" aria-hidden="true" />
                    <span className="relative font-display text-2xl font-semibold text-foreground/25 lg:text-4xl">
                      {study.title}
                    </span>
                  </div>
                  <div className="p-8 lg:p-10">
                    <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {study.category}
                    </span>
                    <h2 className="mt-3 font-display text-xl font-semibold lg:text-2xl">{study.title}</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{study.desc}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {study.metrics.map((m) => (
                        <span
                          key={m}
                          className="rounded-full border border-border bg-surface-subtle px-4 py-1.5 text-sm font-medium text-foreground/80"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-border bg-surface-subtle">
        <div className="section-container text-center">
          <h2 className="text-3xl font-semibold lg:text-4xl">Let&apos;s make yours the next one.</h2>
          <Button size="lg" asChild className="mt-8">
            <Link to="/contact">
              Work With Us <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Work;
