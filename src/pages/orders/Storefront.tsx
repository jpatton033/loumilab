import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import StorefrontHeader from "@/components/orders/StorefrontHeader";
import StoreProductCard from "@/components/orders/StoreProductCard";
import CartBar from "@/components/orders/CartBar";
import ServiceRequestForm from "@/components/orders/ServiceRequestForm";
import { useCart } from "@/hooks/use-cart";
import { getStorefront } from "@/data/orders/storefronts";
import { useIndustryExperience } from "@/lib/orders/industries";
import { toast } from "sonner";


/**
 * Reusable merchant storefront template. Every merchant renders through this
 * one component — only the storefront record changes.
 */
const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const store = getStorefront(slug);
  const cart = useCart();

  if (!store) {
    return (
      <Layout>
        <SEOHead title="Store Not Found — Loumilab Orders" description="This storefront is not available." path="/orders" noindex />
        <section className="section-padding pt-32 text-center">
          <div className="section-container">
            <h1 className="font-hero text-4xl font-semibold tracking-tight">Store not found</h1>
            <p className="mt-4 text-muted-foreground">This storefront may have been moved or is not yet published.</p>
            <Button asChild className="mt-8 rounded-full">
              <Link to="/orders">Explore Loumilab Orders</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const checkout = () => {
    toast.success("Order placed (demo)", {
      description: `${cart.count} item${cart.count > 1 ? "s" : ""} · this storefront is a preview, no payment was taken.`,
    });
    cart.clear();
  };

  return (
    <Layout>
      <SEOHead
        title={`${store.name} — Order Online | Loumilab Orders`}
        description={store.description}
        path={`/orders/store/${store.slug}`}
      />

      <section className="pb-32 pt-28 lg:pt-32">
        <div className="section-container max-w-3xl">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> Powered by Loumilab Orders
          </Link>

          <div className="mt-8">
            <StorefrontHeader store={store} />
          </div>

          <h2 className="mt-12 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Menu
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {store.products.map((p) => (
              <StoreProductCard
                key={p.id}
                product={p}
                quantity={cart.lines.find((l) => l.product.id === p.id)?.quantity ?? 0}
                onAdd={cart.add}
              />
            ))}
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            {store.pickupInfo} · {store.hours}
          </p>
        </div>
      </section>

      <CartBar count={cart.count} subtotalCents={cart.subtotalCents} ctaLabel="Place order" onCheckout={checkout} />
    </Layout>
  );
};

export default Storefront;
