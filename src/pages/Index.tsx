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

/* Opening band: mixed photo, video and real screens, varied sizes */
type Tile = { kind: "img" | "video"; src: string; alt: string; w: string; poster?: string; offset?: string };
const openingTiles: Tile[] = [
  { kind: "video", src: archVideo.url, poster: archLight, alt: "", w: "w-[70vw] sm:w-[36vw] lg:w-[30vw]", offset: "mt-10" },
  { kind: "img", src: scOrders, alt: "The Loumilab Orders page", w: "w-[60vw] sm:w-[30vw] lg:w-[24vw]" },
  { kind: "img", src: sculptureDot, alt: "White sculptural forms beside a small blue sphere", w: "w-[46vw] sm:w-[20vw] lg:w-[16vw]", offset: "mt-20" },
  { kind: "video", src: sketchVideo.url, poster: layoutsHands, alt: "", w: "w-[66vw] sm:w-[34vw] lg:w-[28vw]" },
  { kind: "img", src: scLocal, alt: "The Loumilab Local discovery page", w: "w-[60vw] sm:w-[30vw] lg:w-[24vw]", offset: "mt-14" },
  { kind: "img", src: facadeGrid, alt: "A glass building facade at night with a grid of lit windows", w: "w-[46vw] sm:w-[20vw] lg:w-[18vw]" },
];

const lanes: { name: string; to: string; line: string; frames: Frame[]; duration: number }[] = [
  { name: "Websites", to: "/services/website-development", line: "Fast, clear sites people enjoy using.", duration: 34, frames: [
    { src: scOrders, alt: "Loumilab Orders website" }, { src: scLocal, alt: "Loumilab Local website" }, { src: scResources, alt: "Loumilab Knowledge Center" }, { src: scEmail, alt: "Business Email service page" }, { src: scServices, alt: "Loumilab Solutions page" },
  ] },
  { name: "Custom software", to: "/services/custom-software", line: "Tools shaped around how you work.", duration: 42, frames: [
    { src: storeBuilder, alt: "The Orders store builder" }, { src: merchantDash, alt: "The Orders merchant dashboard" }, { src: scPricing, alt: "Orders pricing calculator" }, { src: layoutsHands, alt: "Interface layouts arranged on a table" },
  ] },
  { name: "AI & automation", to: "/services/ai-automation", line: "AI when valuable. Software when sufficient.", duration: 30, frames: [
    { src: scWorkflow, alt: "Workflow Optimization page" }, { src: engineer, alt: "An engineer reviewing an automated workflow" }, { src: sculptureDot, alt: "Sculptural forms with a blue sphere" }, { src: scDot, alt: "The Dot. newsletter" },
  ] },
  { name: "Cybersecurity", to: "/services/cybersecurity", line: "Security built in from the first line.", duration: 38, frames: [
    { src: facadeGrid, alt: "A lit glass facade at night" }, { src: archLight, alt: "A staircase cut by raking light" }, { src: scEmail, alt: "Secured business email setup" }, { src: merchantDash, alt: "Protected merchant dashboard" },
  ] },
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

      {/* 1 Opening — headline over an always-moving band */}
      <section className="relative overflow-hidden pb-16 pt-16 lg:pb-24 lg:pt-24" aria-labelledby="hero-title">
        <div className="section-container relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Loumilab · Technology Studio</p>
          <h1 id="hero-title" className="mt-5 font-hero text-[3.8rem] font-semibold leading-[0.88] tracking-[-0.055em] sm:text-[6.5rem] lg:text-[9rem] xl:text-[10.5rem]">
            We build <span className="font-serif font-normal italic tracking-[-0.02em]">what's</span><br />next<span className="text-dot">.</span>
          </h1>
        </div>
        <div className="relative -mt-6 lg:-mt-16">
          <AutoMarquee
            label="Loumilab work and imagery"
            duration={36}
            gap="gap-4 lg:gap-6"
            items={openingTiles.map((t) => (
              <div key={t.src} className={`${t.w} ${t.offset ?? ""} shrink-0 overflow-hidden rounded-3xl bg-secondary`}>
                {t.kind === "video"
                  ? <LoopVideo src={t.src} poster={t.poster} className="aspect-[4/5] h-full w-full object-cover" />
                  : <img src={t.src} alt={t.alt} loading="eager" className="aspect-[4/5] w-full object-cover object-top" />}
              </div>
            ))}
          />
        </div>
        <div className="section-container mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Loumilab designs, builds, and manages digital products and technology solutions that help businesses launch, operate, and grow.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Button size="lg" asChild><Link to="/services">Explore Solutions</Link></Button>
            <Link to="/contact" className="text-sm font-semibold underline-offset-4 hover:underline">Start a Project</Link>
          </div>
        </div>
      </section>

      {/* 2 What we build — four moving lanes (dark) */}
      <section className="film-grain bg-ink py-24 text-inverse lg:py-32" aria-labelledby="build-title">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-inverse-muted">Technology Studio</p>
          <h2 id="build-title" className="mt-4 max-w-3xl font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-6xl">What we <span className="font-serif font-normal italic">build</span><span className="text-dot">.</span></h2>
        </div>
        <div className="mt-14 space-y-14 lg:space-y-20">
          {lanes.map((l, n) => (
            <div key={l.name} className={n > 1 ? "hidden md:block" : ""}>
              <div className="section-container mb-5 flex flex-wrap items-baseline justify-between gap-3 border-t border-inverse/15 pt-5">
                <h3 className="font-hero text-2xl font-semibold tracking-tight text-inverse lg:text-4xl">{l.name}</h3>
                <p className="text-inverse-muted">{l.line}</p>
                <Link to={l.to} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-inverse underline-offset-4 hover:underline">Learn more <ArrowRight size={14} aria-hidden /></Link>
              </div>
              <AutoMarquee label={`${l.name} previews`} tone="dark" duration={l.duration} showToggle={n === 0} items={l.frames.map((f) => <Shot key={f.src + l.name} f={f} dark />)} />
            </div>
          ))}
          <div className="section-container md:hidden">
            {lanes.slice(2).map((l) => (
              <Link key={l.name} to={l.to} className="flex min-h-11 items-center justify-between border-t border-inverse/15 py-4 font-hero text-xl font-semibold text-inverse">{l.name} <ArrowRight size={16} aria-hidden /></Link>
            ))}
          </div>
        </div>
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
