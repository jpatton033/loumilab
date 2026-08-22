import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  Instagram,
  LayoutGrid,
  MonitorSmartphone,
  PackageCheck,
  Smartphone,
  Store,
  Zap,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import PhoneFrame from "@/components/orders/PhoneFrame";
import StorefrontScreen from "@/components/orders/StorefrontScreen";
import OrderNotifications from "@/components/orders/OrderNotifications";
import StorefrontHeader from "@/components/orders/StorefrontHeader";
import StoreProductCard from "@/components/orders/StoreProductCard";
import CartBar from "@/components/orders/CartBar";
import MetricCard from "@/components/orders/MetricCard";
import OrderQueue from "@/components/orders/OrderQueue";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import FlowDiagram from "@/components/orders/FlowDiagram";
import PricingTable from "@/components/orders/PricingTable";
import { useCart } from "@/hooks/use-cart";
import { demoStorefront } from "@/data/orders/storefronts";
import { dashboardMetrics, demoOrders, ORDER_STATUSES } from "@/data/orders/dashboard";
import { audiences } from "@/data/orders/audiences";
import { pricingHeading } from "@/data/orders/pricing";

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
  { icon: LayoutGrid, title: "Product & Menu Management", desc: "Add products, photos, descriptions, pricing, and availability." },
  { icon: CreditCard, title: "Online Payments", desc: "Architected for secure, provider-handled card payments." },
  { icon: MonitorSmartphone, title: "Order Dashboard", desc: "View and manage every order from one place." },
  { icon: PackageCheck, title: "Order Status Updates", desc: "Move orders through New, Confirmed, Preparing, Ready, and Completed." },
  { icon: Smartphone, title: "Mobile Management", desc: "Run the whole operation from your phone behind the counter." },
  { icon: Clock, title: "Pickup Options", desc: "Configure pickup instructions and pickup windows." },
  { icon: Zap, title: "Inventory & Availability", desc: "Mark items available, unavailable, or sold out in a tap." },
  { icon: Bell, title: "Customer Notifications", desc: "Built so email and SMS order updates can be switched on." },
  { icon: BarChart3, title: "Sales Analytics", desc: "Simple revenue and order insights, no spreadsheet required." },
];

const journey = [
  { id: "j1", label: "Seen on social", detail: "A customer spots the plate on Instagram." },
  { id: "j2", label: "Taps Order Now", detail: "One link, straight from the bio." },
  { id: "j3", label: "Storefront opens", detail: "Fast, mobile-first, no app install." },
  { id: "j4", label: "Selects & checks out", detail: "Items added, order confirmed." },
  { id: "j5", label: "Merchant is notified", detail: "The order lands in the dashboard.", emphasis: true },
  { id: "j6", label: "Status updated", detail: "Confirmed, preparing, ready." },
  { id: "j7", label: "Customer confirmed", detail: "They know exactly when to pick up." },
];

const socialFlow = [
  { id: "f1", label: "Instagram · Facebook · TikTok · Text", detail: "Where your audience already is." },
  { id: "f2", label: "Loumilab Orders Store", detail: "One link that takes real orders.", emphasis: true },
  { id: "f3", label: "Order + Payment", detail: "Captured in a clean checkout." },
  { id: "f4", label: "Merchant Dashboard", detail: "Everything organized in one queue." },
];

const ordersJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Loumilab Orders",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Loumilab Orders lets small businesses create a simple storefront, share one link, take orders from social media, accept payments, and manage every order in one dashboard.",
  url: "https://loumilab.com/orders",
  publisher: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
};

