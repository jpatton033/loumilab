import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { MoreLink } from "@/components/brand/apple/Tiles";
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
  { src: storeBuilder, alt: "The Loumilab Orders store builder", caption: "Store builder — live in minutes." },
  { src: scLocal, alt: "Loumilab Local business discovery", caption: "Local — free discovery for neighborhood businesses." },
  { src: merchantDash, alt: "The Loumilab Orders merchant dashboard", caption: "One dashboard for every order and payout." },
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


      {/* 1 Cinematic hero — background film, type, and previews that move on their own */}
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-ink text-inverse" aria-labelledby="hero-title">
        <VideoSequence clips={[heroCeramic.url, heroArchitect.url, heroFlorist.url]} poster={archLight} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/30" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" aria-hidden />
        <div className="section-container relative grid min-h-[calc(100svh-4rem)] items-center gap-10 py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h1 id="hero-title" className="font-hero text-[3.2rem] font-bold leading-[0.92] tracking-[-0.05em] text-inverse sm:text-[5rem] lg:text-[6.2rem]">
              We build what's next.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-inverse/80 lg:text-xl">
              Thoughtful technology, distinctive digital experiences, and software built for what's next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90"><Link to="/services">Explore Our Solutions</Link></Button>
              <Button size="lg" variant="outline" asChild className="border-inverse/40 bg-transparent text-inverse hover:bg-inverse/10 hover:text-inverse"><a href="#work-gallery">See What We Build</a></Button>
            </div>
          </div>
          <div className="relative h-[340px] sm:h-[460px] lg:col-span-7 lg:h-[560px]">
            <PreviewScenes scenes={heroScenes} />
          </div>
        </div>
      </section>

      {/* 2 What we build — a different composition per area */}
      <section className="bg-ink py-24 text-inverse lg:py-32" aria-labelledby="build-title">
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


      {/* 3 Statement — timed crossfade */}
      <section className="section-container py-20 lg:py-28" aria-label="Design. Build. Innovate. Secure.">
        <TimedCrossfade scenes={statement} className="h-[78vh] min-h-[520px] rounded-[2rem] bg-ink" />
      </section>

      {/* 4 Orders & Local (dark) — layered stack */}
      <section className="film-grain overflow-hidden bg-ink py-24 text-inverse lg:py-32" aria-labelledby="products-title">
        <div className="section-container grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inverse-muted">Loumilab Products</p>
            <h2 id="products-title" className="mt-4 font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">Less managing. More business.</h2>
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
            <h2 id="reading-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Ideas worth reading.</h2>
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
