import PromoBanner from "@/components/orders/PromoBanner";
import { Link } from "react-router-dom";
import { ORDERS_CTA } from "@/data/orders/cta";
import { trackCtaClick } from "@/lib/tracking";
import {
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  Instagram,
  MonitorSmartphone,
  Smartphone,
  Store,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import LivePreviewPicker from "@/components/orders/LivePreviewPicker";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import PricingTable from "@/components/orders/PricingTable";
import { FeeAnnouncement } from "@/components/orders/ProgressiveFees";
import OrdersShowcase from "@/components/orders/OrdersShowcase";
import OrdersHeroSlideshow from "@/components/orders/OrdersHeroSlideshow";
import { ORDER_STATUSES } from "@/data/orders/dashboard";
import { audiences } from "@/data/orders/audiences";
import { pricingHeading, pricingPlans } from "@/data/orders/pricing";
import { ordersHeroSlides } from "@/data/orders/hero-slides";
import { DotMarker } from "@/components/brand/dot";
import { COMPETITORS } from "@/data/orders/competitors";
import { ScreenFrame } from "@/components/brand/flow/Flow";
import builderShot from "@/assets/orders/screens/store-builder.jpg";
import dashboardShot from "@/assets/orders/screens/merchant-dashboard.jpg";

const steps = [
  {
    num: "01",
    title: "Create your storefront",
    desc: "Add your business name, logo, description, pickup information, and basic settings.",
  },
  {
    num: "02",
    title: "Add what you sell",
    desc: "Create menu items, products, services, pricing, photos, quantities, and availability.",
  },
  {
    num: "03",
    title: "Share your link",
    desc: "Place your Loumilab Orders link in your Instagram bio, Facebook page, TikTok profile, website, text messages, or anywhere else customers find you.",
  },
  {
    num: "04",
    title: "Get paid & manage orders",
    desc: "Customers place their orders online while you receive everything through a centralized dashboard.",
  },
];

const features = [
  { icon: Store, title: "Custom Storefront", desc: "Every business gets its own shareable Loumilab Orders page." },
  { icon: CreditCard, title: "Online Payments", desc: "Architected for secure, provider-handled card payments." },
  { icon: MonitorSmartphone, title: "Order Dashboard", desc: "View and manage every order from one place." },
  { icon: Smartphone, title: "Mobile Management", desc: "Run the whole operation from your phone behind the counter." },
  { icon: Clock, title: "Pickup Options", desc: "Configure pickup instructions and pickup windows." },
  { icon: BarChart3, title: "Sales Analytics", desc: "Simple revenue and order insights, no spreadsheet required." },
];



const ordersJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Loumilab Orders",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Loumilab Orders lets small businesses create a simple storefront, share one link, take orders from social media, accept payments, and manage every order in one dashboard.",
    url: "https://loumilab.com/orders",
    publisher: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
    offers: pricingPlans
      .filter((p) => /^\$\d/.test(p.price))
      .map((p) => ({
        "@type": "Offer",
        name: `${p.name} plan`,
        price: p.price.replace(/[^0-9.]/g, ""),
        priceCurrency: "USD",
        description: [p.description, p.transactionFee].filter(Boolean).join(" "),
        url: "https://loumilab.com/orders/get-started",
      })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Loumilab", item: "https://loumilab.com/" },
      { "@type": "ListItem", position: 2, name: "Orders", item: "https://loumilab.com/orders" },
    ],
  },
];

