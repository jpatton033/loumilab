import { Pathways } from "@/components/brand/story/Pathways";
import runBakery from "@/assets/story/run/bakery-packing.jpg";
import runRetail from "@/assets/story/run/retail-counter.jpg";
import runService from "@/assets/story/run/service-work.jpg";
import runPickup from "@/assets/story/run/customer-pickup.jpg";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ToDark } from "@/components/brand/flow/Flow";
import { usePublishedArticles } from "@/lib/kc/queries";
import { usePublishedIssues } from "@/lib/thedot/queries";
import { ORDERS_CTA } from "@/data/orders/cta";
import { AutoMarquee, LayeredStack, LoopVideo, TimedCrossfade, type Frame } from "@/components/brand/story/Horizontal";
import { FloatingGallery, PreviewScenes, VideoSequence, type FloatItem, type Scene } from "@/components/brand/story/Cinematic";
import { MockDashboard, MockSchedule, MockSecurity, MockWorkflow } from "@/components/brand/story/mocks";
import heroCeramic from "@/assets/video/home/hero-ceramic.mp4.asset.json";
import heroArchitect from "@/assets/video/home/hero-architect.mp4.asset.json";
import heroFlorist from "@/assets/video/home/hero-florist.mp4.asset.json";
import siteHotel from "@/assets/story/sites/hotel.jpg";
import siteArch from "@/assets/story/sites/architecture.jpg";
import siteFlorist from "@/assets/story/sites/florist.jpg";
import siteLaw from "@/assets/story/sites/law.jpg";
import siteFashion from "@/assets/story/sites/fashion.jpg";
import siteMagazine from "@/assets/story/sites/magazine.jpg";
import archVideo from "@/assets/video/home/arch-light.mp4.asset.json";
import sketchVideo from "@/assets/video/home/sketch-layout.mp4.asset.json";
import archLight from "@/assets/story/home/arch-light.jpg";
import layoutsHands from "@/assets/story/home/layouts-hands.jpg";
import facadeGrid from "@/assets/story/home/facade-grid.jpg";
import floristOrder from "@/assets/story/home/florist-order.jpg";
import storeBuilder from "@/assets/orders/screens/store-builder.jpg";
import merchantDash from "@/assets/orders/screens/merchant-dashboard.jpg";
import market from "@/assets/people/local/market.jpg";
import scLocal from "@/assets/story/screens/local.jpg";

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

const Pic = ({ src, alt, aspect = "aspect-[16/10]" }: { src: string; alt: string; aspect?: string }) => (
  <div className="overflow-hidden rounded-xl border border-inverse/15 bg-ink shadow-2xl">
    <img src={src} alt={alt} loading="lazy" className={`w-full object-cover object-top ${aspect}`} />
  </div>
);

const heroScenes: Scene[] = [
  { name: "sites-a", panels: [
    { label: "Hospitality website", pos: "left-0 top-[8%] w-[74%]", tilt: -1, node: <Pic src={siteHotel} alt="A boutique hotel website design" /> },
    { label: "Architecture studio", pos: "right-0 top-[46%] w-[50%]", tilt: 1.5, node: <Pic src={siteArch} alt="An architecture studio website design" /> },
    { label: "Florist shop", pos: "right-[4%] top-0 w-[24%]", tilt: 2, node: <Pic src={siteFlorist} alt="A florist online shop design" aspect="aspect-[4/5]" /> },
  ] },
  { name: "sites-b", panels: [
    { label: "Editorial magazine", pos: "right-0 top-[4%] w-[70%]", tilt: 1, node: <Pic src={siteMagazine} alt="An editorial magazine website design" /> },
    { label: "Fashion retail", pos: "left-[2%] top-[22%] w-[28%]", tilt: -2, node: <Pic src={siteFashion} alt="A fashion retail website design" aspect="aspect-[4/5]" /> },
    { label: "Law firm", pos: "right-[10%] top-[52%] w-[48%]", tilt: -1, node: <Pic src={siteLaw} alt="A law firm website design" /> },
  ] },
  { name: "software", panels: [
    { label: "Operations dashboard", pos: "left-0 top-[6%] w-[64%]", tilt: -1, node: <MockDashboard /> },
    { label: "Scheduling", pos: "right-0 top-0 w-[42%]", tilt: 1.5, node: <MockSchedule /> },
    { label: "Workflow automation", pos: "right-[6%] top-[60%] w-[70%]", tilt: 0.5, node: <MockWorkflow /> },
  ] },
  { name: "products", panels: [
    { label: "Loumilab Orders — dashboard", pos: "left-0 top-[4%] w-[70%]", tilt: -1, node: <Pic src={merchantDash} alt="The Loumilab Orders merchant dashboard" /> },
    { label: "Loumilab Orders — store builder", pos: "right-0 top-[40%] w-[52%]", tilt: 1.5, node: <Pic src={storeBuilder} alt="The Loumilab Orders store builder" /> },
    { label: "Loumilab Local", pos: "right-[6%] top-0 w-[26%]", tilt: 2, node: <Pic src={scLocal} alt="A Loumilab Local listing" aspect="aspect-[4/5]" /> },
  ] },
];

