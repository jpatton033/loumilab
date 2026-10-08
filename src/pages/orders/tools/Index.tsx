import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { businessTools } from "@/data/orders/tools";

const BusinessTools = () => {
  const [featured, ...rest] = businessTools;
  return (
    <Layout>
      <SEOHead
        title="Free Business Tools for Food Sellers | Loumilab Orders"
        description="Free business tools from Loumilab Orders to help you price, plan and grow — starting with a food pricing calculator for home chefs, caterers, bakers and food trucks."
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Loumilab Orders", path: "/orders" }, { name: "Business Tools", path: "/orders/tools" }]}
        path="/orders/tools"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Loumilab Orders", item: "https://loumilab.com/orders" },
            { "@type": "ListItem", position: 2, name: "Business Tools", item: "https://loumilab.com/orders/tools" },
          ],
        }}
      />
      <section className="section-container pt-8 pb-16 lg:pt-12 lg:pb-24">
        <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Loumilab Orders
        </Link>
        <Eyebrow className="mt-8 block">Free for everyone</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Business Tools</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Free tools to help you price, plan, and grow your business.
        </p>

        <Link
          to={`/orders/tools/${featured.slug}`}
          className="group mt-12 block rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Calculator size={22} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">{featured.name}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{featured.description}</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">
            Open the calculator <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {rest.map((t) => (
            <div key={t.slug} className="rounded-3xl border border-border bg-secondary/50 p-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Coming soon</span>
              <h3 className="mt-3 font-display font-semibold">{t.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg"><Link to="/orders/get-started">Create Your Store</Link></Button>
          <Link to="/orders" className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Learn about Loumilab Orders
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default BusinessTools;