const Orders = () => {
  const cart = useCart();

  return (
    <Layout>
      <SEOHead
        title="Loumilab Orders — Turn Social Traffic Into Organized Orders"
        description="Create a simple storefront, share your link, accept orders and payments, and manage everything in one dashboard. Built for food sellers, pop-ups, creators, and small businesses."
        path="/orders"
        jsonLd={ordersJsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-28 lg:pb-28 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden="true" />
        <div className="section-container relative">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>Loumilab Orders</Eyebrow>
              <h1 className="mt-5 font-hero text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Your business.
                <br />
                Your storefront.
                <br />
                Your orders.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Create a simple storefront, share your link, accept orders, and manage everything in one place.
                No complicated e-commerce setup required.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="rounded-full">
                  <Link to="/orders/get-started">
                    Create Your Store <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full">
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Create your store. Share your link. Take orders. Get paid.
              </p>
            </div>

            <div className="relative">
              <PhoneFrame label="Sunday Kitchen storefront preview">
                <StorefrontScreen store={demoStorefront} />
              </PhoneFrame>
              <OrderNotifications className="mx-auto mt-6 w-full max-w-sm lg:absolute lg:-right-4 lg:top-8 lg:mt-0 lg:w-64" />
            </div>
          </div>
        </div>
      </section>

      {/* Social commerce */}
      <section className="section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-3xl">
            <Eyebrow>Social commerce</Eyebrow>
            <h2 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
              Your followers are already customers.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Businesses shouldn&apos;t have to manage orders through dozens of DMs, text messages, screenshots,
              payment requests, and spreadsheets. Loumilab Orders turns a social media audience into a simple
              ordering experience.
            </p>
          </Reveal>

          <div className="mt-14 flex items-center gap-3 text-muted-foreground">
            <Instagram size={18} />
            <span className="text-sm">One link. Every channel.</span>
          </div>
          <FlowDiagram steps={socialFlow} className="mt-6" orientation="stacked" />
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
              A real storefront layout, running right here. Add a few items and watch the cart build — exactly the
              way it works on a phone.
            </p>
          </Reveal>

          <Reveal className="mt-12 rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:p-10">
            <StorefrontHeader store={demoStorefront} />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {demoStorefront.products.map((p) => (
                <StoreProductCard
                  key={p.id}
                  product={p}
                  quantity={cart.lines.find((l) => l.product.id === p.id)?.quantity ?? 0}
                  onAdd={cart.add}
                />
              ))}
            </div>
            <CartBar
              variant="inline"
              className="mt-8"
              count={cart.count}
              subtotalCents={cart.subtotalCents}
              ctaLabel="Sample checkout"
              onCheckout={cart.clear}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Demo only — no payment is processed and no order is sent.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Dashboard showcase */}
      <section className="section-padding">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Merchant dashboard</Eyebrow>
            <h2 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
              Everything in one place.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Today&apos;s orders, revenue, and what needs attention — on one screen simple enough to run during a
              rush.
            </p>
          </Reveal>

          <Reveal className="mt-12 rounded-[2rem] border border-border bg-surface-subtle p-4 shadow-[var(--shadow-lift)] lg:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              {dashboardMetrics.map((m) => (
                <MetricCard key={m.id} label={m.label} value={m.value} delta={m.delta} />
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                <p className="font-display font-semibold">Order queue</p>
                <Link to="/orders/dashboard" className="text-sm font-semibold text-accent hover:underline">
                  Open dashboard
                </Link>
              </div>
              <OrderQueue orders={demoOrders.slice(0, 3)} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Order lifecycle */}
      <section className="section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Order management</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
              Always know what needs attention.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Every order moves through five clear stages. One glance tells you what to cook, what to bag, and what
              is waiting at the counter.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ORDER_STATUSES.map((status, i) => (
              <Reveal
                key={status}
                delay={i * 90}
                className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <OrderStatusBadge status={status} />
                <p className="mt-4 font-hero text-2xl font-semibold tracking-tight">0{i + 1}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {status === "New" && "Just came in and needs a decision."}
                  {status === "Confirmed" && "Accepted, customer notified."}
                  {status === "Preparing" && "In the kitchen or being packed."}
                  {status === "Ready" && "Waiting for pickup."}
                  {status === "Completed" && "Handed off and closed out."}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Built for social sellers */}
      <section className="section-padding">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>Who it&apos;s for</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">Built for social sellers.</h2>
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

      {/* Customer journey */}
      <section className="section-padding">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>The full transaction</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
              From a post to a picked-up order.
            </h2>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
            <Reveal from="left" className="order-2 lg:order-1">
              <FlowDiagram steps={journey} orientation="stacked" />
            </Reveal>
            <Reveal from="right" className="order-1 lg:order-2">
              <PhoneFrame label="Customer ordering flow">
                <StorefrontScreen store={demoStorefront} cart={{ count: 2, subtotalCents: 3400 }} highlightIndex={0} />
              </PhoneFrame>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding surface-subtle border-y border-border">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <Eyebrow>{pricingHeading.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">{pricingHeading.title}</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{pricingHeading.subtitle}</p>
          </Reveal>

          <div className="mt-14">
            <PricingTable />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{pricingHeading.footnote}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding">
        <div className="section-container text-center">
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
              Your storefront is only a few minutes away.
            </p>
          </Reveal>
          <Reveal delay={340} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="rounded-full">
              <Link to="/orders/get-started">
                Create Your Store <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full">
              <Link to="/contact">Learn More</Link>
            </Button>
          </Reveal>
          <p className="mt-12 font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Orders by Loumilab
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Orders;