const floatItems: FloatItem[] = [
  { src: siteArch, label: "Architecture studio", to: "/services/website-development", pos: "left-[4%] top-[4%]", w: "w-[46%] sm:w-[30%]", depth: 0 },
  { src: siteFlorist, label: "Florist shop", to: "/services/website-development", pos: "left-[40%] top-[2%]", w: "w-[22%] sm:w-[14%]", depth: 2, aspect: "aspect-[4/5]" },
  { src: merchantDash, label: "Loumilab Orders", to: "/orders", pos: "right-[4%] top-[8%]", w: "w-[40%] sm:w-[26%]", depth: 1 },
  { node: <MockDashboard />, label: "Custom software", to: "/services/custom-software", pos: "left-[28%] top-[30%]", w: "w-[58%] sm:w-[36%]", depth: 0 },
  { src: siteFashion, label: "Fashion retail", to: "/services/website-development", pos: "left-[2%] top-[38%]", w: "w-[24%] sm:w-[15%]", depth: 1, aspect: "aspect-[4/5]" },
  { src: siteMagazine, label: "Editorial magazine", to: "/services/website-development", pos: "right-[2%] top-[42%]", w: "w-[38%] sm:w-[24%]", depth: 2 },
  { node: <MockSecurity />, label: "Cybersecurity", to: "/services/cybersecurity", pos: "left-[6%] top-[66%]", w: "w-[54%] sm:w-[30%]", depth: 1 },
  { src: siteHotel, label: "Hospitality website", to: "/services/website-development", pos: "left-[42%] top-[70%]", w: "w-[44%] sm:w-[28%]", depth: 0 },
  { src: scLocal, label: "Loumilab Local", to: "/orders/local", pos: "right-[3%] top-[72%]", w: "w-[22%] sm:w-[14%]", depth: 2, aspect: "aspect-[4/5]" },
  { src: siteLaw, label: "Law firm", to: "/services/website-development", pos: "left-[60%] top-[22%]", w: "w-[30%] sm:w-[18%]", depth: 2 },
];


const statement = [
  { word: "Design", line: "Clear, considered experiences — shaped with people, not just pixels.", media: <LoopVideo src={sketchVideo.url} poster={layoutsHands} className="h-full w-full object-cover" /> },
  { word: "Build", line: "Fast, dependable websites and software, handed over in your name.", media: <img src={facadeGrid} alt="" loading="lazy" className="h-full w-full object-cover" /> },
  { word: "Innovate", line: "Products like Loumilab Orders help small businesses sell directly.", media: <img src={floristOrder} alt="" loading="lazy" className="h-full w-full object-cover" /> },
  { word: "Secure", line: "Security is part of every build, not an add-on at the end.", media: <LoopVideo src={archVideo.url} poster={archLight} className="h-full w-full object-cover" /> },
];

const productStack: Frame[] = [
  { src: storeBuilder, alt: "The Loumilab Orders store builder", caption: "Store builder — live in minutes.", fit: "contain" },
  { src: scLocal, alt: "Loumilab Local business discovery", caption: "Local — free discovery for neighborhood businesses.", fit: "contain" },
  { src: merchantDash, alt: "The Loumilab Orders merchant dashboard", caption: "One dashboard for every order and payout.", fit: "contain" },
  { src: market, alt: "Neighbors shopping at an outdoor market", caption: "Built for the businesses on your street." },
];

const BuildRow = ({ name, to, line, flip, children }: { name: string; to: string; line: string; flip?: boolean; children: React.ReactNode }) => (
  <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
    <div className={`lg:col-span-4 ${flip ? "lg:order-2" : ""}`}>
      <h3 className="font-hero text-3xl font-bold tracking-tight text-inverse lg:text-5xl">{name}</h3>
      <p className="mt-4 max-w-sm text-lg text-inverse-muted">{line}</p>
      <Link to={to} className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-inverse underline-offset-4 hover:underline">Learn more <ArrowRight size={14} aria-hidden /></Link>
    </div>
    <div className={`lg:col-span-8 ${flip ? "lg:order-1" : ""}`}>{children}</div>
  </div>
);

