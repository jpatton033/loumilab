import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, type LiveStorefront } from "@/lib/orders/storefront";

type DeliveryTier = { max_miles: number; fee_cents: number };

interface Props {
  store: LiveStorefront;
  /** Saves columns on the storefront record. */
  patch: (values: Record<string, unknown>) => void;
}

const toCents = (value: string) => {
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
};

const toDollars = (cents: number) => (cents / 100).toFixed(2);

/**
 * Fees and delivery pricing. Every figure here is charged by the server, so
 * what a merchant sets is exactly what a customer pays.
 */
const FeesPanel = ({ store, patch }: Props) => {
  const [tiers, setTiers] = useState<DeliveryTier[]>(
    Array.isArray(store.delivery_tiers) ? store.delivery_tiers : [],
  );

  const saveTiers = (next: DeliveryTier[]) => {
    const cleaned = next
      .filter((t) => t.max_miles > 0)
      .sort((a, b) => a.max_miles - b.max_miles);
    setTiers(next);
    patch({ delivery_tiers: cleaned });
  };

  const sharePercent = (store.customer_fee_share_bps / 100).toString();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <p className="font-display font-semibold">Fees and delivery pricing</p>
      <p className="mt-1 text-sm text-muted-foreground">
        These amounts are added to a customer's order total. Leave anything at zero to switch it off.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fee-service">Service fee</Label>
          <Input
            id="fee-service"
            inputMode="decimal"
            defaultValue={toDollars(store.service_fee_cents)}
            onBlur={(e) => patch({ service_fee_cents: toCents(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">A flat amount added to delivery orders.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-service-label">What customers see it called</Label>
          <Input
            id="fee-service-label"
            defaultValue={store.service_fee_label ?? "Service fee"}
            maxLength={40}
            onBlur={(e) => patch({ service_fee_label: e.target.value.trim() || "Service fee" })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-share">Card fee passed to customers (%)</Label>
          <Input
            id="fee-share"
            inputMode="decimal"
            defaultValue={sharePercent}
            onBlur={(e) => {
              const pct = Math.min(5, Math.max(0, Number(e.target.value) || 0));
              patch({ customer_fee_share_bps: Math.round(pct * 100) });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Shown as a processing fee. Up to 5%. Leave at 0 to absorb it yourself.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-minimum">Delivery minimum order</Label>
          <Input
            id="fee-minimum"
            inputMode="decimal"
            defaultValue={toDollars(store.delivery_minimum_cents)}
            onBlur={(e) => patch({ delivery_minimum_cents: toCents(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-delivery">Standard delivery fee</Label>
          <Input
            id="fee-delivery"
            inputMode="decimal"
            defaultValue={toDollars(store.delivery_fee_cents)}
            onBlur={(e) => patch({ delivery_fee_cents: toCents(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">
            Used when no distance band below matches.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-radius">Delivery radius (miles)</Label>
          <Input
            id="fee-radius"
            inputMode="numeric"
            defaultValue={store.delivery_radius_miles ?? ""}
            onBlur={(e) => {
              const n = Number(e.target.value);
              patch({ delivery_radius_miles: Number.isFinite(n) && n > 0 ? Math.round(n) : null });
            }}
          />
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold">Charge more for longer trips</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Set a fee for each distance band. A customer within the first band pays that band's fee.
        </p>

        <div className="mt-4 space-y-3">
          {tiers.map((tier, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <div className="w-32 space-y-1.5">
                <Label className="text-xs">Up to (miles)</Label>
                <Input
                  inputMode="decimal"
                  defaultValue={tier.max_miles || ""}
                  onBlur={(e) => {
                    const next = [...tiers];
                    next[index] = { ...tier, max_miles: Number(e.target.value) || 0 };
                    saveTiers(next);
                  }}
                />
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs">Fee</Label>
                <Input
                  inputMode="decimal"
                  defaultValue={toDollars(tier.fee_cents)}
                  onBlur={(e) => {
                    const next = [...tiers];
                    next[index] = { ...tier, fee_cents: toCents(e.target.value) };
                    saveTiers(next);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove band"
                className="mb-0.5"
                onClick={() => saveTiers(tiers.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-full"
          onClick={() =>
            setTiers([
              ...tiers,
              { max_miles: tiers.length ? tiers[tiers.length - 1].max_miles + 3 : 3, fee_cents: store.delivery_fee_cents },
            ])
          }
        >
          <Plus size={14} /> Add distance band
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Example: a {formatCents(2500, store.currency)} pickup order today costs a customer{" "}
        {formatCents(2500 + Math.round((2500 * store.customer_fee_share_bps) / 10000), store.currency)}{" "}
        before tax. The same order for delivery adds your delivery fee and{" "}
        {formatCents(store.service_fee_cents, store.currency)} service fee.
      </p>
    </div>
  );
};

export default FeesPanel;
