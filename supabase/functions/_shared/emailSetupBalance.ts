/**
 * Business Email Setup money rules, in integer cents. Pure: shared by the
 * server (which charges) and tests. Proposed changes never count until the
 * customer approves them.
 */
import { DEVICE_CENTS, MAILBOX_CENTS, PACKAGE_PRICES, STANDALONE_DOMAIN_CENTS, type EmailPackage } from "./emailSetupPricing.ts";

export type ChangeStatus = "proposed" | "approved" | "declined" | "paid" | "canceled";
export interface LedgerRequest { needs_review: boolean; total_cents: number; quote_cents: number | null }
export interface LedgerChange { status: ChangeStatus; total_after_cents: number; total_before_cents: number; amount_due_cents: number }
export interface LedgerPayment { kind: "charge" | "refund"; amount_cents: number }

export const ADDON_PRICES = {
  mailbox: { label: "Additional mailbox setup", cents: MAILBOX_CENTS },
  device: { label: "Additional device configuration", cents: DEVICE_CENTS },
  migration: { label: "Standard email migration", cents: 19900 },
  domain: { label: "Standalone domain setup", cents: STANDALONE_DOMAIN_CENTS },
} as const;
export type AddonKey = keyof typeof ADDON_PRICES;

export const originalTotal = (r: LedgerRequest) => (r.needs_review ? r.quote_cents ?? 0 : r.total_cents);

export interface Balance {
  originalCents: number;
  adjustmentsCents: number;
  totalCents: number;
  chargedCents: number;
  refundedCents: number;
  netPaidCents: number;
  balanceCents: number; // >0 owed by customer, <0 credit owed to customer
  pendingCents: number; // amount awaiting customer approval/payment
  status: "unpaid" | "partially_paid" | "paid" | "additional_payment_required" | "refunded" | "partially_refunded";
}

export function computeBalance(r: LedgerRequest, changes: LedgerChange[], payments: LedgerPayment[]): Balance {
  const originalCents = originalTotal(r);
  // The latest approved/paid change set defines the current agreed total.
  const agreed = changes.filter((c) => c.status === "approved" || c.status === "paid");
  const totalCents = agreed.length ? agreed[agreed.length - 1].total_after_cents : originalCents;
  const chargedCents = payments.filter((p) => p.kind === "charge").reduce((n, p) => n + p.amount_cents, 0);
  const refundedCents = payments.filter((p) => p.kind === "refund").reduce((n, p) => n + p.amount_cents, 0);
  const netPaidCents = chargedCents - refundedCents;
  const balanceCents = totalCents - netPaidCents;
  const pendingCents = changes.filter((c) => c.status === "proposed").reduce((n, c) => n + c.amount_due_cents, 0);

  let status: Balance["status"];
  if (chargedCents === 0) status = "unpaid";
  else if (refundedCents > 0 && netPaidCents <= 0) status = "refunded";
  else if (balanceCents > 0) status = agreed.length && netPaidCents >= originalCents ? "additional_payment_required" : "partially_paid";
  else if (refundedCents > 0) status = "partially_refunded";
  else status = "paid";

  return { originalCents, adjustmentsCents: totalCents - originalCents, totalCents, chargedCents, refundedCents, netPaidCents, balanceCents, pendingCents, status };
}

export interface ChangeLineInput {
  kind: "package_change" | "addon" | "custom" | "discount" | "credit";
  addon?: AddonKey;
  label?: string;
  quantity: number;
  unit_cents?: number;
}

/** Server-side pricing of one proposed line. Discounts and credits are always negative. */
export function priceLine(line: ChangeLineInput, from: EmailPackage, to: EmailPackage) {
  const qty = Math.max(1, Math.floor(line.quantity));
  if (line.kind === "package_change") {
    const diff = PACKAGE_PRICES[to] - PACKAGE_PRICES[from];
    return { label: `Package change: ${from === "email" ? "Email" : "Email + Domain"} → ${to === "email" ? "Email" : "Email + Domain"}`, quantity: 1, unit_cents: diff, amount_cents: diff };
  }
  if (line.kind === "addon") {
    const a = ADDON_PRICES[line.addon ?? "mailbox"];
    const unit = Math.max(0, Math.round(line.unit_cents ?? a.cents));
    return { label: line.label?.trim() || a.label, quantity: qty, unit_cents: unit, amount_cents: unit * qty };
  }
  const unit = Math.abs(Math.round(line.unit_cents ?? 0));
  const sign = line.kind === "custom" ? 1 : -1;
  return { label: line.label?.trim() || (line.kind === "custom" ? "Additional service" : line.kind === "discount" ? "Discount" : "Credit"), quantity: qty, unit_cents: sign * unit, amount_cents: sign * unit * qty };
}

/** What a proposed change set does to the order. */
export function proposeTotals(currentTotal: number, netPaid: number, lineAmounts: number[]) {
  const totalAfter = currentTotal + lineAmounts.reduce((n, a) => n + a, 0);
  if (totalAfter < 0) throw new Error("Changes can't make the total negative.");
  return { totalAfter, amountDue: Math.max(0, totalAfter - netPaid), credit: Math.max(0, netPaid - totalAfter) };
}
