import { lazy, Suspense } from "react";
import { MountWhenNear } from "@/components/orders/showcase/SitePreview";
const CustomizeShowcase = lazy(() => import("@/components/orders/showcase/CustomizeShowcase"));
import CinematicOrdersHero from "@/components/orders/hero/CinematicOrdersHero";
import PromoBanner from "@/components/orders/PromoBanner";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { ORDERS_CTA } from "@/data/orders/cta";
import { trackCtaClick } from "@/lib/tracking";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import PricingTable from "@/components/orders/PricingTable";
import { FeeAnnouncement } from "@/components/orders/ProgressiveFees";
import { pricingHeading, pricingPlans } from "@/data/orders/pricing";
import { COMPETITORS } from "@/data/orders/competitors";
import { Glow } from "@/components/brand/atmosphere";
import buildShot from "@/assets/builder/tpl-bakery.jpg";
import dashboardShot from "@/assets/orders/screens/merchant-dashboard.jpg";
import cakeShot from "@/assets/orders/showcase/build-baker-hands.jpg";

const steps = [
  { title: "Choose a design", desc: "Start with a professional template." },
  { title: "Make it yours", desc: "Customize your branding, layout and content." },
  { title: "Set up your business", desc: "Add products or services, payments, pickup and delivery." },
  { title: "Publish and share", desc: "Launch your website and give customers a place to order." },
];

