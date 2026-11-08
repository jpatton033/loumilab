import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { MoreLink } from "@/components/brand/apple/Tiles";
import { usePublishedArticles } from "@/lib/kc/queries";
import { usePublishedIssues } from "@/lib/thedot/queries";
import { ORDERS_CTA } from "@/data/orders/cta";
import { AutoMarquee, CinematicGallery, type CinematicItem, LayeredStack, LoopVideo, TimedCrossfade, type Frame } from "@/components/brand/story/Horizontal";
import archVideo from "@/assets/video/home/arch-light.mp4.asset.json";
import sketchVideo from "@/assets/video/home/sketch-layout.mp4.asset.json";
import archLight from "@/assets/story/home/arch-light.jpg";
import sculptureDot from "@/assets/story/home/sculpture-dot.jpg";
import layoutsHands from "@/assets/story/home/layouts-hands.jpg";
import facadeGrid from "@/assets/story/home/facade-grid.jpg";
import floristOrder from "@/assets/story/home/florist-order.jpg";
import storeBuilder from "@/assets/orders/screens/store-builder.jpg";
import merchantDash from "@/assets/orders/screens/merchant-dashboard.jpg";
import market from "@/assets/people/local/market.jpg";
import engineer from "@/assets/people/studio/engineer.jpg";
import scOrders from "@/assets/story/screens/orders.jpg";
import scLocal from "@/assets/story/screens/local.jpg";
import scResources from "@/assets/story/screens/resources.jpg";
import scDot from "@/assets/story/screens/thedot.jpg";
import scServices from "@/assets/story/screens/services.jpg";
import scPricing from "@/assets/story/screens/pricing.jpg";
import scWorkflow from "@/assets/story/screens/workflow.jpg";
import scEmail from "@/assets/story/screens/email.jpg";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Loumilab",
  url: "https://loumilab.com",
  email: "hello@loumilab.com",
  description: "Loumilab designs, builds, and manages digital products and technology solutions that help businesses launch, operate, and grow.",
  owns: [
    { "@type": "Product", name: "Loumilab Orders", url: "https://loumilab.com/orders" },
    { "@type": "Product", name: "Loumilab Local", url: "https://loumilab.com/orders/local" },
  ],
};

__DATA__

const statement = [
  { word: "Design", line: "Clear, considered experiences — shaped with people, not just pixels.", media: <LoopVideo src={sketchVideo.url} poster={layoutsHands} className="h-full w-full object-cover" /> },
  { word: "Build", line: "Fast, dependable websites and software, handed over in your name.", media: <img src={facadeGrid} alt="" loading="lazy" className="h-full w-full object-cover" /> },
  { word: "Innovate", line: "Products like Loumilab Orders help small businesses sell directly.", media: <img src={floristOrder} alt="" loading="lazy" className="h-full w-full object-cover" /> },
  { word: "Secure", line: "Security is part of every build, not an add-on at the end.", media: <LoopVideo src={archVideo.url} poster={archLight} className="h-full w-full object-cover" /> },
];

const productStack: Frame[] = [
  { src: storeBuilder, alt: "The Loumilab Orders store builder", caption: "Store builder — live in minutes." },
  { src: scLocal, alt: "Loumilab Local business discovery", caption: "Local — free discovery for neighborhood businesses." },
  { src: merchantDash, alt: "The Loumilab Orders merchant dashboard", caption: "One dashboard for every order and payout." },
  { src: market, alt: "Neighbors shopping at an outdoor market", caption: "Built for the businesses on your street." },
  { src: scPricing, alt: "Orders progressive pricing", caption: "Fees that go down as you grow." },
];

const Shot = ({ f, dark }: { f: Frame; dark?: boolean }) => (
  <div className={`w-[72vw] shrink-0 overflow-hidden rounded-2xl border sm:w-[38vw] lg:w-[26vw] ${dark ? "border-inverse/15" : "border-border"}`}>
    <img src={f.src} alt={f.alt} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
  </div>
);