const Orders = () => {

  return (
    <Layout>
      <SEOHead
        title="Loumilab Orders | Online Ordering for Small Food Businesses"
        description="Create a free storefront, share one link, take orders and payments, and manage everything in one dashboard. Built for home chefs, bakers, pop-ups and small sellers."
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: "Loumilab Orders", path: "/orders" }]}
        path="/orders"
        jsonLd={ordersJsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-14 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden="true" />
        <div className="section-container relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center"><DotMarker /></div>
            <Eyebrow>Loumilab Orders</Eyebrow>
            <h1 className="mt-5 font-hero text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              Your business. Your storefront. Your orders.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Create a simple storefront, share your link, accept orders, and manage everything in one place.
              No complicated e-commerce setup required.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="rounded-full">
                <Link to={ORDERS_CTA.href} className="dot-action" onClick={() => trackCtaClick("hero", ORDERS_CTA.variant)}>
                  {ORDERS_CTA.label} <ArrowRight size={18} />
                </Link>
              </Button>
              <a href="#how-it-works" className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">
                See how it works
              </a>
            </div>
            <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground">{ORDERS_CTA.support}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Already have a store?{" "}
              <Link to="/orders/dashboard" className="underline underline-offset-4 hover:text-foreground">
                Go to dashboard
              </Link>
            </p>
          </div>

          <Reveal className="mx-auto mt-14 hidden max-w-6xl md:block lg:mt-20">
            <ScreenFrame
              src={builderShot}
              label="Loumilab Orders — Store builder"
              alt="The Loumilab Orders store builder: step 1 asks for your industry, with a live phone preview of the storefront beside it."
            />
          </Reveal>
        </div>
      </section>

      {/* Storefront showcase */}
      <section className="bg-surface-inverse py-20 text-inverse lg:py-28" aria-label="Loumilab Orders storefront">
        <div className="section-container">
          <OrdersShowcase ctaLabel={ORDERS_CTA.label} secondary={{ label: "See how it works", to: "#how-it-works" }} onCtaClick={() => trackCtaClick("showcase", ORDERS_CTA.variant)} />
        </div>
      </section>


      <OrdersHeroSlideshow slides={ordersHeroSlides} />

      <PromoBanner surface="homepage" wrapperClassName="section-container pt-8" />

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>{pricingHeading.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">{pricingHeading.title}</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{pricingHeading.subtitle}</p>
          </Reveal>

          <div className="mt-10">
            <FeeAnnouncement />
          </div>
          <div className="mt-14">
            <PricingTable />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{pricingHeading.footnote}</p>
          <Link to="/orders/pricing" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">See how pricing works <ArrowRight size={15} /></Link>
          <ol className="mt-10 flex flex-col gap-3 font-display text-sm sm:flex-row sm:items-center sm:gap-6" aria-label="How a store goes live">
            <li><span className="font-semibold text-foreground">Build</span> <span className="text-muted-foreground">— free, no account</span></li>
            <li aria-hidden="true" className="hidden text-muted-foreground sm:block">→</li>
            <li><span className="font-semibold text-foreground">Save</span> <span className="text-muted-foreground">— create an account</span></li>
            <li aria-hidden="true" className="hidden text-muted-foreground sm:block">→</li>
            <li><span className="font-semibold text-foreground">Publish</span> <span className="text-muted-foreground">— finish payout setup</span></li>
          </ol>
          <Button size="lg" asChild className="mt-8 rounded-full">
            <Link to={ORDERS_CTA.href} className="dot-action" onClick={() => trackCtaClick("pricing", ORDERS_CTA.variant)}>{ORDERS_CTA.label} <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section-padding scroll-mt-24">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
              Four steps from follower to paid order.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal
                key={s.num}
                delay={i * 90}
                className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]"
              >
                <p className="font-hero text-sm font-semibold tracking-[0.2em] text-accent">{s.num}</p>
                <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive storefront demo */}
      <section className="section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Live preview</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
              This is what your customers see.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Pick a business — food, flowers or services. Each is a real storefront layout, running right here.
            </p>
          </Reveal>

          <LivePreviewPicker />
        </div>
      </section>

      {/* Dashboard showcase */}
      <section className="section-padding">
        <div className="section-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Merchant dashboard</Eyebrow>
            <h2 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
              Everything in one place.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Today&apos;s orders, revenue, and what needs attention — on one screen simple enough to run during a
              rush.
            </p>
            <Link to="/orders/dashboard" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              Open the demo dashboard <ArrowRight size={15} />
            </Link>
          </Reveal>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Order stages">
            {ORDER_STATUSES.map((status) => <OrderStatusBadge key={status} status={status} />)}
          </div>

          <Reveal className="mx-auto mt-12 max-w-6xl">
            <ScreenFrame
              src={dashboardShot}
              label="Loumilab Orders — Merchant dashboard"
              alt="The Loumilab Orders merchant dashboard showing today's revenue, order count, average order, and a queue of orders marked New, Confirmed, Preparing, Ready and Completed."
            />
          </Reveal>
        </div>
      </section>

      {/* Built for social sellers */}
      <section className="section-padding">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Who it&apos;s for</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">Built for social sellers.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Food is where Loumilab Orders started and where it shines. Service businesses — electricians, cleaners,
              landscapers, beauty pros, photographers — get the same storefront tuned to quotes, visits and appointments.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((a, i) => (
              <Reveal key={a.id} delay={i * 80}>
                <article className="group h-full overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <div className="aspect-[4/3] overflow-hidden bg-secondary">
                    <img
                      src={a.image}
                      alt={a.title}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-7">
                    <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{a.desc}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
              Simple on the surface. Serious underneath.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal
                  key={f.title}
                  delay={i * 60}
                  className="h-full rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{f.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-container py-20 lg:py-28">
        <div className="section-dark rounded-[2rem] px-6 py-16 text-center sm:px-12 lg:py-20">
          <Reveal>
            <h2 className="font-hero text-[clamp(2.25rem,7vw,5rem)] font-semibold leading-[1] tracking-[-0.03em]">
              Stop taking orders through DMs.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 font-hero text-[clamp(1.75rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-accent">
              Start taking Orders.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <p className="mx-auto mt-8 max-w-md text-lg text-muted-foreground">
              Your storefront is only a few minutes away. No sign-up needed to start.
            </p>
          </Reveal>
          <Reveal delay={340} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to={ORDERS_CTA.href} className="dot-action" onClick={() => trackCtaClick("closing", ORDERS_CTA.variant)}>
                {ORDERS_CTA.label} <ArrowRight size={18} />
              </Link>
            </Button>
<p className="self-center text-sm text-muted-foreground">
              Compare alternatives:{" "}
              {COMPETITORS.map((c, i) => (
                <span key={c.slug}>{i > 0 && " · "}<Link to={`/orders/compare/${c.slug}`} className="font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">{c.name}</Link></span>
              ))}
            </p>
          </Reveal>
          <p className="mt-12 font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Orders by Loumilab
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            <Link to="/orders/local" className="underline underline-offset-4 hover:text-foreground">
              Loumilab Local
            </Link>
            <span className="px-2">·</span>
            <Link to="/orders/tools" className="underline underline-offset-4 hover:text-foreground">
              Free Business Tools
            </Link>
            <span className="px-2">·</span>
            <Link to="/orders/terms" className="underline underline-offset-4 hover:text-foreground">
              Terms &amp; Conditions
            </Link>
            <span className="px-2">·</span>
            <Link to="/orders/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Orders;
