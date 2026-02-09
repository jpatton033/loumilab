import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const values = [
  { title: "Product Thinking", desc: "We approach every project as a product, not a deliverable. Strategy, UX, and outcomes come first." },
  { title: "Craftsmanship", desc: "Clean code, thoughtful design, and attention to detail. We build things that last and scale." },
  { title: "Modern Tools", desc: "Lovable, AI-assisted workflows, and cutting-edge tech. We stay ahead so your product does too." },
  { title: "Speed & Quality", desc: "We don't trade one for the other. Our process delivers both through smart tooling and senior execution." },
];

const About = () => (
  <Layout>
    <section className="section-padding">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <span className="inline-block text-accent font-display text-sm font-semibold uppercase tracking-widest mb-4">
            About Us
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            A small, senior team building{" "}
            <span className="text-gradient">big things</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We're a product-driven digital studio. We design, develop, and launch websites and SaaS products using Lovable and modern AI-assisted tools. We also build and scale our own products — because the best way to understand product development is to do it ourselves.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {values.map((v) => (
            <div key={v.title} className="surface-elevated rounded-xl p-8 border border-border/50">
              <h3 className="font-display text-lg font-bold mb-3">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-primary text-primary-foreground rounded-2xl p-12 lg:p-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Want to join our team?</h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto mb-8">
            We're always looking for talented designers and developers who think in products.
          </p>
          <Button variant="accent" size="lg" asChild>
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
