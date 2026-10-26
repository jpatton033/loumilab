import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Mail, Globe, Server, ShieldCheck, Lock, Users, Send, LifeBuoy, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import Reveal from "@/components/Reveal";
import PhotoSplit from "@/components/brand/PhotoSplit";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/tracking";
import { MANAGEMENT_PLANS } from "@/lib/services/emailSetup";
import heroImg from "@/assets/people/email/shop-owner.jpg";
import ownershipImg from "@/assets/people/email/office-review.jpg";

const START = "/services/business-email/start";

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
const handles = [
  { icon: Mail, t: "Business email account setup" },
  { icon: Globe, t: "Domain registration and configuration" },
  { icon: Server, t: "Google Workspace, Microsoft 365 and Zoho Mail setup" },
  { icon: Check, t: "Domain verification and DNS configuration" },
  { icon: ShieldCheck, t: "Email security configuration" },
  { icon: Users, t: "Mailboxes and aliases" },
  { icon: Send, t: "Email testing and account handoff" },
  { icon: LifeBuoy, t: "Optional ongoing management and support" },
];
const steps = [
  ["Choose your service", "Select the setup package that fits your business."],
  ["Tell us what you need", "Complete a short questionnaire about your business, domain, and preferred email provider."],
  ["Review your costs", "Review the setup fee and any initial domain or email hosting costs. Loumilab confirms third-party pricing and gets your authorization before purchasing."],
  ["We handle the setup", "Loumilab purchases the authorized initial services on your behalf and configures your domain, email accounts, and security settings."],
  ["Your business email is ready", "Receive your configured accounts, a secure ownership handoff, and instructions for future billing and renewals."],
];
const providers = [
  ["Google Workspace", "A good fit for teams already comfortable with Gmail, Google Calendar and Drive."],
  ["Microsoft 365", "A good fit for businesses that work in Outlook, Word, Excel and Teams."],
  ["Zoho Mail", "A lower-cost option for businesses that mainly need reliable email."],
];
const mgmt = [
  {
    key: "essential" as const,
    for: "For businesses needing routine configuration checks, basic troubleshooting, renewal reminders, and limited support.",
    items: ["Routine configuration checks", "Basic troubleshooting", "Domain and subscription renewal reminders", "Limited support requests"],
  },
  {
    key: "business" as const,
    for: "For businesses needing broader mailbox administration, additional support, and periodic configuration and security reviews.",
    items: ["Everything in Essential Management", "Broader mailbox administration", "Additional support", "Periodic configuration and security reviews"],
  },
];
const faqs = [
  ["Do I need to own a domain before getting started?", "No. If you already own one, choose Business Email Setup ($99). If you don't, choose Business Email + Domain Setup ($149) and we'll help you choose and register one."],
  ["Can Loumilab purchase my domain and email hosting for me?", "Yes. Choose “Loumilab buys it for me” in the questionnaire. We confirm the real provider prices, show you an itemized quote, and only purchase after you authorize and pay. You can also pay the providers yourself."],
  ["Are domain and email hosting costs included in the setup fee?", "No. Loumilab's setup fee covers our work. Domain registration and email hosting are charged by the providers and are itemized separately for your approval before anything is purchased."],
  ["Will I own my domain and email accounts?", "Yes. Your domain and email accounts are registered to your business. Before an order is completed we confirm ownership, your own login and recovery details, and that future billing is in your name. We never ask for your passwords."],
  ["Which email providers do you support?", "Google Workspace, Microsoft 365 and Zoho Mail. If you're unsure, choose “Help me choose” and we'll recommend one."],
  ["Can I add additional email addresses?", "Yes. Each setup includes one mailbox and up to three aliases. Additional mailboxes are $25 each during setup, plus the provider's own per-user subscription."],
  ["Do I have to purchase a monthly management plan?", "No. Management is entirely optional. You can start it after your setup is complete, or never."],
  ["Who pays for future domain and email hosting renewals?", "You do, directly with the provider. During handoff we move future renewal billing to you and record your renewal dates."],
  ["How long does setup typically take?", "It depends on how quickly domain and provider access are ready. We keep you updated at each stage rather than promise a fixed time."],
  ["What happens if I already have business email?", "We can still help. Moving existing mail to a new provider is a separate migration service, from $199 and quoted after we review your setup."],
];

