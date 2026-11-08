import heroProducts from "@/assets/heroes/products.jpg";
import { PageHero } from "@/components/brand/flow/Flow";
import { ClosingCta } from "@/components/brand/flow/Flow";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import ProductCard from "@/components/brand/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productGroups, allProducts } from "@/data/products";
import { DotMarker, DotThread } from "@/components/brand/dot";
import { ImmersiveImage } from "@/components/brand/story";
import collaboration from "@/assets/people/studio/collaboration.jpg";

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
      title="Digital Products Built by Loumilab | Loumilab"
      description="Explore the products and companies built by Loumilab: Loumilab Orders for online ordering, Loumilab Local for food discovery, and Vurtti for compliance teams."
      breadcrumbs={[{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]}
      path="/products"
      jsonLd={productsJsonLd}
    />

    <PageHero image={heroProducts} imageAlt="A sculptural curved staircase in light and shadow" eyebrow="Products" title="Products and companies built by Loumilab." lede="We build technology for clients and we build our own — designed, engineered and secured by the same team." />

    <DotThread />

    <ImmersiveImage
      className="pt-2"
      image={{ src: collaboration, alt: "A product team shaping a new digital idea together" }}
      caption="Ideas become products through careful design, engineering, and iteration."
      dotLens
    />

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

    <ClosingCta tone="dark" title="Building a product of your own?" lede="We've done it for ourselves. We can do it with you." cta={{ label: "Start a Project", to: "/contact" }} />
  </Layout>
);

export default Products;
