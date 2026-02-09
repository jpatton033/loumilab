import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import HeroSlideshow from "@/components/HeroSlideshow";
import LumilabLogo from "@/components/LumilabLogo";
import { ArrowRight, Layers, Code, Zap } from "lucide-react";

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
      {/* Hero Slideshow */}
      <HeroSlideshow>
        <div className="section-container py-32 lg:py-0 min-h-screen flex flex-col justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-slide-up flex justify-center mb-8">
              <LumilabLogo size="xl" animated />
            </div>
            <span className="animate-slide-up-delay-1 inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.3em] mb-6">
              Lumilab
            </span>
            <h1 className="animate-slide-up-delay-1 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold leading-[1.05] tracking-tight">
              Digital experiences that{" "}
              <span className="text-gradient">shine</span>.
            </h1>
            <p className="animate-slide-up-delay-2 mt-8 text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We illuminate the path from idea to innovation. Building websites and SaaS products that light up the digital landscape.
            </p>
            <div className="animate-slide-up-delay-3 mt-12 flex flex-wrap justify-center gap-4">
              <Button variant="accent" size="lg" asChild className="glow-hover">
                <Link to="/contact">
                  Start a Project <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-border/50 hover:border-accent/50 hover:bg-accent/5">
                <Link to="/products">View Our Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </HeroSlideshow>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/30">
        <div className="section-container py-16 grid grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl lg:text-5xl font-display font-semibold text-gradient">{stat.value}</div>
              <div className="mt-2 text-sm text-muted-foreground tracking-wide">{stat.label}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="group glass-card rounded-2xl p-8 hover:border-accent/30 transition-all duration-500 glow-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="text-accent" size={24} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Button variant="outline" size="lg" asChild className="border-border/50 hover:border-accent/50">
              <Link to="/services">
                All Services <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process teaser */}
      <section className="section-padding bg-secondary/30 border-y border-border">
        <div className="section-container text-center">
          <span className="inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.2em] mb-4">
            Our Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-semibold mb-6">From idea to launch in 5 steps</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-12">
            Discovery, design, build, launch, then iterate and scale.
          </p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {["Discovery", "Design", "Build", "Launch", "Scale"].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-semibold text-sm">
                  {i + 1}
                </span>
                <span className="font-display text-sm text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <Button variant="accent" size="lg" asChild className="glow-hover">
              <Link to="/how-we-work">
                Learn Our Process <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="section-container">
          <div className="glass-card rounded-3xl p-12 lg:p-20 text-center">
            <LumilabLogo size="lg" className="mx-auto mb-8" />
            <h2 className="text-3xl lg:text-5xl font-semibold mb-6">
              Ready to build something{" "}
              <span className="text-gradient">brilliant</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
              Let's illuminate your next project. We ship fast and build to last.
            </p>
            <Button variant="accent" size="lg" asChild className="glow-hover">
              <Link to="/contact">
                Get in Touch <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
