import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const caseStudies = [
  {
    title: "FinTrack Dashboard",
    category: "SaaS Product",
    desc: "A real-time financial analytics platform built for a Series A fintech startup. Shipped MVP in 3 weeks.",
    metrics: ["40% faster onboarding", "12k MAU in month 1", "3-week delivery"],
  },
  {
    title: "Bloom E-Commerce",
    category: "Website",
    desc: "A modern DTC storefront for a sustainable beauty brand. Conversion-optimized design with headless CMS.",
    metrics: ["2.4x conversion lift", "< 1s load time", "Mobile-first"],
  },
  {
    title: "CareConnect Portal",
    category: "Web App",
    desc: "Patient management platform for a healthtech company. Secure, HIPAA-aware, and beautifully designed.",
    metrics: ["60% time savings", "99.9% uptime", "HIPAA-aligned"],
  },
];

const workJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "LOUMILAB Case Studies",
  url: "https://loumilab.com/work",
  hasPart: caseStudies.map((c) => ({
    "@type": "CreativeWork",
    name: c.title,
    about: c.category,
    description: c.desc,
  })),
};

const Work = () => (
  <Layout>
    <SEOHead
      title="Case Studies & Portfolio — LOUMILAB"
      description="See how we've helped startups and brands ship faster. Real projects, real results."
      path="/work"
      jsonLd={workJsonLd}
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <SectionHeading
          label="Work"
          title="Projects that deliver results"
          description="Real outcomes from real projects. Here's a look at what we've built and the impact it created."
        />
        <div className="grid gap-8">
          {caseStudies.map((study) => (
            <div
              key={study.title}
              className="group glass-card rounded-2xl overflow-hidden hover:border-accent/30 transition-all duration-500 glow-hover"
            >
              <div className="h-56 bg-gradient-to-br from-accent/5 via-secondary to-muted/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(43_55%_59%/0.1),transparent_70%)]" />
                <span className="font-display text-3xl font-semibold text-muted-foreground/20 relative z-10">{study.title}</span>
              </div>
              <div className="p-8">
                <span className="text-accent font-display text-xs font-medium uppercase tracking-[0.2em]">{study.category}</span>
                <h3 className="font-display text-xl font-semibold mt-2 mb-3">{study.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{study.desc}</p>
                <div className="flex flex-wrap gap-3">
                  {study.metrics.map((m) => (
                    <span key={m} className="text-sm font-medium bg-secondary/80 text-foreground/80 px-4 py-1.5 rounded-full border border-border/50">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button variant="accent" size="lg" asChild className="glow-hover">
            <Link to="/contact">
              Work With Us <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default Work;
