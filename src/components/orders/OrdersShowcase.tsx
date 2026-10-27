import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PhoneFrame from "@/components/orders/PhoneFrame";
import StorefrontScreen from "@/components/orders/StorefrontScreen";
import { demoStorefront } from "@/data/orders/storefronts";
import { ORDERS_CTA } from "@/data/orders/cta";

type Props = {
  ctaLabel?: string;
  secondary?: { label: string; to: string };
  onCtaClick?: () => void;
};

/** Dark-band Orders showcase (title, pitch, phone storefront). Place inside a dark surface. */
const OrdersShowcase = ({ ctaLabel = "Build Your Store", secondary = { label: "See How It Works", to: "/orders" }, onCtaClick }: Props) => (
  <div className="grid items-center gap-12 lg:grid-cols-2">
    <div>
      <h3 className="font-display text-3xl font-semibold text-inverse">Loumilab Orders</h3>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-inverse-muted">
        A storefront that adapts to your industry — food, baking, services and more — with every order in one dashboard. Build and preview your store before you sign up.
      </p>
      <p className="mt-4 font-display font-semibold text-inverse">Transparent. First and Always.</p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to={ORDERS_CTA.href} onClick={onCtaClick}>{ctaLabel}</Link>
        </Button>
        {secondary.to.startsWith("#") ? (
          <a href={secondary.to} className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">{secondary.label}</a>
        ) : (
          <Link to={secondary.to} className="text-sm font-semibold text-inverse underline-offset-4 hover:underline">{secondary.label}</Link>
        )}
      </div>
    </div>
    <div className="flex justify-center">
      <div className="w-[280px] text-foreground">
        <PhoneFrame label="Example storefront in Loumilab Orders"><StorefrontScreen store={demoStorefront} highlightIndex={0} /></PhoneFrame>
      </div>
    </div>
  </div>
);

export default OrdersShowcase;
