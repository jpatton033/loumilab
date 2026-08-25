import { useMemo, useState } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useQuotes,
  useCreateQuote,
  useCreateInvoice,
  useInvoices,
  quoteSubtotal,
  type QuoteLineItem,
} from "@/lib/orders/commerce";
import { formatMoney } from "@/data/orders/storefronts";
import { toast } from "sonner";

interface EstimatesPanelProps {
  merchantId: string;
  /** Deposits and invoicing are separate entitlements from quoting. */
  depositsEnabled: boolean;
  invoicingEnabled: boolean;
}

const emptyLine = (): QuoteLineItem => ({ description: "", quantity: 1, unit_price_cents: 0 });

/**
 * Quotes → deposit → invoice, for service businesses. Totals shown here are
 * for the merchant's benefit; the platform fee is recalculated server-side.
 */
const EstimatesPanel = ({ merchantId, depositsEnabled, invoicingEnabled }: EstimatesPanelProps) => {
  const { data: quotes, isLoading } = useQuotes(merchantId);
  const { data: invoices } = useInvoices(merchantId);
  const createQuote = useCreateQuote(merchantId);
  const createInvoice = useCreateInvoice(merchantId);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [deposit, setDeposit] = useState("");
  const [lines, setLines] = useState<QuoteLineItem[]>([emptyLine()]);

  const subtotal = useMemo(() => quoteSubtotal(lines), [lines]);

  const updateLine = (i: number, patch: Partial<QuoteLineItem>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const reset = () => {
    setTitle("");
    setMessage("");
    setDeposit("");
    setLines([emptyLine()]);
    setOpen(false);
  };

  const send = async () => {
    if (title.trim().length < 2 || subtotal <= 0) {
      toast.error("Add a title and at least one priced line.");
      return;
    }
    try {
      const quote = await createQuote.mutateAsync({
        merchant_id: merchantId,
        title,
        message,
        line_items: lines.filter((l) => l.description.trim()),
        deposit_cents: depositsEnabled ? Math.round((Number(deposit) || 0) * 100) : 0,
      });
      toast.success("Estimate sent", {
        description: `Share link: /orders/quote/${quote.public_token}`,
      });
      reset();
    } catch (err) {
      toast.error("Couldn't send the estimate", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const invoiceBalance = async (quoteId: string, amountCents: number) => {
    try {
      await createInvoice.mutateAsync({
        merchant_id: merchantId,
        quote_id: quoteId,
        kind: "balance",
        amount_cents: amountCents,
      });
      toast.success("Invoice created");
    } catch (err) {
      toast.error("Couldn't create the invoice", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <p className="font-display font-semibold">Estimates</p>
        <Button size="sm" className="rounded-full" onClick={() => setOpen((v) => !v)}>
          <Plus size={15} /> New estimate
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-b border-border bg-secondary/50 px-5 py-6 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="q-title">Title</Label>
            <Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Panel upgrade" />
          </div>

          <div className="space-y-3">
            <Label>Line items</Label>
            {lines.map((line, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1.6fr_0.4fr_0.6fr_auto]">
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  placeholder="Labor, materials, permit…"
                />
                <Input
                  inputMode="numeric"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                  aria-label="Quantity"
                />
                <Input
                  inputMode="decimal"
                  value={line.unit_price_cents ? line.unit_price_cents / 100 : ""}
                  onChange={(e) =>
                    updateLine(i, { unit_price_cents: Math.round((Number(e.target.value) || 0) * 100) })
                  }
                  placeholder="Unit price"
                  aria-label="Unit price"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Remove line"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              Add line
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-message">Message to the customer</Label>
            <Textarea id="q-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          {depositsEnabled && (
            <div className="space-y-2 sm:max-w-[220px]">
              <Label htmlFor="q-deposit">Deposit due up front</Label>
              <Input id="q-deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="font-display font-semibold">Total {formatMoney(subtotal)}</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full" onClick={reset}>
                Cancel
              </Button>
              <Button className="rounded-full" disabled={createQuote.isPending} onClick={send}>
                {createQuote.isPending ? "Sending…" : "Send estimate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {isLoading && <p className="px-6 py-8 text-sm text-muted-foreground">Loading estimates…</p>}
        {!isLoading && !quotes?.length && (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No estimates yet. Create one from a customer request.
          </p>
        )}
        {quotes?.map((q) => {
          const invoiced = invoices?.some((inv) => inv.quote_id === q.id);
          return (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{q.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(q.subtotal_cents)}
                  {q.deposit_cents > 0 && ` · ${formatMoney(q.deposit_cents)} deposit`} ·{" "}
                  <span className="capitalize">{q.status}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/orders/quote/${q.public_token}`);
                    toast.success("Share link copied");
                  }}
                >
                  <Link2 size={14} /> Share
                </Button>
                {invoicingEnabled && !invoiced && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => invoiceBalance(q.id, q.subtotal_cents - q.deposit_cents)}
                  >
                    Invoice balance
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EstimatesPanel;
