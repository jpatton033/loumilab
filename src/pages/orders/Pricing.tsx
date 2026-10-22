import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import PricingTable from "@/components/orders/PricingTable";
import { FeeAnnouncement, FeeCalculator, FeeSaleExample, FeeExample, FeeTiersTable, useLiveFeeSchedule } from "@/components/orders/ProgressiveFees";
import { pricingHeading } from "@/data/orders/pricing";
import { ORDERS_CTA } from "@/data/orders/cta";
import { trackCtaClick } from "@/lib/tracking";

const FAQ = [
  ["Do lower rates apply to all of my sales?", "No. Each lower rate applies only to the additional eligible sales above that threshold. Sales already processed keep the rate they were charged."],
  ["When do thresholds reset?", "On the 1st of every month, at midnight US Eastern time. Each month starts again at your plan's starting fee."],
  ["Do I need to request the lower fee?", "No. Reductions apply automatically at checkout as your monthly sales grow."],
  ["What happens with refunds?", "Fees already charged aren't recalculated. Refunded amounts are removed from your monthly sales total, which can affect the rate on later orders."],
  ["Is the platform fee charged on tips or sales tax?", "Never. The Loumilab platform fee applies only to eligible merchandise sales."],
  ["What about Stripe fees?", "Stripe charges its own card processing fees separately. They are not part of the Loumilab platform fee. Subscriptions and plan features stay the same."],
] as const;

const OrdersPricing = () => {
  const { tiers } = useLiveFeeSchedule();
  return (
    <Layout>
      <SEOHead
        title="Pricing | Loumilab Orders"
        description="Loumilab Orders plans from $0/month. Your business grows, our fees shrink: platform fees decrease automatically on additional sales as monthly sales grow."
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Loumilab Orders", path: "/orders" }, { name: "Pricing", path: "/orders/pricing" }]}
        path="/orders/pricing"
        jsonLd={tiers ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        } : undefined}
      />
      <section className="section-container pt-8 pb-12 lg:pt-12">
        <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">Loumilab Orders</Link>
        <Eyebrow className="mt-8 block">{pricingHeading.eyebrow}</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {tiers ? "Your business grows. Our fees shrink." : pricingHeading.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{pricingHeading.subtitle}</p>
        {tiers && <div className="mt-8"><FeeAnnouncement showLink={false} /></div>}
        <div className="mt-12"><PricingTable /></div>
        <p className="mt-6 text-sm text-muted-foreground">{pricingHeading.footnote}</p>
        <div className="mt-8"><FeeSaleExample /></div>
      </section>

      {tiers && (
        <>
          <section className="section-container pb-12">
            <h2 className="text-2xl font-semibold sm:text-3xl">How monthly thresholds work</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              These are progressive, marginal rates. Each portion of your monthly eligible sales is charged the rate for its band, so lower rates apply only to additional sales — never retroactively. Thresholds reset on the 1st of each month (Eastern). It's automatic; there's nothing to request.
            </p>
            <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"><FeeTiersTable tiers={tiers} /></div>
            <div className="mt-6"><FeeExample tiers={tiers} /></div>
          </section>
          <section className="section-container pb-12">
            <h2 className="text-2xl font-semibold sm:text-3xl">Estimate your monthly fees</h2>
            <div className="mt-6"><FeeCalculator tiers={tiers} /></div>
          </section>
        </>
      )}

      <section className="section-container pb-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">Loumilab fees and Stripe fees</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The Loumilab platform fee is charged only on merchandise — never on tips or sales tax. Stripe, which securely processes card payments, charges its own processing fees separately. Monthly subscriptions and plan features are unchanged.
        </p>
      </section>

      {tiers && (
        <section className="section-container pb-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Questions</h2>
          <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium">{q}</summary>
                <p className="mt-2 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="section-container pb-20">
        <p className="text-lg text-muted-foreground">Less managing. More business.</p>
        <Link to={ORDERS_CTA.href} className="dot-action mt-4" onClick={() => trackCtaClick("pricing_page", ORDERS_CTA.variant)}>
          {ORDERS_CTA.label} <ArrowRight size={18} />
        </Link>
      </section>
    </Layout>
  );
};

export default OrdersPricing;
