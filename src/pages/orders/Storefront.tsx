import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import StorefrontHeader from "@/components/orders/StorefrontHeader";
import StoreProductCard from "@/components/orders/StoreProductCard";
import CartBar from "@/components/orders/CartBar";
import CheckoutSheet from "@/components/orders/CheckoutSheet";
import ServiceRequestForm from "@/components/orders/ServiceRequestForm";
import { useCart } from "@/hooks/use-cart";
import { getStorefront } from "@/data/orders/storefronts";
import { usePublicStorefront, toStoreProduct } from "@/lib/orders/storefront";
import { useIndustryExperience } from "@/lib/orders/industries";
import { toast } from "sonner";

/**
 * Reusable merchant storefront template. Live storefronts render from the
 * database; the seeded demo slugs still fall back to local sample data so the
 * marketing preview keeps working.
 */
const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const { data: live, isLoading } = usePublicStorefront(slug);
  const demo = getStorefront(slug);
  const cart = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  /** A live row exists whenever the visitor can read the store (public, paused, or owner preview). */
  const isLive = !!live;
  const status = live?.store.status ?? "setup";
  const isPublic = status === "published";
  const isPaused = status === "paused";

  const store = isLive
    ? {
        name: live.store.name,
        slug: live.store.slug,
        location: live.store.location ?? "",
        description: live.store.description ?? "",
        monogram: live.store.monogram ?? live.store.name.slice(0, 2).toUpperCase(),
        logoUrl: live.store.logo_url,
        acceptingOrders: isPublic && live.acceptingOrders,
        hours: live.store.hours ?? "",
        pickupInfo: live.store.pickup_info ?? (live.store.delivery_enabled ? "Delivery available" : "Pickup"),
        industrySlug: live.industrySlug,
        products: live.products.map(toStoreProduct),
      }
    : demo;


  const { industry, terms, workflow } = useIndustryExperience(store?.industrySlug);
  /** Service businesses lead with a request → estimate flow, not a cart. */
  const requestLed = !!industry && !industry.is_food && /request|inquiry/i.test(workflow[0] ?? "");

  useEffect(() => {
    if (params.get("checkout") === "cancelled") {
      toast.info("Checkout cancelled", { description: "Your cart is still here whenever you're ready." });
    }
  }, [params]);

  if (isLoading && !demo) {
    return (
      <Layout>
        <SEOHead title="Loading store — Loumilab Orders" description="Loading storefront." path="/orders" noindex />
        <section className="section-padding pt-32 text-center">
          <div className="section-container">
            <p className="text-muted-foreground">Loading store…</p>
          </div>
        </section>
      </Layout>
    );
  }

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
    if (isLive) {
      if (!isPublic) {
        toast.info("Preview mode", { description: "Publish your store from the dashboard to take real orders." });
        return;
      }
      if (!live.acceptingOrders) {
        toast.error("Not accepting orders", { description: "This store has paused new orders." });
        return;
      }
      setCheckoutOpen(true);
      return;
    }
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

          {isLive && !isPublic && (
            <div className="mt-6 rounded-2xl border border-border bg-secondary p-4 text-sm">
              <p className="font-display font-semibold">
                {isPaused ? "This store is temporarily unavailable" : "Preview — not published yet"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {isPaused
                  ? "The business has paused new orders. Please check back soon."
                  : "Only you can see this page. Publish from your dashboard when you're ready to take orders."}
              </p>
            </div>
          )}

          <div className="mt-8">

            <StorefrontHeader store={store} />
          </div>

          <h2 className="mt-12 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {terms.catalog}
          </h2>

          {store.products.length === 0 ? (
            <p className="mt-5 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
              This store hasn't published anything yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {store.products.map((p) => (
                <StoreProductCard
                  key={p.id}
                  product={p}
                  quantity={cart.lines.find((l) => l.product.id === p.id)?.quantity ?? 0}
                  onAdd={cart.add}
                  priceIsStarting={requestLed}
                  actionLabel={requestLed ? "Request" : undefined}
                />
              ))}
            </div>
          )}

          {requestLed && (
            <div className="mt-12">
              <ServiceRequestForm terms={terms} merchantId={isLive ? live.store.merchant_id : undefined} />
            </div>
          )}

          <p className="mt-10 text-sm text-muted-foreground">
            {store.pickupInfo} · {store.hours}
          </p>
        </div>
      </section>

      {!requestLed && (
        <CartBar count={cart.count} subtotalCents={cart.subtotalCents} ctaLabel="Place order" onCheckout={checkout} />
      )}

      {isLive && isPublic && (
        <CheckoutSheet
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          store={live.store}
          lines={cart.lines}
          subtotalCents={cart.subtotalCents}
        />
      )}
    </Layout>
  );
};

export default Storefront;
