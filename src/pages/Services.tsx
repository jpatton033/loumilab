import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool, Code2, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";

const pillars = [
  {
    icon: PenTool,
    label: "Design",
    title: "Brand, product, and interface design",
    desc: "We design digital experiences that feel considered — clear structure, confident typography, and interfaces people trust immediately.",
    services: [
      { name: "Website design", desc: "Marketing sites and brand experiences built around conversion and clarity." },
      { name: "Product & UX/UI design", desc: "Flows, wireframes, and interface systems for software people use daily." },
      { name: "Design systems", desc: "Reusable components and tokens so the product stays consistent as it grows." },
    ],
  },
  {
    icon: Code2,
    label: "Build",
    title: "Websites, web apps, and SaaS platforms",
    desc: "Engineering that holds up under real use. We build for maintainability first, because most of a product's life happens after launch.",
    services: [
      { name: "Website development", desc: "Fast, accessible, SEO-ready front ends with the CMS or backend you need." },
      { name: "SaaS development", desc: "Multi-tenant platforms with auth, billing, dashboards, and admin tooling." },
      { name: "MVP development", desc: "A focused first version, shipped quickly, built to be extended rather than replaced." },
    ],
  },
  {
    icon: Sparkles,
    label: "Innovate",
    title: "Automation, AI, and technology consulting",
    desc: "We apply modern tooling where it removes real work, and advise on the technology decisions that are hard to reverse later.",
    services: [
      { name: "AI-assisted builds", desc: "Modern tooling used deliberately to shorten delivery without lowering the bar." },
      { name: "Workflow automation", desc: "Removing manual steps between the systems a business already runs on." },
      { name: "Technology consulting", desc: "Architecture, stack, and roadmap decisions made with someone who has shipped them." },
    ],
  },
  {
    icon: ShieldCheck,
    label: "Secure",
    title: "Cybersecurity and secure architecture",
    desc: "Security treated as part of building, not an audit at the end. We design and review systems so exposure is limited by default.",
    services: [
      { name: "Security assessments", desc: "Reviews of applications, configuration, and access to find real exposure." },
      { name: "Secure architecture", desc: "Authentication, authorization, and data handling designed correctly up front." },
      { name: "Security consulting", desc: "Practical guidance on policy, compliance readiness, and ongoing posture." },
    ],
  },
];

const servicesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: pillars.flatMap((p) => p.services).map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.name,
      description: s.desc,
      provider: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
    },
  })),
};

const Services = () => (
  <Layout>
    <SEOHead
      title="Services — Design, Build, Innovate, Secure — Loumilab"
      description="Website and product design, SaaS and web development, automation and AI, plus cybersecurity consulting — delivered by one senior team."
      path="/services"
      jsonLd={servicesJsonLd}
    />

    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-20">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="section-container relative max-w-3xl">
        <Eyebrow>Services</Eyebrow>
        <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
          Everything it takes to design, build, and secure it.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Four disciplines, one accountable team. We work end to end so strategy, design, engineering, and
          security stay aligned instead of being split across vendors.
        </p>
      </div>
    </section>

    <section className="section-padding pt-8">
      <div className="section-container space-y-6">
        {pillars.map((pillar, i) => (
          <Reveal key={pillar.label} delay={i * 60}>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <pillar.icon size={22} strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {pillar.label}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-semibold lg:text-3xl">{pillar.title}</h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </div>
                <div className="grid gap-4 content-start sm:grid-cols-1">
                  {pillar.services.map((s) => (
                    <div key={s.name} className="rounded-2xl bg-surface-subtle p-5">
                      <h3 className="font-display text-base font-semibold">{s.name}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    {/* Ongoing partnership */}
    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <RefreshCw size={22} strokeWidth={1.75} />
            </div>
            <Eyebrow>Ongoing partnership</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">
              Launch is the start, not the finish.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Most of our work continues after launch: iterating on what real usage reveals, expanding
              features, tightening performance, and keeping security current. We stay available as a
              long-term technology partner rather than handing over files and disappearing.
            </p>
            <Link to="/how-we-work" className="mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold hover:text-accent">
              See how we work <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>

    <section className="section-padding border-t border-border">
      <div className="section-container text-center">
        <h2 className="text-3xl font-semibold lg:text-4xl">Tell us what you&apos;re building.</h2>
        <Button size="lg" asChild className="mt-8">
          <Link to="/contact">
            Start a Project <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Services;
