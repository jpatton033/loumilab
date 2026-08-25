import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCents, startStorefrontCheckout, type LiveStorefront } from "@/lib/orders/storefront";
import type { CartLine } from "@/hooks/use-cart";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: LiveStorefront;
  lines: CartLine[];
  subtotalCents: number;
  defaults?: { name?: string; email?: string };
}

/**
 * Collects contact and fulfilment details, then hands off to Stripe Checkout.
 * All money is recalculated server-side — nothing here is authoritative.
 */
const CheckoutSheet = ({ open, onOpenChange, store, lines, subtotalCents, defaults }: Props) => {
  const [name, setName] = useState(defaults?.name ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [phone, setPhone] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">(
    store.pickup_enabled ? "pickup" : "delivery",
  );
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const deliveryFee = fulfilment === "delivery" ? store.delivery_fee_cents : 0;
  const belowMinimum = fulfilment === "delivery" && subtotalCents < store.delivery_minimum_cents;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { url } = await startStorefrontCheckout({
        slug: store.slug,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined },
        fulfilment,
        delivery_address: fulfilment === "delivery" ? address.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      window.location.href = url;
    } catch (err) {
      toast.error("Checkout couldn't start", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">Checkout</SheetTitle>
          <SheetDescription>
            {store.name} · payment is processed securely by Stripe.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mx-auto mt-6 max-w-lg space-y-5 pb-6">
          <div className="space-y-2">
            <Label htmlFor="co-name">Full name</Label>
            <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="co-email">Email</Label>
              <Input
                id="co-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone (optional)</Label>
              <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </div>
          </div>

          {store.pickup_enabled && store.delivery_enabled && (
            <div className="flex gap-2">
              {(["pickup", "delivery"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFulfilment(option)}
                  className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    fulfilment === option
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {fulfilment === "delivery" && (
            <div className="space-y-2">
              <Label htmlFor="co-address">Delivery address</Label>
              <Textarea
                id="co-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                maxLength={300}
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="co-notes">Notes (optional)</Label>
            <Textarea
              id="co-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
            />
          </div>

          <div className="rounded-2xl border border-border bg-secondary p-4 text-sm">
            {lines.map((l) => (
              <div key={l.product.id} className="flex justify-between gap-4 py-1">
                <span className="text-muted-foreground">
                  {l.quantity} × {l.product.name}
                </span>
                <span>{formatCents(l.quantity * l.product.priceCents, store.currency)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-display font-semibold">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents, store.currency)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between pt-1 text-muted-foreground">
                <span>Delivery</span>
                <span>{formatCents(deliveryFee, store.currency)}</span>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Tax is calculated at checkout.
            </p>
          </div>

          {belowMinimum && (
            <p className="text-sm text-destructive">
              Delivery orders start at {formatCents(store.delivery_minimum_cents, store.currency)}.
            </p>
          )}

          <Button type="submit" disabled={busy || belowMinimum} className="h-12 w-full rounded-full">
            {busy ? <Loader2 className="animate-spin" size={16} /> : "Continue to payment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CheckoutSheet;
