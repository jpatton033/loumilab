import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/tracking";

const base = [
  "One professional business email account",
  "Provider configuration",
  "Domain verification and DNS setup",
  "SPF, DKIM and basic DMARC configuration",
  "Multi-factor authentication setup",
  "Up to three email aliases",
  "Email delivery testing",
  "Account handoff and basic instructions",
];
const domainExtras = [
  "Domain name selection help",
  "Domain registration guidance",
  "Domain ownership configuration",
  "Connecting the domain to your email provider",
  "DNS and renewal guidance",
];
const addons = [
  ["Additional mailbox", "$25 each"],
  ["Additional device setup", "$25 each"],
  ["Standalone domain setup", "$49"],
  ["Standard email migration", "From $199, quoted after review"],
];
const steps = [
  ["Choose a package", "Pick the setup that fits, then answer a short questionnaire."],
  ["Review and pay", "See an itemized price and pay securely. Complex requests get a quote first."],
  ["We set it up", "We coordinate with you to connect your domain and configure your provider."],
  ["Test and hand off", "We test sending and receiving, then hand over your new email."],
];
const faqs = [
  ["Do I pay Loumilab for my email?", "No. Loumilab charges once for setup. Your domain and email subscription are billed by your provider, such as Google, Microsoft or Zoho, and you own those accounts."],
  ["Which provider should I choose?", "Google Workspace suits teams already using Gmail. Microsoft 365 suits Outlook and Office users. Zoho Mail is a lower-cost option. Choose “Help me choose” and we'll recommend one."],
  ["What are SPF, DKIM and DMARC?", "They're settings on your domain that prove your emails really come from you, so they land in inboxes instead of spam."],
  ["Will you need my passwords?", "No. We never ask for passwords or codes. You create and own your accounts, and grant us helper access through the provider's own sharing tools when needed."],
  ["How long does setup take?", "It depends on how quickly domain and provider access are ready. We'll keep you updated at each step rather than promise a fixed time."],
  ["What if something isn't right afterwards?", "For seven days after setup we'll correct configuration issues caused by our work at no charge."],
];

const BusinessEmail = () => {
  useEffect(() => { track("ViewService", { content_name: "Business Email & Domain Setup" }); }, []);
  const pick = (pkg: string) => track("SelectPackage", { content_name: pkg });

  return (
    <Layout>
      <SEOHead
        title="Business Email & Domain Setup | Loumilab"
        description="Professional business email on your own domain, set up by Loumilab. Google Workspace, Microsoft 365 or Zoho Mail with DNS, SPF, DKIM and DMARC. From $99 one-time."
        path="/services/business-email"
        breadcrumbs={[{ name: "Services", path: "/services" }, { name: "Business Email & Domain Setup", path: "/services/business-email" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Business Email & Domain Setup",
          serviceType: "Business email and domain configuration",
          provider: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
          areaServed: "US",
          offers: [
            { "@type": "Offer", name: "Business Email Setup", price: "99.00", priceCurrency: "USD" },
            { "@type": "Offer", name: "Business Email + Domain Setup", price: "149.00", priceCurrency: "USD" },
          ],
        }}
      />

      <section className="section-padding">
        <div className="section-container max-w-4xl">
          <Eyebrow>Business Email &amp; Domain Setup</Eyebrow>
          <h1 className="mt-5 font-hero text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Professional Email. Your Business. Your Domain.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Give your business a professional email address with setup handled by Loumilab. Whether you already own a domain or need help getting started, we'll configure your email, connect your domain, and make sure everything works.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-sm">
            {["Google Workspace", "Microsoft 365", "Zoho Mail"].map((p) => (
              <span key={p} className="rounded-full border border-border bg-card px-4 py-1.5 font-medium">{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="section-container grid gap-6 lg:grid-cols-2">
          {[
            { id: "email", name: "Business Email Setup", price: "$99", for: "For businesses that already own a domain.", items: base },
            { id: "email_domain", name: "Business Email + Domain Setup", price: "$149", for: "For businesses that need a domain and email.", items: ["Everything in Business Email Setup", ...domainExtras] },
          ].map((p) => (
            <Reveal key={p.id}>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] lg:p-10">
                <h2 className="font-display text-2xl font-semibold">{p.name}</h2>
                <p className="mt-2 text-muted-foreground">{p.for}</p>
                <p className="mt-6 font-display text-4xl font-semibold">{p.price}<span className="ml-2 text-base font-normal text-muted-foreground">one-time</span></p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{i}</li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8">
                  <Link to={`/services/business-email/start?package=${p.id}`} onClick={() => pick(p.name)}>Get Started <ArrowRight size={18} /></Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="section-container mt-6">
          <div className="rounded-3xl border border-border bg-surface-subtle p-8">
            <h3 className="font-display text-lg font-semibold">Optional services</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {addons.map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4 rounded-2xl bg-card px-5 py-3 text-sm"><dt>{a}</dt><dd className="font-semibold">{b}</dd></div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Domain registration, renewal fees, email hosting subscriptions and applicable taxes are paid separately to your providers. Every setup includes seven days of limited post-setup support for correcting configuration issues caused by our work.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding border-t border-border">
        <div className="section-container">
          <h2 className="text-3xl font-semibold lg:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([t, d], i) => (
              <li key={t} className="rounded-3xl border border-border bg-card p-6">
                <span className="font-display text-sm font-semibold text-accent">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-padding border-t border-border bg-surface-subtle">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-semibold lg:text-4xl">Questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left font-display">{q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button asChild size="lg" className="mt-10">
            <Link to="/services/business-email/start" onClick={() => pick("unspecified")}>Get Started <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default BusinessEmail;
