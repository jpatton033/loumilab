import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox, Layers, Smartphone, BarChart3, Bell, Users } from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "One order inbox",
    desc: "Every order from every channel lands in a single queue — no switching between apps to see what came in.",
  },
  {
    icon: Layers,
    title: "Channel agnostic",
    desc: "Website, social, phone, or in person. Orders are captured the same way regardless of where the sale happens.",
  },
  {
    icon: Smartphone,
    title: "Built for phones",
    desc: "Designed to be run from a phone behind a counter, not just from a desk.",
  },
  {
    icon: Bell,
    title: "Status you can trust",
    desc: "Clear states from received to fulfilled, so staff and customers always know where an order stands.",
  },
  {
    icon: Users,
    title: "Team-ready",
    desc: "Multiple people, shared visibility, and a record of who did what.",
  },
  {
    icon: BarChart3,
    title: "Simple reporting",
    desc: "The numbers that matter — volume, value, and trends — without a dashboard you have to learn.",
  },
];

const steps = [
  { num: "01", title: "Connect your channels", desc: "Point your existing sales channels at Orders." },
  { num: "02", title: "Receive in one place", desc: "New orders arrive in a single, shared queue in real time." },
  { num: "03", title: "Fulfill and close out", desc: "Move orders through clear stages until they're done." },
];

const ordersJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Loumilab Orders",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Loumilab Orders is an order management platform that brings orders from every sales channel into one place.",
  url: "https://loumilab.com/orders",
  publisher: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
};

const Orders = () => (
  <Layout>
    <SEOHead
      title="Loumilab Orders — Sell Anywhere, Take Orders in One Place"
      description="Loumilab Orders brings every order from every sales channel into one clean place to receive, manage, and fulfill. Built by Loumilab."
      path="/orders"
      jsonLd={ordersJsonLd}
    />

    {/* Product hero */}
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="section-container relative">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Built by Loumilab · Coming soon
          </span>
          <h1 className="mt-8 font-hero font-semibold leading-[0.98] tracking-[-0.035em]" style={{ fontSize: "clamp(2.5rem, 6.5vw, 4.75rem)" }}>
            Sell anywhere.
            <br />
            Take orders in one place.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Loumilab Orders is an ordering platform for businesses selling across multiple channels — one
            clean place to receive, manage, and fulfill every order.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/contact">
                Join the waitlist <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:hello@loumilab.com?subject=Loumilab%20Orders">Talk to us</a>
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>Product</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            The order layer your business is missing.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <f.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="section-padding border-t border-border">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">Three steps, then it&apos;s running.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 90}>
              <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <span className="font-display text-sm font-semibold text-accent">{s.num}</span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="section-padding border-t border-border bg-primary text-primary-foreground">
      <div className="section-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-hero text-3xl font-semibold leading-tight tracking-[-0.03em] lg:text-5xl">
            Be first in line.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-primary-foreground/70">
            Tell us how you take orders today and we&apos;ll bring you into early access.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-9">
            <Link to="/contact">
              Join the waitlist <ArrowRight size={18} />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  </Layout>
);

export default Orders;