const BusinessEmail = () => {
  useEffect(() => { track("ViewService", { content_name: "Business Email & Domain Setup" }); }, []);
  const pick = (pkg: string) => track("SelectPackage", { content_name: pkg });

  return (
    <Layout>
      <SEOHead
        title="Business Email & Domain Setup Services | Loumilab"
        description="Get professional business email and domain setup with Loumilab. We handle initial purchasing, configuration, security, and account handoff."
        path="/services/business-email"
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Business Email & Domain Setup", path: "/services/business-email" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Business Email & Domain Setup",
            serviceType: "Business email and domain configuration",
            provider: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" },
            areaServed: "US",
            offers: [
              { "@type": "Offer", name: "Business Email Setup", price: "99.00", priceCurrency: "USD" },
              { "@type": "Offer", name: "Business Email + Domain Setup", price: "149.00", priceCurrency: "USD" },
              ...Object.values(MANAGEMENT_PLANS).map((p) => ({
                "@type": "Offer", name: p.label, price: (p.cents / 100).toFixed(2), priceCurrency: "USD",
                priceSpecification: { "@type": "UnitPriceSpecification", price: (p.cents / 100).toFixed(2), priceCurrency: "USD", unitText: "MONTH" },
              })),
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
          },
        ]}
      />

      {/* Hero */}
      <section className="pt-10 pb-16 lg:pt-14 lg:pb-24">
        <div className="section-container">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li aria-hidden="true"><ChevronRight size={14} /></li>
              <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
              <li aria-hidden="true"><ChevronRight size={14} /></li>
              <li aria-current="page" className="text-foreground">Business Email &amp; Domain Setup</li>
            </ol>
          </nav>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>Business Email &amp; Domain Setup</Eyebrow>
              <h1 className="mt-5 font-hero text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                Professional Business Email. Set Up for You.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Give your business a professional email address using your own domain. Loumilab handles the initial purchasing, technical configuration, security settings, and setup, so you can focus on running your business.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={START} onClick={() => pick("hero")}>Get Started <ArrowRight size={18} /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#pricing">See pricing</a>
                </Button>
              </div>
            </div>
            <div className="photo-frame relative aspect-[3/2]">
              <img src={heroImg} alt="A florist checking business email on her phone at the shop counter" width={1600} height={1072} decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* What we handle */}
      <section className="section-padding border-t border-border">
        <div className="section-container">
          <div className="max-w-2xl">
            <Eyebrow>What we handle</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">The technical work, from beginning to end.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">No advanced technical knowledge needed. Tell us what you want, and we take care of the rest.</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {handles.map(({ icon: Icon, t }) => (
              <li key={t} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Icon size={18} strokeWidth={1.75} /></div>
                <p className="mt-4 font-display text-base font-semibold leading-snug">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Packages */}
      <section id="pricing" className="section-padding scroll-mt-24 border-t border-border bg-surface-subtle">
        <div className="section-container">
          <div className="max-w-2xl">
            <Eyebrow>Setup packages</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">Clear, one-time setup pricing.</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              { id: "email", name: "Business Email Setup", price: "$99", for: "For businesses that already own a domain and need professional email configuration.", items: base },
              { id: "email_domain", name: "Business Email + Domain Setup", price: "$149", for: "For businesses that need both a domain and professional email configuration.", items: ["Everything in Business Email Setup", ...domainExtras] },
            ].map((p) => (
              <Reveal key={p.id}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] lg:p-10">
                  <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
                  <p className="mt-2 text-muted-foreground">{p.for}</p>
                  <p className="mt-6 font-display text-4xl font-semibold">{p.price}<span className="ml-2 text-base font-normal text-muted-foreground">one-time</span></p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.items.map((i) => (
                      <li key={i} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{i}</li>
                    ))}
                  </ul>
                  <Button asChild size="lg" className="mt-8">
                    <Link to={`${START}?package=${p.id}`} onClick={() => pick(p.name)}>Get Started <ArrowRight size={18} /></Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-accent/30 bg-card p-6 text-sm leading-relaxed lg:p-8">
            <p className="font-display text-base font-semibold">Provider costs are separate</p>
            <p className="mt-2 text-muted-foreground">
              Initial domain registration and email hosting subscriptions are charged by your providers, in addition to Loumilab's setup fee. If Loumilab purchases them for you, every third-party cost is itemized and approved by you before payment.
            </p>
          </div>
          <div className="mt-6 rounded-3xl border border-border bg-card p-8">
            <h3 className="font-display text-lg font-semibold">Optional services</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {addons.map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4 rounded-2xl bg-surface-subtle px-5 py-3 text-sm"><dt>{a}</dt><dd className="font-semibold">{b}</dd></div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              More complex requests receive a custom quote before payment. Applicable taxes are paid separately. Every setup includes seven days of limited post-setup support for correcting configuration issues caused by our work.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding border-t border-border">
        <div className="section-container">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">Five simple steps.</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* Providers */}
      <section className="section-padding border-t border-border bg-surface-subtle">
        <div className="section-container">
          <div className="max-w-2xl">
            <Eyebrow>Supported providers</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">The right email provider for how you work.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">We help you choose a provider based on your team, the tools you already use, and your budget.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {providers.map(([n, d]) => (
              <div key={n} className="rounded-3xl border border-border bg-card p-7">
                <h3 className="font-display text-xl font-semibold">{n}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Product names are trademarks of their respective owners. Loumilab is an independent setup provider and is not an official partner or reseller of these companies.</p>
        </div>
      </section>

      {/* Management */}
      <section className="section-padding border-t border-border">
        <div className="section-container">
          <div className="max-w-2xl">
            <Eyebrow>Optional monthly management</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">Ongoing help, only if you want it.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Management can begin once your setup is complete. It's never required.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {mgmt.map((m) => {
              const p = MANAGEMENT_PLANS[m.key];
              return (
                <div key={m.key} className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                  <h3 className="font-display text-2xl font-semibold">{p.label}</h3>
                  <p className="mt-2 text-muted-foreground">{m.for}</p>
                  <p className="mt-6 font-display text-4xl font-semibold">${p.cents / 100}<span className="ml-1 text-base font-normal text-muted-foreground">/month</span></p>
                  <ul className="mt-6 space-y-2.5">
                    {[...m.items, `Covers ${p.mailboxes === 1 ? "1 mailbox" : `up to ${p.mailboxes} mailboxes`}`].map((i) => (
                      <li key={i} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{i}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex gap-4 rounded-3xl border border-border bg-surface-subtle p-6 text-sm leading-relaxed text-muted-foreground lg:p-8">
            <Lock size={18} className="mt-0.5 shrink-0 text-accent" />
            <p>Management fees are separate from your provider's email hosting and domain renewal charges. You keep ownership of your accounts, and cancelling Loumilab management never cancels your domain or email service.</p>
          </div>
        </div>
      </section>

      <PhotoSplit image={ownershipImg} alt="Two colleagues reviewing their new business email account on a laptop" eyebrow="Your accounts" title="Set up by us. Owned by you." className="bg-surface-subtle">
        <p>Your domain and email accounts are registered to your business, with your own logins and recovery details. We never ask for your passwords.</p>
        <p>Before we finish, we confirm ownership, move future billing to you, and record your renewal dates so nothing catches you by surprise.</p>
      </PhotoSplit>

      {/* FAQ */}
      <section className="section-padding border-t border-border">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-semibold lg:text-4xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left font-display">{q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-surface-inverse text-inverse-foreground">
        <div className="section-container max-w-2xl text-center">
          <h2 className="font-hero text-4xl font-semibold leading-tight lg:text-6xl">Your Business Deserves Professional Email.</h2>
          <p className="mt-4 text-lg leading-relaxed text-inverse-muted">From choosing a domain to configuring your inbox, Loumilab makes getting started easier.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full">
            <Link to={START} onClick={() => pick("unspecified")}>Get Started <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default BusinessEmail;
