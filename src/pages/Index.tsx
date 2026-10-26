import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import ArticleCard from "@/components/kc/ArticleCard";
import { MoreLink, TileActions } from "@/components/brand/apple/Tiles";
import { Button } from "@/components/ui/button";
import { usePublishedArticles } from "@/lib/kc/queries";
import PhoneFrame from "@/components/orders/PhoneFrame";
import StorefrontScreen from "@/components/orders/StorefrontScreen";
import { demoStorefront } from "@/data/orders/storefronts";
import { ORDERS_CTA } from "@/data/orders/cta";
import { servicePages } from "@/data/services";
import heroBuild from "@/assets/people/studio/hero-build.jpg";
import market from "@/assets/people/local/market.jpg";
import officeReview from "@/assets/people/email/office-review.jpg";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Loumilab",
  url: "https://loumilab.com",
  email: "hello@loumilab.com",
  description: "Loumilab designs, builds, and manages digital products and technology solutions that help businesses launch, operate, and grow.",
  subOrganization: [{ "@type": "Organization", name: "Vurtti", url: "https://www.vurttidocs.com" }],
  owns: [
    { "@type": "Product", name: "Loumilab Orders", url: "https://loumilab.com/orders" },
    { "@type": "Product", name: "Loumilab Local", url: "https://loumilab.com/orders/local" },
  ],
};

const pathways = [
  { title: "Technology Studio", body: "Websites, custom software, AI automation, and cybersecurity solutions designed around business needs.", cta: "Explore Studio Services", to: "/services" },
  { title: "Loumilab Products", body: "Purpose-built digital products that help businesses sell, operate, and connect with customers.", cta: "Explore Products", to: "/products" },
  { title: "Managed Business Technology", body: "Professional setup, configuration, and management of essential business technology.", cta: "Explore Managed Services", to: "/services/business-email" },
];

const studio = servicePages.filter((s) => s.group === "Technology Studio");

const Index = () => {
  const { data: articles = [] } = usePublishedArticles({ limit: 3 });

  return (
    <Layout>
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab designs, builds, and manages digital products and technology solutions — websites, custom software, AI automation, cybersecurity and business email — that help businesses grow."
        path="/"
        jsonLd={homeJsonLd}
      />

      {/* 1 Hero */}
      <section className="overflow-hidden pt-10 lg:pt-16">
        <div className="section-container text-center">
          <h1 className="mx-auto font-headline text-[2.5rem] font-medium leading-[1.04] tracking-[-0.035em] text-foreground sm:text-[3.5rem] xl:text-[4.5rem]">
            We build <br className="xl:hidden" />what's next.
          </h1>
          <p className="mx-auto mt-6 max-w-[40rem] text-lg leading-relaxed text-muted-foreground text-balance lg:text-xl">
            Loumilab designs, builds, and manages digital products and technology solutions that help businesses launch, operate, and grow.
          </p>
          <div>
            <TileActions primary={{ label: "Explore Solutions", to: "/services" }} secondary={{ label: "Start a Project", to: "/contact" }} className="mt-8" />
          </div>
        </div>
        <div className="section-container mt-14 lg:mt-20">
          <div className="photo-frame relative aspect-[4/5] sm:aspect-[16/8]">
            <img src={heroBuild} alt="A small product team building something together around a table of laptops and sketches" width={1600} height={900} fetchPriority="high" decoding="async" sizes="(min-width: 1280px) 1200px, 100vw" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* 2 Pathways */}
      <section className="section-container py-20 lg:py-28" aria-label="What Loumilab does">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {pathways.map((p, i) => (
            <Reveal key={p.title} delay={i * 80} className="flex flex-col border-t border-foreground/80 pt-6">
              <h2 className="font-display text-2xl font-semibold tracking-tight">{p.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{p.body}</p>
              <Link to={p.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline underline-offset-4">
                {p.cta} <ArrowRight size={14} aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3 Products (dark) */}
      <section className="bg-surface-inverse py-20 text-inverse lg:py-28" aria-labelledby="products-title">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-glow">Loumilab Products</p>
          <h2 id="products-title" className="mt-4 max-w-3xl font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Less managing. More business.</h2>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-semibold">Loumilab Orders</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-inverse-muted">
                A storefront that adapts to your industry — food, baking, services and more — with every order in one dashboard. Build and preview your store before you sign up.
              </p>
              <p className="mt-4 font-display font-semibold text-inverse">Transparent. First and Always.</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to={ORDERS_CTA.href}>Build Your Store</Link></Button>
                <Link to="/orders" className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">See How It Works</Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-[280px] text-foreground"><PhoneFrame label="Example storefront in Loumilab Orders"><StorefrontScreen store={demoStorefront} highlightIndex={0} /></PhoneFrame></div>
            </div>
          </div>

          <div className="mt-20 grid items-center gap-12 border-t border-inverse/15 pt-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 overflow-hidden rounded-3xl">
              <img src={market} alt="Neighbors shopping at a busy outdoor farmers' market" width={1200} height={900} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="font-display text-3xl font-semibold">Loumilab Local</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-inverse-muted">
                Free discovery for home chefs, bakers and neighborhood favorites. Customers find you; listing your business costs nothing.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button size="lg" variant="outline" asChild className="border-inverse/40 bg-transparent text-inverse hover:bg-inverse/10 hover:text-inverse"><Link to="/orders/local">Explore Local</Link></Button>
                <Link to="/orders/local/join" className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">List Your Business</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Studio services */}
      <section className="section-container py-20 lg:py-28" aria-labelledby="studio-title">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="studio-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Technology Studio.</h2>
          <MoreLink to="/services">All solutions</MoreLink>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studio.map((s) => (
            <Link key={s.slug} to={`/services/${s.slug}`} className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <img src={s.image} alt="" width={800} height={600} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="p-6">
                <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.lede}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5 Managed */}
      <section className="border-y border-border bg-surface-subtle py-20 lg:py-28">
        <div className="section-container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Managed Business Technology</p>
            <h2 className="mt-4 font-hero text-4xl font-semibold tracking-tight lg:text-5xl">Business email and domains, handled.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              We set up and support professional email and domains with established providers like Google Workspace, Microsoft 365 and Zoho — configured, secured and handed over in your name.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button size="lg" asChild><Link to="/services/business-email">Explore Managed Services</Link></Button>
              <Link to="/services/domains" className="text-sm font-semibold underline-offset-4 hover:text-accent hover:underline">Domain setup</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl">
            <img src={officeReview} alt="A business owner reviewing email setup details at her desk" width={1200} height={900} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </section>

      {/* 6 Resources */}
      <section className="section-container py-20 lg:py-28" aria-labelledby="resources-title">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="resources-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Resources and insights.</h2>
          <MoreLink to="/resources">Visit Resources</MoreLink>
        </Reveal>
        {articles.length > 0 && <div className="mt-10 grid gap-5 md:grid-cols-3">{articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>}
        <div className="mt-10 grid gap-5">
          <Link to="/orders/tools" className="rounded-3xl border border-border p-8 transition-colors hover:border-accent/50">
            <h3 className="font-display text-xl font-semibold">Free Business Tools</h3>
            <p className="mt-2 text-muted-foreground">Price your products with confidence. No sign-up needed.</p>
          </Link>
        </div>
      </section>

      {/* 7 Closing (dark) */}
      <section className="section-container pb-24">
        <div className="rounded-[2rem] bg-surface-inverse px-6 py-20 text-center text-inverse sm:px-12 lg:py-24">
          <h2 className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Have something in mind? Let's build it.</h2>
          <Button size="lg" asChild className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/contact">Start a Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
