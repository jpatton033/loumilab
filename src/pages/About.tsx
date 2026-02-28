import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import DiamondLogo from "@/components/DiamondLogo";

const values = [
  { title: "Product Thinking", desc: "We approach every project as a product, not a deliverable. Strategy, UX, and outcomes come first." },
  { title: "Craftsmanship", desc: "Clean code, thoughtful design, and attention to detail. We build things that last and scale." },
  { title: "Modern Tools", desc: "AI-assisted workflows and cutting-edge tech. We stay ahead so your product does too." },
  { title: "Speed & Quality", desc: "We don't trade one for the other. Our process delivers both through smart tooling and senior execution." },
];

const About = () => (
  <Layout>
    <SEOHead
      title="About LOUMILAB — A Senior Product-Driven Digital Studio"
      description="A small, senior team building pristine digital products. Website design, SaaS development, cybersecurity, and product strategy."
      path="/about"
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="flex justify-center mb-6">
            <DiamondLogo size="lg" />
          </div>
          <span className="inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.2em] mb-4">
            About Us
          </span>
          <h1 className="text-4xl lg:text-6xl font-semibold leading-tight mb-6">
            A small, senior team building{" "}
            <span className="text-gradient">pristine</span> products
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We're a product-driven digital studio. We design, develop, and launch websites, SaaS products, and cybersecurity solutions with precision and purpose. We also build and scale our own products — because the best way to understand product development is to do it ourselves.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="glass-card rounded-2xl p-8 hover:border-accent/30 transition-all duration-500 glow-hover">
              <h3 className="font-display text-lg font-semibold mb-3">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 glass-card rounded-3xl p-12 lg:p-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">Want to join our team?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            We're always looking for talented designers and developers who think in products.
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

export default About;