const Index = () => {
  const { data: articles = [] } = usePublishedArticles({ limit: 6 });
  const { data: issues = [] } = usePublishedIssues(4);

  const reading = [
    ...articles.map((a) => ({ key: `a-${a.id}`, to: `/resources/${a.kc_sections?.slug ?? "articles"}/${a.slug}`, kind: "Knowledge Center", title: a.title, body: a.summary, img: a.hero_image_url })),
    ...issues.map((i) => ({ key: `d-${i.id}`, to: `/the-dot/${i.slug}`, kind: `The Dot. · Issue ${String(i.issue_number).padStart(3, "0")}`, title: i.title, body: i.subtitle, img: i.cover_image_url })),
  ];

  return (
    <Layout>
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab designs, builds, and manages digital products and technology solutions — websites, custom software, AI automation, cybersecurity and business email — that help businesses grow."
        path="/"
        jsonLd={homeJsonLd}
      />

__HERO__

      {/* 3 Statement — timed crossfade */}
      <section className="section-container py-20 lg:py-28" aria-label="Design. Build. Innovate. Secure.">
        <TimedCrossfade scenes={statement} className="h-[78vh] min-h-[520px] rounded-[2rem] bg-ink" />
      </section>

      {/* 4 Orders & Local (dark) — layered stack */}
      <section className="film-grain overflow-hidden bg-ink py-24 text-inverse lg:py-32" aria-labelledby="products-title">
        <div className="section-container grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inverse-muted">Loumilab Products</p>
            <h2 id="products-title" className="mt-4 font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">Less managing. <span className="font-serif font-normal italic">More business.</span></h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-inverse-muted">Orders gives you your own storefront and dashboard. Local helps neighbors find you — free.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90"><Link to={ORDERS_CTA.href}>{ORDERS_CTA.label}</Link></Button>
              <Link to="/orders/local" className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">Explore Local</Link>
            </div>
          </div>
          <LayeredStack frames={productStack} className="lg:col-span-7" />
        </div>
      </section>

      {/* 5 Knowledge Center & The Dot. — editorial drift */}
      {reading.length > 0 && (
        <section className="py-20 lg:py-28" aria-labelledby="reading-title">
          <div className="section-container flex flex-wrap items-end justify-between gap-4">
            <h2 id="reading-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Ideas <span className="font-serif font-normal italic">worth reading</span><span className="text-dot">.</span></h2>
            <div className="flex gap-6"><MoreLink to="/resources">Knowledge Center</MoreLink><MoreLink to="/the-dot">The Dot.</MoreLink></div>
          </div>
          <AutoMarquee
            className="mt-12"
            label="Latest articles and issues"
            duration={Math.max(40, reading.length * 9)}
            items={reading.map((r) => (
              <Link key={r.key} to={r.to} className="group w-[78vw] shrink-0 sm:w-[44vw] lg:w-[28vw] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl">
                <div className="overflow-hidden rounded-3xl bg-secondary">
                  {r.img ? <img src={r.img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div className="aspect-[4/3] w-full" />}
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{r.kind}</p>
                <h3 className="mt-2 font-display text-xl font-semibold leading-snug">{r.title}</h3>
                {r.body && <p className="mt-2 line-clamp-2 text-muted-foreground">{r.body}</p>}
              </Link>
            ))}
          />
        </section>
      )}

      {/* 6 Closing (dark) with looping clip */}
      <section className="relative overflow-hidden bg-ink text-inverse" aria-labelledby="close-title">
        <LoopVideo src={archVideo.url} poster={archLight} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="section-container relative py-28 text-center lg:py-40">
          <h2 id="close-title" className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight text-inverse sm:text-5xl lg:text-7xl">Have something in mind? <span className="font-serif font-normal italic">Let's build it.</span></h2>
          <Button size="lg" asChild className="mt-10 bg-background text-foreground hover:bg-background/90"><Link to="/contact">Start a Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
