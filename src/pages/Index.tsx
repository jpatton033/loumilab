import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import ArticleCard from "@/components/kc/ArticleCard";
import { MoreLink, TileActions } from "@/components/brand/apple/Tiles";
import { Button } from "@/components/ui/button";
import { usePublishedArticles } from "@/lib/kc/queries";
import OrdersShowcase from "@/components/orders/OrdersShowcase";
import { ORDERS_CTA } from "@/data/orders/cta";
import { servicePages } from "@/data/services";
import studioTable from "@/assets/story/studio-table.jpg";
import designImg from "@/assets/story/design.jpg";
import buildImg from "@/assets/story/build.jpg";
import innovateImg from "@/assets/story/innovate.jpg";
import secureImg from "@/assets/story/secure.jpg";
import { ChapterSequence, UnmaskImage, useDrift, type Chapter } from "@/components/brand/story/FieldNotes";
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

const chapters: Chapter[] = [
  { word: "Design", line: "We start with paper, people and the problem — then shape clear, considered experiences.", image: designImg, alt: "Hands sketching interface layouts in pencil on cream paper" },
  { word: "Build", line: "Fast, dependable websites and software, built carefully and handed over in your name.", image: buildImg, alt: "A developer working on a laptop at a wooden desk by lamplight" },
  { word: "Innovate", line: "Products like Loumilab Orders help small businesses sell to their own customers.", image: innovateImg, alt: "A bakery owner arranging fresh loaves beside a tablet showing orders" },
  { word: "Secure", line: "Security is part of every build, not an add-on at the end.", image: secureImg, alt: "A brass padlock and key resting on a green leather notebook" },
];

const studio = servicePages.filter((s) => s.group === "Technology Studio");

const Index = () => {
  const { data: articles = [] } = usePublishedArticles({ limit: 3 });
  const drift = useDrift<HTMLImageElement>(28);

  return (
    <Layout>
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab designs, builds, and manages digital products and technology solutions — websites, custom software, AI automation, cybersecurity and business email — that help businesses grow."
        path="/"
        jsonLd={homeJsonLd}
      />

      {/* 1 Hero — headline, then an image that unmasks */}
      <section className="paper-grain overflow-hidden pt-12 lg:pt-20">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Loumilab · Technology Studio</p>
          <h1 className="mt-6 max-w-5xl font-hero text-[3rem] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-[4.75rem] xl:text-[6.5rem]">
            We build what's next<span className="text-accent">.</span>
          </h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
              Loumilab designs, builds, and manages digital products and technology solutions that help businesses launch, operate, and grow.
            </p>
            <TileActions primary={{ label: "Explore Solutions", to: "/services" }} secondary={{ label: "Start a Project", to: "/contact" }} className="!mt-0 lg:justify-end" />
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[96rem] px-3 sm:px-6 lg:mt-16">
          <UnmaskImage src={studioTable} alt="A warm studio table with sketchbooks, wireframes, a laptop and an olive branch in afternoon light" width={1920} height={1088} fetchPriority="high" decoding="async" className="aspect-[4/5] sm:aspect-[16/8]" />
        </div>
      </section>

      {/* 2 Three ways we help — asymmetric spread */}
      <section className="section-container py-24 lg:py-36" aria-labelledby="ways-title">
        <Reveal><h2 id="ways-title" className="max-w-3xl font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Three ways we help.</h2></Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-12">
          {pathways.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className={`flex flex-col border-t border-foreground/70 pt-6 ${i === 0 ? "lg:col-span-6" : i === 1 ? "lg:col-span-4 lg:col-start-8 lg:mt-24" : "lg:col-span-5 lg:col-start-3"}`}>
              <span className="font-hero text-sm font-semibold text-olive">0{i + 1}</span>
              <h3 className={`mt-3 font-hero font-semibold tracking-tight ${i === 0 ? "text-3xl lg:text-5xl" : "text-2xl lg:text-3xl"}`}>{p.title}</h3>
              <p className="mt-4 max-w-md flex-1 text-lg leading-relaxed text-muted-foreground">{p.body}</p>
              <Link to={p.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">
                {p.cta} <ArrowRight size={14} aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 2b Chapters — pinned scroll sequence */}
      <section aria-labelledby="chapters-title" className="border-t border-border bg-secondary/60">
        <h2 id="chapters-title" className="sr-only">Design. Build. Innovate. Secure.</h2>
        <ul className="sr-only">{chapters.map((c) => <li key={c.word}>{c.word}: {c.line}</li>)}</ul>
        <ChapterSequence chapters={chapters} />
      </section>

      {/* 3 Products (dark) */}
      <section className="bg-surface-inverse py-20 text-inverse lg:py-28" aria-labelledby="products-title">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sand">Loumilab Products</p>
          <h2 id="products-title" className="mt-4 max-w-3xl font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">Less managing. More business.</h2>

          <div className="mt-14"><OrdersShowcase /></div>

          <div className="mt-20 grid items-center gap-12 border-t border-inverse/15 pt-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 overflow-hidden rounded-3xl">
              <img ref={drift} src={market} alt="Neighbors shopping at a busy outdoor farmers' market" width={1200} height={900} loading="lazy" className="aspect-[4/3] w-full scale-110 object-cover will-change-transform" />
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="font-display text-3xl font-semibold text-inverse">Loumilab Local</h3>
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
      <section className="border-y border-border bg-secondary/70 py-20 lg:py-28">
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
        <div className="paper-grain rounded-[2rem] bg-surface-inverse px-6 py-20 text-center text-inverse sm:px-12 lg:py-24">
          <h2 className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight text-inverse sm:text-5xl lg:text-6xl">Have something in mind? Let's build it.</h2>
          <Button size="lg" asChild className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/contact">Start a Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
