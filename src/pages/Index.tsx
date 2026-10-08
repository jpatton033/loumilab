import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { VurttiLogo } from "@/components/brand/VurttiLogo";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import ArticleCard from "@/components/kc/ArticleCard";
import { PeopleSequence } from "@/components/brand/story";
import { GridTile, MoreLink, ProductTile, Statement, TileActions } from "@/components/brand/apple/Tiles";
import { usePublishedArticles } from "@/lib/kc/queries";
import heroBuild from "@/assets/people/studio/hero-build.jpg";
import designer from "@/assets/people/studio/designer.jpg";
import engineer from "@/assets/people/studio/engineer.jpg";
import collaboration from "@/assets/people/studio/collaboration.jpg";
import studioTeam from "@/assets/people/studio-team.jpg";
import bakerOrders from "@/assets/people/baker-orders.jpg";
import market from "@/assets/people/local/market.jpg";
import homeChef from "@/assets/people/orders/home-chef.jpg";
import reviewingOrders from "@/assets/people/orders/reviewing-orders.jpg";
import handoff from "@/assets/people/orders/handoff.jpg";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Loumilab",
  url: "https://loumilab.com",
  email: "hello@loumilab.com",
  description:
    "Loumilab designs, builds, launches, and secures digital products and technology businesses. Websites, software, AI automation, and cybersecurity.",
  subOrganization: [{ "@type": "Organization", name: "Vurtti", url: "https://www.vurttidocs.com" }],
  owns: [
    { "@type": "Product", name: "Loumilab Orders", url: "https://loumilab.com/orders" },
    { "@type": "Product", name: "Loumilab Local", url: "https://loumilab.com/orders/local" },
  ],
};

