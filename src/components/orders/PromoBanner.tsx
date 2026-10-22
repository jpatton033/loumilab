import { useEffect } from "react";
import { BadgePercent } from "lucide-react";
import { formatDeadline, useActivePromotion, type PromoSurface, type PublicPromotion } from "@/lib/orders/promotions";
import { trackPromoViewed } from "@/lib/tracking";

/** Quiet promo strip. Renders nothing when no campaign is live for the surface. */
export const PromoBannerView = ({ promo, className = "" }: { promo: PublicPromotion; className?: string }) => (
  <div className={`rounded-3xl border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6 ${className}`}>
    <div className="flex items-start gap-3">
      <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{promo.message || promo.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {promo.description} Sign up by {formatDeadline(promo.signup_deadline)}.
        </p>
        {promo.terms && <p className="mt-2 text-xs text-muted-foreground">{promo.terms}</p>}
      </div>
    </div>
  </div>
);

const PromoBanner = ({ surface, className }: { surface: PromoSurface; className?: string }) => {
  const { data: promo } = useActivePromotion(surface);
  useEffect(() => {
    if (promo) trackPromoViewed(promo.id, surface);
  }, [promo, surface]);
  if (!promo) return null;
  return <PromoBannerView promo={promo} className={className} />;
};

export default PromoBanner;
