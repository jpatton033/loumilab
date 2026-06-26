import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Code, Lightbulb, Zap, RefreshCw, Shield } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    desc: "Responsive, conversion-optimized websites built with modern tools. From marketing sites to complex platforms.",
    features: ["Custom design systems", "Mobile-first responsive", "SEO-optimized", "CMS integration"],
  },
  {
    icon: Code,
    title: "SaaS Development",
    desc: "Custom SaaS platforms and web applications — from MVP to scale, engineered for speed and security.",
    features: ["MVP development", "Multi-tenant architecture", "Auth & billing", "Admin dashboards"],
  },
  {
    icon: Code,
    title: "SaaS & MVP Development",
    desc: "Rapidly prototype and launch your software product. We help you validate ideas and get to market fast.",
    features: ["Product scoping", "Database & auth", "Payment integration", "User dashboards"],
  },
  {
    icon: Lightbulb,
    title: "Product Strategy & UX/UI",
    desc: "Research-driven strategy and human-centered design that drives engagement and growth.",
    features: ["User research", "Wireframing", "Visual design", "Usability testing"],
  },
  {
    icon: Zap,
    title: "AI-Assisted Builds",
    desc: "Leverage AI-assisted development for 10x faster delivery without sacrificing quality.",
    features: ["Rapid prototyping", "AI-generated code", "Smart iteration", "Cost-effective"],
  },
  {
    icon: RefreshCw,
    title: "Ongoing Iteration & Scaling",
    desc: "Post-launch optimization, feature development, and scaling support to grow your product.",
    features: ["Performance monitoring", "Feature expansion", "Infrastructure scaling", "Analytics & insights"],
  },
  {
    icon: Shield,
    title: "Information & Cybersecurity",
    desc: "Protect your digital assets with proactive security assessments, secure architecture design, and ongoing threat monitoring.",
    features: ["Security audits", "Penetration testing", "Secure architecture", "Compliance & governance"],
  },
];

const servicesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.title,
      description: s.desc,
      provider: { "@type": "Organization", name: "LOUMILAB", url: "https://loumilab.com" },
    },
  })),
};

const Services = () => (
  <Layout>
    <SEOHead
      title="Web Design, SaaS & Cybersecurity Services — LOUMILAB"
      description="Custom website design, SaaS MVP development, cybersecurity consulting, and AI-assisted builds. Ship fast, scale smart, stay secure."
      path="/services"
      jsonLd={servicesJsonLd}
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <SectionHeading
          label="Services"
          title="Everything you need to build and scale"
          description="From strategy to launch and beyond. We offer end-to-end product development services."
        />
        <div className="grid gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group glass-card rounded-2xl p-8 lg:p-10 hover:border-accent/30 transition-all duration-500 glow-hover grid md:grid-cols-[1fr_1.5fr] gap-8"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="text-accent" size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 content-start">
                {service.features.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button variant="accent" size="lg" asChild className="glow-hover">
            <Link to="/contact">
              Discuss Your Project <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default Services;
