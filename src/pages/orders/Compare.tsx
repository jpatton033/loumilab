import { Link, Navigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { FlowHero, BenefitTrio, ClosingCta } from "@/components/brand/flow/Flow";
import { CHECKED_ON, COMPARE_ROWS, COMPETITORS, LOUMILAB, findCompetitor } from "@/data/orders/competitors";
import { ORDERS_CTA } from "@/data/orders/cta";
import { trackCtaClick } from "@/lib/tracking";
import heroImg from "@/assets/people/baker-orders.jpg";

const OrdersCompare = () => {
  const { slug } = useParams();
  const c = findCompetitor(slug);
  if (!c) return <Navigate to="/orders" replace />;
  const cta = { label: ORDERS_CTA.label, to: ORDERS_CTA.href, onClick: () => trackCtaClick?.(ORDERS_CTA.variant, `compare-${c.slug}`) };
  const faq = [
    [`Is Loumilab Orders cheaper than ${c.name}?`, "The Starter plan is $0/month forever, and you only pay a platform fee on merchandise sales. Stripe card fees are separate."],
    [`Can I switch from ${c.name}?`, "Yes. Build and preview your new store before signing up, then publish when you're ready."],
    ["Is this comparison official?", `No. It's an independent comparison based on public information checked on ${CHECKED_ON}. Prices and features can change.`],
  ];
  return (
    <Layout>
      <SEOHead
        title={`Loumilab Orders vs. ${c.name} | Compare Online Ordering`}
        description={`Compare Loumilab Orders and ${c.name}: pricing, platform fees, online ordering, scheduling, calendar sync and support for small businesses.`}
        path={`/orders/compare/${c.slug}`}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Loumilab Orders", path: "/orders" }, { name: `vs. ${c.name}`, path: `/orders/compare/${c.slug}` }]}
        jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }}
      />
      <FlowHero
        title={<>Loumilab Orders vs. {c.name}</>}
        lede={c.summary}
        cta={cta}
        secondary={{ label: "See pricing", to: "/orders/pricing" }}
        image={heroImg}
        imageAlt="A baker packing an order placed through her Loumilab Orders store"
      />
      <BenefitTrio items={[
        { title: "Free to start", body: "A $0 plan with no monthly fee, ever. Upgrade only when you need more." },
        { title: "Fees that shrink", body: "Platform fees step down automatically as your monthly sales grow." },
        { title: "Built for local", body: "Pickup, delivery, bookings and calendar sync in one simple dashboard." },
      ]} />
      <section className="section-container py-12">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">Comparing Loumilab Orders and {c.name}</h2>
        <div className="mt-10 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b border-border">
                <th className="w-1/5 p-5 font-semibold text-muted-foreground">Feature</th>
                <th className="p-5 font-display font-semibold text-accent">Loumilab Orders</th>
                <th className="p-5 font-display font-semibold">{c.name}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r} className="border-b border-border last:border-0 align-top">
                  <th scope="row" className="p-5 font-semibold">{r}</th>
                  <td className="p-5 leading-relaxed">{LOUMILAB[r]}</td>
                  <td className="p-5 leading-relaxed text-muted-foreground">{c.values[r]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Independent comparison. {c.name} details from their <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">public pricing page</a>, last checked {CHECKED_ON}. Loumilab is not affiliated with {c.name}.
        </p>
      </section>
      <section className="section-container py-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Questions</h2>
        <dl className="mt-8 divide-y divide-border border-y border-border">
          {faq.map(([q, a]) => (
            <div key={q} className="py-6"><dt className="text-lg font-semibold">{q}</dt><dd className="mt-2 text-muted-foreground">{a}</dd></div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-muted-foreground">
          Also compare:{" "}
          {COMPETITORS.filter((o) => o.slug !== c.slug).map((o, i) => (
            <span key={o.slug}>{i > 0 && " · "}<Link to={`/orders/compare/${o.slug}`} className="font-semibold text-foreground hover:text-accent">vs. {o.name}</Link></span>
          ))}
        </p>
      </section>
      <ClosingCta title="Start selling for $0." lede={ORDERS_CTA.support} cta={cta} />
    </Layout>
  );
};

export default OrdersCompare;
