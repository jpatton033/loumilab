import { describe, expect, it } from "vitest";
import { computeBalance, priceLine, proposeTotals, type LedgerChange } from "../../supabase/functions/_shared/emailSetupBalance";

const req = { needs_review: false, total_cents: 9900, quote_cents: null };
const paid99 = [{ kind: "charge" as const, amount_cents: 9900 }];

describe("email setup balance", () => {
  it("upgrade $99 → $149 asks only for $50", () => {
    const line = priceLine({ kind: "package_change", quantity: 1 }, "email", "email_domain");
    expect(line.amount_cents).toBe(5000);
    expect(proposeTotals(9900, 9900, [line.amount_cents]).amountDue).toBe(5000);
  });
  it("final order shows $99 + $50 = $149 paid", () => {
    const c: LedgerChange = { status: "paid", total_before_cents: 9900, total_after_cents: 14900, amount_due_cents: 5000 };
    const b = computeBalance(req, [c], [...paid99, { kind: "charge", amount_cents: 5000 }]);
    expect([b.totalCents, b.netPaidCents, b.balanceCents, b.status]).toEqual([14900, 14900, 0, "paid"]);
  });
  it("2 extra mailboxes after payment cost $50", () =>
    expect(priceLine({ kind: "addon", addon: "mailbox", quantity: 2 }, "email", "email").amount_cents).toBe(5000));
  it("custom charge is quantity × unit price", () =>
    expect(priceLine({ kind: "custom", label: "DNS troubleshooting", quantity: 2, unit_cents: 4000 }, "email", "email").amount_cents).toBe(8000));
  it("discounts are always negative", () =>
    expect(priceLine({ kind: "discount", quantity: 1, unit_cents: 1000 }, "email", "email").amount_cents).toBe(-1000));
  it("downgrade after payment creates a credit and no charge", () => {
    const line = priceLine({ kind: "package_change", quantity: 1 }, "email_domain", "email");
    const t = proposeTotals(14900, 14900, [line.amount_cents]);
    expect([t.amountDue, t.credit]).toEqual([0, 5000]);
  });
  it("approved but unpaid change means additional payment required, not paid", () => {
    const c: LedgerChange = { status: "approved", total_before_cents: 9900, total_after_cents: 14900, amount_due_cents: 5000 };
    expect(computeBalance(req, [c], paid99).status).toBe("additional_payment_required");
  });
  it("proposed and canceled changes don't change the total", () => {
    const p: LedgerChange = { status: "proposed", total_before_cents: 9900, total_after_cents: 14900, amount_due_cents: 5000 };
    const x: LedgerChange = { ...p, status: "canceled" };
    const b = computeBalance(req, [p, x], paid99);
    expect([b.totalCents, b.status, b.pendingCents]).toEqual([9900, "paid", 5000]);
  });
  it("a partial refund is partially refunded", () => {
    const c: LedgerChange = { status: "approved", total_before_cents: 14900, total_after_cents: 9900, amount_due_cents: 0 };
    const b = computeBalance(req, [c], [{ kind: "charge", amount_cents: 14900 }, { kind: "refund", amount_cents: 5000 }]);
    expect([b.balanceCents, b.status]).toEqual([0, "partially_refunded"]);
  });
  it("totals can't go negative", () => expect(() => proposeTotals(9900, 0, [-10000])).toThrow());
});