const Index = () => {
  const { data: articles = [] } = usePublishedArticles({ limit: 6 });
  const { data: issues = [] } = usePublishedIssues(4);

  const reading = [
    ...articles.map((a) => ({ key: `a-${a.id}`, to: `/resources/${a.kc_sections?.slug ?? "articles"}/${a.slug}`, kind: "Knowledge Center", title: a.title, body: a.summary, img: a.hero_image_url })),
    ...issues.map((i) => ({ key: `d-${i.id}`, to: `/the-dot/issue/${i.slug}`, kind: `The Dot. · Issue ${String(i.issue_number).padStart(3, "0")}`, title: i.title, body: i.subtitle, img: i.cover_image_url })),
  ];

  return (
    <Layout>
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab designs, builds, and manages digital products and technology solutions — websites, custom software, AI automation, cybersecurity and business email — that help businesses grow."
        path="/"
        jsonLd={homeJsonLd}
      />


      {/* 1 Full-bleed film hero */}
      <HomeHero> -mt-16 overflow-hidden bg-ink text-inverse lg:-mt-20" aria-labelledby="hero-title">
        <VideoSequence clips={[heroCeramic.url, heroArchitect.url, heroFlorist.url]} poster={archLight} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/35 to-ink/80" aria-hidden />
        <div className="section-container relative flex min-h-[88svh] flex-col items-center justify-center pb-16 pt-32 text-center lg:pt-40">
          <h1 id="hero-title" className="mx-auto max-w-5xl font-hero text-[3.2rem] font-bold leading-[0.95] tracking-[-0.04em] text-inverse sm:text-[5rem] lg:text-[7rem]">
            We build what's next.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-inverse/85 lg:text-xl">
            Thoughtful technology, distinctive digital experiences, and software built for what's next.
          </p>
          <Button size="lg" asChild className="mt-10 bg-background text-foreground hover:bg-background/90"><Link to="/services">Explore Our Solutions</Link></Button>
          <nav aria-label="On this page" className="mt-14 flex flex-wrap justify-center gap-1 rounded-full bg-ink/70 p-1.5">
            {[["What we build", "#build-title"], ["Work", "#work-gallery"], ["Products", "#products-title"], ["Reading", "#reading-title"]].map(([l, h]) => (
              <a key={h} href={h} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-inverse/85 transition-colors hover:bg-inverse/10 hover:text-inverse">{l}</a>
            ))}
          </nav>
        </div>
      </section>

      <Pathways runFrames={[
        { src: runBakery, alt: "A baker packing pastry boxes for orders", caption: "Orders packed and ready" },
        { src: runRetail, alt: "A shopkeeper handing a wrapped purchase to a customer", caption: "Sales at the counter" },
        { src: runService, alt: "A carpenter working in a client's home", caption: "Jobs scheduled and done" },
        { src: runPickup, alt: "An owner handing an order to a customer at the door", caption: "Pickup, on time" },
      ]} />

      {/* Companies */}
      <section className="py-24 lg:py-32" aria-labelledby="companies-title">
        <div className="section-container grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Loumilab Companies</p>
            <h2 id="companies-title" className="mt-4 font-hero text-4xl font-bold tracking-tight lg:text-6xl">Vurtti.</h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">Compliance, documented and under control. A compliance technology platform helping teams organize and maintain the evidence their standards require.</p>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <Button size="lg" asChild><a href="https://www.vurttidocs.com" target="_blank" rel="noopener noreferrer">Visit Vurtti</a></Button>
          </div>
        </div>
      </section>

      <ToDark />

      {/* 2 What we build — a different composition per area */}
      <section className="bg-ink pb-24 pt-8 text-inverse lg:pb-32" aria-labelledby="build-title">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inverse-muted">Technology Studio</p>
          <h2 id="build-title" className="mt-4 max-w-3xl font-hero text-4xl font-bold tracking-tight text-inverse lg:text-6xl">What we build.</h2>

          <div className="mt-20 space-y-28 lg:space-y-36">
            <BuildRow name="Websites" to="/services/website-development" line="Fast, clear sites people enjoy using — for shops, studios, firms and brands.">
              <div className="relative pb-[18%]">
                <Pic src={siteHotel} alt="A boutique hotel website design" />
                <div className="absolute -bottom-2 right-[4%] w-[34%] rotate-2"><Pic src={siteFashion} alt="A fashion retail website design" aspect="aspect-[4/5]" /></div>
                <div className="absolute -bottom-6 left-[8%] w-[40%] -rotate-1"><Pic src={siteArch} alt="An architecture studio website design" /></div>
              </div>
            </BuildRow>
            <BuildRow flip name="Custom software" to="/services/custom-software" line="Dashboards and tools shaped around how your team actually works.">
              <MockDashboard />
            </BuildRow>
            <BuildRow name="AI & automation" to="/services/ai-automation" line="AI when valuable. Software when sufficient. Steps that run themselves.">
              <div className="space-y-4"><MockWorkflow /><MockSchedule className="ml-auto w-[80%]" /></div>
            </BuildRow>
            <BuildRow flip name="Cybersecurity" to="/services/cybersecurity" line="Calm, visible protection for every system you rely on.">
              <MockSecurity />
            </BuildRow>
          </div>
        </div>
      </section>

      {/* 2b Floating gallery */}
      <section id="work-gallery" className="scroll-mt-20 overflow-hidden bg-ink py-20 text-inverse lg:py-28" aria-labelledby="gallery-title">
        <div className="section-container text-center">
          <h2 id="gallery-title" className="font-hero text-4xl font-bold tracking-tight text-inverse lg:text-6xl">A range of work.</h2>
          <p className="mx-auto mt-4 max-w-lg text-inverse-muted">Websites, software and products — point at one to see what it is.</p>
        </div>
        <div className="mt-10"><FloatingGallery items={floatItems} /></div>
      </section>


      {/* 4 Orders & Local (dark) — layered stack */}
      <section className="film-grain overflow-hidden bg-ink py-24 text-inverse lg:py-32" aria-labelledby="products-title">
        <div className="section-container grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inverse-muted">Loumilab Products</p>
            <h2 id="products-title" className="mt-4 font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">Orders & Local.</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-inverse-muted">Orders gives you your own storefront and dashboard. Local helps neighbors find you — free.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90"><Link to={ORDERS_CTA.href}>{ORDERS_CTA.label}</Link></Button>
              <Link to="/orders/local" className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">Explore Local</Link>
            </div>
          </div>
          <LayeredStack frames={productStack} className="lg:col-span-7" />
        </div>
      </section>

      {/* 5 Knowledge Center & The Dot. — calm editorial grid on the dark band */}
      {reading.length > 0 && (
        <section className="bg-ink py-24 text-inverse lg:py-32" aria-labelledby="reading-title">
          <div className="section-container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="reading-title" className="font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">Ideas worth reading.</h2>
              <div className="flex gap-6 text-sm font-semibold">
                <Link to="/resources" className="text-inverse/75 underline-offset-4 hover:text-inverse hover:underline">Knowledge Center</Link>
                <Link to="/the-dot" className="text-inverse/75 underline-offset-4 hover:text-inverse hover:underline">The Dot.</Link>
              </div>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-12">
              {reading.slice(0, 4).map((r, i) => (
                <Link key={r.key} to={r.to} className={`group flex gap-5 rounded-3xl border border-inverse/10 bg-inverse/[0.03] p-6 transition-colors hover:border-inverse/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i === 0 ? "flex-col lg:col-span-6 lg:row-span-3 lg:p-8" : "items-center lg:col-span-6"}`}>
                  {r.img && (
                    <div className={`shrink-0 overflow-hidden rounded-2xl bg-inverse/5 ${i === 0 ? "w-full" : "aspect-video w-32"}`}>
                      <img src={r.img} alt="" loading="lazy" className={`w-full object-contain grayscale contrast-[1.05] brightness-90 transition-[filter] duration-500 group-hover:grayscale-0 ${i === 0 ? "aspect-[16/10]" : "h-full"}`} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-inverse-muted">{r.kind}</p>
                    <h3 className={`mt-2 font-display font-semibold leading-snug text-inverse ${i === 0 ? "text-2xl lg:text-3xl" : "text-lg"}`}>{r.title}</h3>
                    {i === 0 && r.body && <p className="mt-3 line-clamp-3 text-inverse-muted">{r.body}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6 Closing (dark) with looping clip */}
      <section className="relative overflow-hidden bg-ink text-inverse" aria-labelledby="close-title">
        <LoopVideo src={heroArchitect.url} poster={archLight} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="section-container relative py-28 text-center lg:py-40">
          <h2 id="close-title" className="mx-auto max-w-3xl font-hero text-4xl font-semibold tracking-tight text-inverse sm:text-5xl lg:text-7xl">Have something in mind? Let's build it.</h2>
          <Button size="lg" asChild className="mt-10 bg-background text-foreground hover:bg-background/90"><Link to="/contact">Start a Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
