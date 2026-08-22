import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import ProductCard from "@/components/brand/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productGroups, allProducts } from "@/data/products";

const productsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "The Loumilab Ecosystem",
  itemListElement: allProducts.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: p.name,
      description: p.description,
      url: p.external ? p.href : `https://loumilab.com${p.href}`,
      brand: { "@type": "Brand", name: "Loumilab" },
    },
  })),
};

const Products = () => (
  <Layout>
    <SEOHead
      title="The Loumilab Ecosystem — Products & Companies"
      description="Explore the Loumilab ecosystem: Loumilab Orders, built in house, and Vurtti, a Loumilab compliance technology company."
      path="/products"
      jsonLd={productsJsonLd}
    />

    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-20">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="section-container relative max-w-3xl">
        <Eyebrow>Ecosystem</Eyebrow>
        <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
          Products and companies built by Loumilab.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          We build technology for clients and we build our own. Each product below is designed, engineered,
          and secured by the same team.
        </p>
      </div>
    </section>

    <section className="section-padding pt-8">
      <div className="section-container space-y-16">
        {productGroups.map((group, gi) => (
          <div key={group.id}>
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-2xl font-semibold lg:text-3xl">{group.label}</h2>
              <p className="mt-3 text-muted-foreground">{group.blurb}</p>
            </Reveal>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {group.items.map((p, i) => (
                <Reveal key={p.id} delay={gi * 60 + i * 80}>
                  <ProductCard product={p} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        ))}

        <Reveal>
          <div className="rounded-3xl border border-dashed border-border bg-surface-subtle p-8 lg:p-12">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              What&apos;s next
            </span>
            <p className="mt-3 font-display text-xl font-semibold lg:text-2xl">We&apos;re always building.</p>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              More Loumilab products and companies are in development. They&apos;ll be listed here as they launch.
            </p>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container text-center">
        <h2 className="text-3xl font-semibold lg:text-4xl">Building a product of your own?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          We&apos;ve done it for ourselves. We can do it with you.
        </p>
        <Button size="lg" asChild className="mt-8">
          <Link to="/contact">
            Start a Project <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Products;
