import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, startOrderTip, type PublicOrder } from "@/lib/orders/storefront";
import { toast } from "sonner";

interface Props {
  token: string;
  order: PublicOrder;
}

const PRESETS = [0.1, 0.15, 0.2];

/**
 * Lets a buyer add a tip after their order arrives. The tip is a separate
 * payment that goes straight to the business — Loumilab takes no cut of it.
 */
const TipPanel = ({ token, order }: Props) => {
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  if (order.tip_paid_at || order.tip_cents > 0) {
    return (
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2">
          <Heart className="text-accent" size={18} />
          <p className="font-display font-semibold">Tip sent</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your tip of {formatCents(order.tip_cents, order.currency)} went straight to{" "}
          {order.store_name ?? "the business"}. Thank you.
        </p>
      </div>
    );
  }

  if (!order.tip_eligible) return null;

  const send = async (amountCents: number) => {
    if (busy) return;
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      toast.error("Tips start at $1.00.");
      return;
    }
    setBusy(true);
    try {
      const { url } = await startOrderTip(token, Math.round(amountCents));
      window.location.href = url;
    } catch (err) {
      toast.error("We couldn't start your tip", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <Heart className="text-accent" size={18} />
        <p className="font-display font-semibold">Add a tip</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Happy with your order? {order.store_name ?? "The business"} keeps 100% of your tip —
        Loumilab takes no fee on tips. Available for 24 hours after your order.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((pct) => {
          const cents = Math.max(100, Math.round(order.subtotal_cents * pct));
          return (
            <button
              key={pct}
              type="button"
              disabled={busy}
              onClick={() => void send(cents)}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-transparent hover:bg-foreground hover:text-background disabled:opacity-60"
            >
              {Math.round(pct * 100)}% · {formatCents(cents, order.currency)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-end gap-3">
        <div className="w-40 space-y-2">
          <Label htmlFor="tip-custom">Other amount</Label>
          <Input
            id="tip-custom"
            inputMode="decimal"
            placeholder="5.00"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={busy || !custom.trim()}
          onClick={() => void send(Number(custom) * 100)}
          className="h-10 rounded-full"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : "Add tip"}
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        A tip added now is charged as its own payment, so Stripe's usual card processing fee
        applies to it.
      </p>
    </div>
  );
};

export default TipPanel;
