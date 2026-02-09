import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
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

const Work = () => (
  <Layout>
    <section className="section-padding">
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
              className="group surface-elevated rounded-xl overflow-hidden border border-border/50 hover:border-accent/30 transition-all duration-300"
            >
              <div className="h-48 bg-gradient-to-br from-accent/10 via-secondary to-muted flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-muted-foreground/30">{study.title}</span>
              </div>
              <div className="p-8">
                <span className="text-accent font-display text-xs font-semibold uppercase tracking-widest">{study.category}</span>
                <h3 className="font-display text-xl font-bold mt-2 mb-3">{study.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{study.desc}</p>
                <div className="flex flex-wrap gap-4">
                  {study.metrics.map((m) => (
                    <span key={m} className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button variant="accent" size="lg" asChild>
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
