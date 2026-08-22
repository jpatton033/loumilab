import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import CapabilityCard from "@/components/brand/CapabilityCard";
import ProductCard from "@/components/brand/ProductCard";
import { Button } from "@/components/ui/button";
import { productGroups } from "@/data/products";
import { ArrowRight, PenTool, Code2, Sparkles, ShieldCheck } from "lucide-react";

const capabilities = [
  {
    icon: PenTool,
    label: "Design",
    title: "Interfaces with intent",
    description:
      "Brand-led websites and product interfaces designed around clarity, trust, and the outcome the business actually needs.",
  },
  {
    icon: Code2,
    label: "Build",
    title: "Software that holds up",
    description:
      "Websites, web apps, and SaaS platforms engineered to be fast, maintainable, and ready for the next stage of growth.",
  },
  {
    icon: Sparkles,
    label: "Innovate",
    title: "Automation and AI, applied",
    description:
      "We use modern tooling and AI where it removes real work — shortening delivery and simplifying how teams operate.",
  },
  {
    icon: ShieldCheck,
    label: "Secure",
    title: "Security from the start",
    description:
      "Secure architecture, reviews, and consulting so what we ship protects the business instead of exposing it.",
  },
];

const sequence = ["Design.", "Build.", "Launch.", "Secure."];

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Loumilab",
  url: "https://loumilab.com",
  email: "hello@loumilab.com",
  description:
    "Loumilab is a technology studio that designs, builds, launches, and secures digital products and technology businesses.",
  subOrganization: [
    { "@type": "Organization", name: "Vurtti", url: "https://www.vurttidocs.com" },
  ],
  owns: [{ "@type": "Product", name: "Loumilab Orders", url: "https://loumilab.com/orders" }],
};

const Index = () => (
  <Layout>
    <SEOHead
      title="Loumilab — Technology Studio for Digital Products"
      description="Loumilab designs, builds, launches, and secures digital products and technology businesses. Websites, software, AI automation, and cybersecurity."
      path="/"
      jsonLd={homeJsonLd}
    />

    {/* Hero */}
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden="true" />
      <div className="section-container relative">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="animate-slide-up-delay-1 font-hero font-semibold leading-[0.95] tracking-[-0.04em]"
              style={{ fontSize: "clamp(2.75rem, 8vw, 6rem)" }}>
            We Build What&apos;s Next.
          </h1>

          <p className="animate-slide-up-delay-2 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Loumilab designs, builds, launches, and secures digital products and technology businesses.
          </p>
          <div className="animate-slide-up-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/services">
                Explore Loumilab <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Start a Project</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Brand statement */}
    <section className="section-padding border-t border-border">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <Reveal>
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
              More than a digital agency.
            </h2>
          </Reveal>
          <Reveal delay={80} className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Loumilab is a technology studio. We work with businesses to design and build the digital
              products they need — and we build and operate our own products alongside them.
            </p>
            <p>
              That combination changes how we work. We make the same decisions our clients make, live with
              the consequences, and bring that judgment to every engagement.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-border pt-12 lg:grid-cols-4">
          {sequence.map((word, i) => (
            <Reveal key={word} delay={i * 120}>
              <span className="font-hero text-3xl font-semibold tracking-tight lg:text-5xl">{word}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* What Loumilab does */}
    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>What we do</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            Four disciplines, one team.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Strategy through security — handled by the same senior team, without hand-offs between agencies.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {capabilities.map((c, i) => (
            <Reveal key={c.label} delay={i * 90}>
              <CapabilityCard {...c} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-12">
          <Link to="/services" className="inline-flex items-center gap-2 font-display text-sm font-semibold hover:text-accent">
            See all services <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>

    {/* Built by Loumilab */}
    <section className="section-padding border-t border-border">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>Ecosystem</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            We don&apos;t just build technology for clients. We build our own.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {productGroups.flatMap((g) => g.items).map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <ProductCard product={p} className="h-full" />
            </Reveal>
          ))}
          <Reveal delay={180} className="lg:col-span-2">
            <div className="rounded-3xl border border-dashed border-border bg-surface-subtle p-8 lg:p-12">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                What&apos;s next
              </span>
              <p className="mt-3 font-display text-xl font-semibold lg:text-2xl">We&apos;re always building.</p>
              <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                New Loumilab products and companies are in development. When they&apos;re ready, they&apos;ll show up here.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>

    {/* Technology philosophy */}
    <section className="section-padding border-t border-border bg-primary text-primary-foreground">
      <div className="section-container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-hero text-4xl font-semibold leading-tight tracking-[-0.03em] lg:text-6xl">
            Technology should solve something.
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-primary-foreground/70">
            Not impress in a deck. Every product we design, build, and secure exists to remove friction,
            protect value, or unlock growth — otherwise it shouldn&apos;t be built.
          </p>
        </Reveal>
      </div>
    </section>

    {/* About teaser */}
    <section className="section-padding border-t border-border">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow>About Loumilab</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">
              A technology partner and a product builder.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              A small, senior team working across design, engineering, automation, and security. We take on
              client work we believe in and build products we want to exist — with the same standard applied
              to both.
            </p>
            <Link to="/about" className="mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold hover:text-accent">
              More about us <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>

    {/* Conversion */}
    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold leading-tight lg:text-5xl">Have something worth building?</h2>
          <p className="mt-5 text-lg text-muted-foreground">Let&apos;s turn the idea into something real.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/contact">
                Start a Project <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:hello@loumilab.com">Contact Loumilab</a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  </Layout>
);

export default Index;