const Index = () => {
  const { data: articles = [] } = usePublishedArticles({ limit: 3 });

  return (
    <Layout>
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab is a technology studio that designs, builds, launches and secures digital products for businesses: websites, software, AI automation and cybersecurity."
        path="/"
        jsonLd={homeJsonLd}
      />

      {/* Hero */}
      <section className="overflow-hidden pt-12 lg:pt-16">
        <div className="section-container text-center">
          <p className="font-display text-sm font-semibold tracking-wide text-accent">Loumilab — a technology studio</p>
          <h1 className="mx-auto mt-4 max-w-5xl font-hero text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
            We build what&apos;s next.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70 lg:text-2xl">
            Loumilab designs, builds, launches and secures digital products — for clients and for ourselves.
          </p>
          <TileActions primary={{ label: "Start a project", to: "/contact" }} secondary={{ label: "Explore products", to: "/products" }} className="mt-8" />
        </div>
        <div className="section-container mt-12 lg:mt-16">
          <div className="photo-frame aspect-[4/5] sm:aspect-[16/8]">
            <img src={heroBuild} alt="A small product team building something together around a table of laptops and sketches" width={1600} height={900} fetchPriority="high" decoding="async" sizes="(min-width: 1280px) 1200px, 100vw" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Products */}
      <ProductTile
        className="mt-16 lg:mt-24"
        tone="subtle"
        eyebrow="Loumilab Orders"
        title="Sell anywhere. Take orders in one place."
        line="Your storefront, your orders, your customers — free to start."
        primary={{ label: "Explore Orders", to: "/orders" }}
        secondary={{ label: "See pricing", to: "/orders#pricing" }}
        image={bakerOrders}
        alt="A baker boxing a fresh pastry order with incoming orders on a tablet beside her"
      />
      <ProductTile
        eyebrow="Loumilab Local"
        title="Discover what's cooking near you."
        line="Home chefs, bakers and neighborhood favorites, all in one place."
        primary={{ label: "Explore Local", to: "/orders/local" }}
        secondary={{ label: "List your business", to: "/orders/local/join" }}
        image={market}
        alt="Neighbors shopping at a busy outdoor farmers' market"
      />

      <Statement line="Every product we design, build and secure exists to remove friction, protect value or unlock growth.">
        Technology should move businesses <span className="text-accent">forward.</span>
      </Statement>

      {/* Capabilities grid */}
      <section className="pb-16 lg:pb-24">
        <div className="section-container grid gap-4 md:grid-cols-2">
          <GridTile eyebrow="Design" title="Products people enjoy using." line="Brand-led websites and interfaces built around clarity." image={designer} alt="A designer sketching app screens on a tablet" links={{ primary: { label: "Learn more", to: "/services" } }} />
          <GridTile eyebrow="Build" title="Software that holds up." line="Web apps and platforms that are fast and ready to grow." image={engineer} alt="An engineer reviewing code on two monitors" links={{ primary: { label: "Learn more", to: "/services" } }} />
          <GridTile eyebrow="Innovate" title="New ideas, shipped." line="Automation and AI where it removes real work." image={collaboration} alt="A founder and designer working through ideas at a laptop" links={{ primary: { label: "Learn more", to: "/services" } }} />
          <GridTile eyebrow="Secure" title="Security from day one." line="Secure architecture and reviews, built in — not bolted on." image={studioTeam} alt="The Loumilab team reviewing work together" links={{ primary: { label: "Learn more", to: "/services" }, secondary: { label: "How we work", to: "/how-we-work" } }} />
        </div>
      </section>

      <PeopleSequence
        className="border-t border-border"
        eyebrow="Built around people"
        title="Made for the people who make things."
        items={[
          { src: homeChef, alt: "A home chef cooking in a sunlit kitchen", label: "Makers", note: "Turning a craft into a business." },
          { src: reviewingOrders, alt: "A business owner checking orders on a tablet", label: "Owners", note: "Running the day from one screen." },
          { src: designer, alt: "A designer sketching on a tablet", label: "Creators", note: "Shaping how products feel.", width: 1200, height: 1200 },
          { src: engineer, alt: "An engineer reviewing code", label: "Builders", note: "Making it work, and keeping it safe.", width: 1200, height: 1200 },
          { src: handoff, alt: "A merchant handing an order to a customer", label: "Communities", note: "Where it all comes together." },
        ]}
      />

      {/* Ecosystem */}
      <section className="pb-16 lg:pb-24">
        <div className="section-container grid gap-4 md:grid-cols-2">
          <GridTile eyebrow="A Loumilab company" title="Vurtti" line="Compliance technology for documentation-heavy teams." links={{ primary: { label: "Visit Vurtti", to: "https://www.vurttidocs.com", external: true } }}>
            <div className="mb-10 grid aspect-[4/3] place-items-center rounded-2xl border border-border bg-background">
              <VurttiLogo size="xl" />
            </div>
          </GridTile>
          <GridTile eyebrow="What's next" title="We're always building." line="New products are in the lab. Have an idea worth building with us?" links={{ primary: { label: "Start a project", to: "/contact" }, secondary: { label: "All products", to: "/products" } }}>
            <Link to="/contact" aria-label="Start a project" className="mb-10 grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-accent/40 bg-accent-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span aria-hidden="true" className="font-hero text-6xl font-semibold text-accent">+</span>
            </Link>
          </GridTile>
        </div>
      </section>

      {/* Resources */}
      {articles.length > 0 && (
        <section className="section-padding border-t border-border bg-surface-subtle">
          <div className="section-container">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-hero text-4xl font-semibold tracking-[-0.03em] lg:text-6xl">From Resources.</h2>
              <MoreLink to="/resources">Visit Resources</MoreLink>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* Closing */}
      <Statement line="Let's turn the idea into something real.">Have something worth building?</Statement>
      <div className="-mt-10 pb-24 lg:-mt-16">
        <TileActions primary={{ label: "Start a project", to: "/contact" }} secondary={{ label: "Contact Loumilab", to: "/contact" }} />
      </div>
    </Layout>
  );
};

export default Index;