const CAPS = [
  { t: "Your Storefront", d: "Give customers a place to discover your business, explore what you offer, and place an order directly.",
    visual: <img src={buildShot} alt="A sample bakery website made with Loumilab Orders" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" /> },
  { t: "Your Payments", d: "Accept online payments through a secure checkout without building or maintaining your own payment infrastructure.",
    visual: (
      <div className="flex aspect-[4/3] items-center justify-center p-6">
        <div className="w-full max-w-[15rem] overflow-hidden rounded-2xl bg-atmo-ivory text-atmo-obsidian shadow-2xl">
          <img src={cakeShot} alt="" loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
          <div className="p-4"><p className="text-sm font-semibold">Celebration cake</p><p className="text-xs opacity-70">$48 · Pickup Saturday</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-atmo-obsidian px-3 py-1 text-xs font-semibold text-atmo-ivory"><Check size={12} aria-hidden /> Paid</p></div>
        </div>
      </div>
    ) },
  { t: "Your Orders", d: "Know what needs to be prepared, what's ready, and what's completed — without searching through scattered customer messages.",
    visual: <img src={dashboardShot} alt="The Loumilab Orders dashboard with today's revenue and a queue of orders" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover object-top" /> },
];

const MORE: { t: string; soon?: boolean }[] = [
  { t: "Pickup and delivery options" }, { t: "Order and payment email notifications" }, { t: "Order messages with customers (paid plans)" },
  { t: "Calendar sync for pickups and jobs" }, { t: "Estimates, deposits and invoices" }, { t: "Version history and one-click restore" },
  { t: "Sales analytics" }, { t: "Mobile-ready dashboard" }, { t: "Connect your own domain", soon: true },
];

const FAQ = [
  { q: "Do I need a website already?", a: "No. Orders gives you a complete website with its own address, ready to share on social media, texts or business cards." },
  { q: "Do I need to sign up to try it?", a: "No. You can design your website first. You only create an account when you're ready to save and publish." },
  { q: "How do I get paid?", a: "Payments go through Stripe directly to your bank account. You finish payout setup before your website goes live." },
  { q: "Does it work for services, not just products?", a: "Yes. Cleaners, electricians, salons, photographers and more can list services, take requests and send estimates." },
];

const ordersJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Loumilab Orders",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Loumilab Orders lets small businesses build and customize a professional website, sell products or services, accept payments, and manage every order in one dashboard.",
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
        title="Loumilab Orders | Custom Business Websites with Online Ordering"
        description="Create a professional website that reflects your business. Customize your design, showcase products or services, accept payments, and manage orders from one platform. Start free."
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: "Loumilab Orders", path: "/orders" }]}
        path="/orders"
        jsonLd={ordersJsonLd}
      />

      {/* Hero */}
      <CinematicOrdersHero>
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-inverse/75">Loumilab Orders</p>
        <h1 className="font-hero text-5xl font-semibold leading-[1.02] tracking-tight text-inverse sm:text-6xl lg:text-7xl">
          You built the business.<br />We'll handle the technology.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-inverse/85">Create your storefront, accept payments, and manage your orders. All in one place, built for independent businesses.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90"><Link to={ORDERS_CTA.href} onClick={() => trackCtaClick("hero", "get-started-free-v1")}>Get Started Free</Link></Button>
          <a href="#capabilities" onClick={() => trackCtaClick("hero-secondary", "see-how-it-works")} className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-medium text-inverse/85 underline-offset-4 hover:text-inverse hover:underline">See How It Works <ArrowRight className="h-4 w-4" aria-hidden /></a>
        </div>
        <p className="mt-4 text-sm text-inverse/65">No monthly subscription required to get started.</p>
      </CinematicOrdersHero>

      {/* 2 · Everything you need */}
      <section id="capabilities" aria-labelledby="cap-title" className="relative scroll-mt-24 overflow-hidden bg-atmo-obsidian py-20 text-atmo-ivory lg:py-28">
        <div className="section-container relative">
          <Reveal className="max-w-2xl">
            <h2 id="cap-title" className="font-hero text-4xl font-semibold leading-tight text-atmo-ivory lg:text-5xl">Everything you need to run your business.</h2>
            <p className="mt-5 text-lg leading-relaxed text-atmo-ivory/75">From your first storefront to your next hundred orders, Loumilab Orders brings your business together in one place.</p>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {CAPS.map((c, i) => (
              <Reveal key={c.t} delay={i * 90}>
                <div className="overflow-hidden rounded-2xl border border-atmo-ivory/10 bg-atmo-ivory/5">{c.visual}</div>
                <h3 className="mt-6 font-display text-xl font-semibold text-atmo-ivory">{c.t}</h3>
                <p className="mt-2 leading-relaxed text-atmo-ivory/70">{c.d}</p>
              </Reveal>
            ))}
          </div>
          <details className="group mt-12 rounded-2xl border border-atmo-ivory/15 px-5 py-4">
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-semibold text-atmo-ivory">More features <span className="transition group-open:rotate-45" aria-hidden>+</span></summary>
            <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm text-atmo-ivory/75 sm:grid-cols-2 lg:grid-cols-3">
              {MORE.map((m) => <li key={m.t}>{m.t}{m.soon && <span className="ml-2 rounded-full border border-atmo-ivory/25 px-2 py-0.5 text-[10px] uppercase tracking-wide">Coming soon</span>}</li>)}
            </ul>
          </details>
        </div>
      </section>

      {/* 3 · Make it yours — live builder showcase */}
      <section id="site-showcase" aria-labelledby="showcase-title" className="relative scroll-mt-24 overflow-hidden bg-atmo-obsidian pb-20 text-atmo-ivory lg:pb-28">
        <Glow tone="midnight" className="left-[-10%] top-[-10%] h-[34rem] w-[34rem] opacity-60" />
        <div className="section-container relative border-t border-atmo-ivory/10 pt-20 lg:pt-28">
          <Reveal className="max-w-2xl">
            <h2 id="showcase-title" className="font-hero text-4xl font-semibold leading-tight text-atmo-ivory lg:text-5xl">Make it yours.</h2>
            <p className="mt-5 text-lg leading-relaxed text-atmo-ivory/75">See what your business could look like online. Create a storefront, explore your options, and get started when you're ready.</p>
          </Reveal>
          <div className="mt-10">
            <MountWhenNear minHeight={760}><Suspense fallback={null}><CustomizeShowcase /></Suspense></MountWhenNear>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/90"><Link to={ORDERS_CTA.href} onClick={() => trackCtaClick("make-it-yours", "build-your-storefront")}>Build Your Storefront</Link></Button>
            <p className="text-sm text-atmo-ivory/65">Explore the storefront builder before creating an account.</p>
          </div>
        </div>
      </section>

      {/* 4 · How it works — the one light shift */}
      <section id="how-it-works" aria-labelledby="hiw-title" className="relative scroll-mt-24 bg-background">
        <div className="section-container relative pb-16 pt-28 lg:pb-20 lg:pt-36">
          <Reveal className="max-w-2xl">
            <h2 id="hiw-title" className="font-hero text-4xl font-semibold leading-tight lg:text-5xl">Live in four steps.</h2>
            <p className="mt-4 text-muted-foreground">No sign-up needed to start designing.</p>
          </Reveal>
          <ol className="mt-12 grid gap-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((s, i) => (
              <li key={s.title}>
                <p className="font-hero text-sm font-semibold text-muted-foreground">0{i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5 · Pricing */}
      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24 bg-background pb-20 lg:pb-28">
        <div className="section-container border-t border-border pt-16 lg:pt-20">
          <Reveal className="max-w-2xl">
            <h2 id="pricing-title" className="font-hero text-4xl font-semibold leading-tight lg:text-5xl">{pricingHeading.title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{pricingHeading.subtitle}</p>
          </Reveal>
          <PromoBanner surface="homepage" wrapperClassName="mt-8" />
          <div className="mt-8"><FeeAnnouncement /></div>
          <div className="mt-12"><PricingTable /></div>
          <p className="mt-6 text-sm text-muted-foreground">The Loumilab fee is separate from card processing, which Stripe charges on each payment. {pricingHeading.footnote}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button size="lg" asChild className="rounded-full">
              <Link to={ORDERS_CTA.href} className="dot-action" onClick={() => trackCtaClick("pricing", ORDERS_CTA.variant)}>{ORDERS_CTA.label} <ArrowRight size={18} /></Link>
            </Button>
            <Link to="/orders/pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">See how pricing works <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* FAQ — only what isn't answered above */}
      <section aria-labelledby="faq-title" className="bg-background pb-24">
        <div className="section-container max-w-3xl border-t border-border pt-16">
          <h2 id="faq-title" className="font-hero text-3xl font-semibold">Questions.</h2>
          <div className="mt-6 divide-y divide-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.q}<span className="text-muted-foreground transition group-open:rotate-45" aria-hidden>+</span></summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-atmo-obsidian text-atmo-ivory">
        <Glow tone="midnight" className="left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 opacity-50" />
        <div className="section-container relative px-6 pb-20 pt-32 text-center sm:px-12 lg:pb-28 lg:pt-40">
          <Reveal>
            <h2 className="font-hero text-[clamp(2.25rem,7vw,5rem)] font-semibold leading-[1] tracking-[-0.03em] text-atmo-ivory">
              Stop taking orders through DMs.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 font-hero text-[clamp(1.75rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-inverse">
              Start taking Orders.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <p className="mx-auto mt-8 max-w-md text-lg text-inverse-muted">
              Your website is only a few minutes away. No sign-up needed to start.
            </p>
          </Reveal>
          <Reveal delay={340} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="rounded-full bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/90">
              <Link to={ORDERS_CTA.href} className="dot-action" onClick={() => trackCtaClick("closing", ORDERS_CTA.variant)}>
                {ORDERS_CTA.label} <ArrowRight size={18} />
              </Link>
            </Button>
<p className="self-center text-sm text-inverse-muted">
              Compare alternatives:{" "}
              {COMPETITORS.map((c, i) => (
                <span key={c.slug}>{i > 0 && " · "}<Link to={`/orders/compare/${c.slug}`} className="font-semibold text-inverse underline-offset-4 hover:underline">{c.name}</Link></span>
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
