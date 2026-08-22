import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { productGroups } from "@/data/products";

const values = [
  {
    title: "Product thinking",
    desc: "We treat every engagement as a product, not a deliverable. Outcomes, users, and durability come before scope documents.",
  },
  {
    title: "Craft",
    desc: "Clean code, considered design, and attention to the details users feel even when they can't name them.",
  },
  {
    title: "Modern tooling",
    desc: "We adopt automation and AI where it genuinely removes work, and ignore it where it doesn't.",
  },
  {
    title: "Security by default",
    desc: "Secure decisions made while building are cheaper and stronger than fixes applied afterward.",
  },
];

const About = () => (
  <Layout>
    <SEOHead
      title="About Loumilab — Technology Partner and Product Builder"
      description="Loumilab is a senior technology studio that designs, builds, launches, and secures digital products — for clients and for itself."
      path="/about"
    />

    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-20">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="section-container relative max-w-3xl">
        <Eyebrow>About</Eyebrow>
        <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
          A technology partner and a product builder.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Loumilab is a small, senior technology studio. We design and build digital products for the
          businesses we work with — and we build, launch, and operate our own products and companies. Both
          sides sharpen each other.
        </p>
      </div>
    </section>

    <section className="section-padding pt-8">
      <div className="section-container">
        <div className="grid gap-6 md:grid-cols-2">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40">
                <h2 className="font-display text-lg font-semibold">{v.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>The group</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">
            What we build under our own name.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Loumilab operates its own products and companies. It keeps us close to the decisions our clients
            face — pricing, positioning, security, and support included.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {productGroups.flatMap((g) => g.items).map((p) => (
            <div key={p.id} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {p.category}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{p.tagline}</p>
            </div>
          ))}
        </div>
        <Link to="/products" className="mt-10 inline-flex items-center gap-2 font-display text-sm font-semibold hover:text-accent">
          Explore the ecosystem <ArrowRight size={16} />
        </Link>
      </div>
    </section>

    <section className="section-padding border-t border-border">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)] lg:p-16">
          <h2 className="text-3xl font-semibold lg:text-4xl">Want to work with us?</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Whether you&apos;re hiring a studio or joining one, we&apos;d like to hear from you.
          </p>
          <Button size="lg" asChild className="mt-8">
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
