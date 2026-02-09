import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight, Zap, Layers, Rocket, Code, RefreshCw } from "lucide-react";

const services = [
  { icon: Layers, title: "Website Design & Development", desc: "Custom, responsive websites that convert visitors into customers." },
  { icon: Code, title: "SaaS & MVP Development", desc: "Rapidly prototype, validate, and ship your product ideas." },
  { icon: Zap, title: "AI-Assisted Builds", desc: "Lovable-powered development for 10x faster delivery." },
];

const stats = [
  { value: "10x", label: "Faster delivery" },
  { value: "50+", label: "Projects shipped" },
  { value: "98%", label: "Client satisfaction" },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative section-container py-32 lg:py-44">
          <div className="max-w-3xl">
            <span className="animate-slide-up inline-block text-accent font-display text-sm font-semibold uppercase tracking-widest mb-6">
              Product-Driven Digital Studio
            </span>
            <h1 className="animate-slide-up-delay-1 text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              We build websites &{" "}
              <span className="text-gradient">SaaS products</span>{" "}
              that scale.
            </h1>
            <p className="animate-slide-up-delay-2 mt-6 text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Lovable-powered development, product thinking, and rapid iteration. From concept to launch in weeks, not months.
            </p>
            <div className="animate-slide-up-delay-3 mt-10 flex flex-wrap gap-4">
              <Button variant="accent" size="lg" asChild>
                <Link to="/contact">
                  Start a Project <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="accent-outline" size="lg" asChild>
                <Link to="/products">View Our Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/50">
        <div className="section-container py-12 grid grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl lg:text-4xl font-display font-bold text-gradient">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services preview */}
      <section className="section-padding">
        <div className="section-container">
          <SectionHeading
            label="What we do"
            title="Websites, SaaS, and everything in between"
            description="We combine product strategy, modern design, and AI-powered development to ship fast and scale smart."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group surface-elevated rounded-xl p-8 border border-border/50 hover:border-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="text-accent" size={24} />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                All Services <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process teaser */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="section-container text-center">
          <span className="inline-block text-accent font-display text-sm font-semibold uppercase tracking-widest mb-4">
            Our Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">From idea to launch in 5 steps</h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto text-lg mb-10">
            Discovery, design, build with Lovable, launch fast, then iterate and scale.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {["Discovery", "Design", "Build", "Launch", "Scale"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-bold text-sm">
                  {i + 1}
                </span>
                <span className="font-display font-semibold text-sm">{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Button variant="accent" size="lg" asChild>
              <Link to="/how-we-work">
                Learn Our Process <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="section-container text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to build something{" "}
            <span className="text-gradient">remarkable</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
            Let's talk about your next website or SaaS product. We ship fast.
          </p>
          <Button variant="accent" size="lg" asChild>
            <Link to="/contact">
              Get in Touch <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
