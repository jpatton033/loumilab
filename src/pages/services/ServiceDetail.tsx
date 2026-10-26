import { Link, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { BenefitTrio, ClosingCta, FlowHero } from "@/components/brand/flow/Flow";
import { getServicePage, servicePages } from "@/data/services";

const ServiceDetail = () => {
  const slug = useLocation().pathname.split("/").filter(Boolean).pop();
  const s = getServicePage(slug);
  if (!s) return <Navigate to="/services" replace />;
  const related = servicePages.filter((p) => p.group === s.group && p.slug !== s.slug).slice(0, 3);

  return (
    <Layout>
      <SEOHead
        title={s.seoTitle}
        description={s.seoDescription}
        path={`/services/${s.slug}`}
        breadcrumbs={[{ name: "Solutions", path: "/services" }, { name: s.name, path: `/services/${s.slug}` }]}
      />
      <FlowHero
        eyebrow={<span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{s.group}</span>}
        title={s.title}
        lede={s.lede}
        cta={s.cta}
        image={s.image}
        imageAlt={s.imageAlt}
      />
      <BenefitTrio items={s.delivers} />

      <section className="section-container py-16 lg:py-24" aria-labelledby="problems">
        <Reveal><h2 id="problems" className="font-hero text-4xl font-semibold tracking-tight lg:text-5xl">Problems we solve.</h2></Reveal>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {s.problems.map((p) => (
            <div key={p.problem} className="grid gap-2 py-6 md:grid-cols-2 md:gap-10">
              <p className="font-display text-lg font-semibold">{p.problem}</p>
              <p className="text-muted-foreground">{p.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-inverse py-20 text-inverse lg:py-28" aria-labelledby="process">
        <div className="section-container">
          <h2 id="process" className="font-hero text-4xl font-semibold tracking-tight text-inverse lg:text-5xl">How it works.</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-4">
            {s.process.map((p, i) => (
              <li key={p.step}>
                <span className="font-display text-sm font-semibold text-accent-glow">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl font-semibold text-inverse">{p.step}</h3>
                <p className="mt-2 text-inverse-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-container grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h2 className="font-hero text-3xl font-semibold tracking-tight lg:text-4xl">What's included.</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {s.capabilities.map((c) => (
              <li key={c} className="flex items-center gap-3 text-foreground/80"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-hero text-3xl font-semibold tracking-tight lg:text-4xl">Questions.</h2>
          <dl className="mt-8 space-y-6">
            {s.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-display font-semibold">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <nav aria-label="Related solutions" className="section-container border-t border-border py-10">
          <p className="text-sm text-muted-foreground">
            Related:{" "}
            {related.map((r, i) => (
              <span key={r.slug}>{i > 0 && " · "}<Link to={`/services/${r.slug}`} className="font-medium text-foreground hover:text-accent">{r.name}</Link></span>
            ))}
          </p>
        </nav>
      )}

      <ClosingCta title={s.closing} cta={s.cta} tone="dark" />
    </Layout>
  );
};

export default ServiceDetail;
