import { BadgePercent } from "lucide-react";
import { bpsToPct, isMerchantPromoLive, promoDaysLeft, TRIGGER_LABELS, useMyMerchantPromotion } from "@/lib/orders/promotions";

/** Merchant's own promo status. Hidden when they have none. */
const MerchantPromoCard = ({ merchantId }: { merchantId?: string }) => {
  const { data: mp } = useMyMerchantPromotion(merchantId);
  if (!mp) return null;
  const live = isMerchantPromoLive(mp);
  if (!live && mp.status !== "qualified") return null;
  const days = promoDaysLeft(mp.expires_at);
  return (
    <div className="mt-6 flex items-start gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-4">
      <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="text-sm">
        {live ? (
          <>
            <p className="font-semibold text-foreground">
              Promo fee active: {bpsToPct(mp.promo_fee_bps)} Loumilab fee · {days} {days === 1 ? "day" : "days"} left
            </p>
            <p className="mt-1 text-muted-foreground">
              Ends {new Date(mp.expires_at!).toLocaleDateString()}. Then your normal {bpsToPct(mp.normal_fee_bps)} fee returns automatically. Stripe processing fees still apply.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">You've qualified for {mp.duration_days} days at a {bpsToPct(mp.promo_fee_bps)} Loumilab fee.</p>
            <p className="mt-1 text-muted-foreground">It starts {TRIGGER_LABELS[mp.start_trigger].toLowerCase()}.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MerchantPromoCard;
