import { describe, expect, it } from "vitest";
import { computeFunds, handoffMissing, HANDOFF_ITEMS, MANAGEMENT_PLANS, purchaseAllowed, quoteTotals } from "../../supabase/functions/_shared/emailSetupPurchasing";
import { priceEmailSetup } from "../../supabase/functions/_shared/emailSetupPricing";

describe("customer-funded purchasing", () => {
  it("quote for $149 setup + $15 domain + $7 hosting totals $171", () => {
    const q = quoteTotals(14900, [{ label: "Domain", cents: 1500, billing: "1 year" }, { label: "Email", cents: 700, billing: "1 month" }]);
    expect(q).toEqual({ serviceCents: 14900, thirdPartyCents: 2200, totalCents: 17100 });
  });

  it("rejects zero or negative provider costs", () => {
    expect(() => quoteTotals(14900, [{ label: "Domain", cents: 0, billing: "" }])).toThrow();
  });

  it("choosing Loumilab-buys always needs a confirmed quote first", () => {
    const base = { package: "email_domain" as const, provider: "google" as const, mailboxes: 1, extraDevices: 0, standaloneDomain: false, migration: false, ownsDomain: false, registrarAccess: "yes" as const, complexNeeds: false };
    expect(priceEmailSetup(base).needsReview).toBe(false);
    expect(priceEmailSetup({ ...base, loumilabPurchase: true }).needsReview).toBe(true);
  });

  it("splits revenue from held funds and shows unspent money owed back", () => {
    const f = computeFunds({ agreedTotalCents: 17100, budgetCents: 2200, netPaidCents: 17100, purchases: [{ amount_cents: 1300 }, { amount_cents: 700 }] });
    expect(f.serviceRevenueCents).toBe(14900);
    expect(f.purchasingFundsCents).toBe(2200);
    expect(f.spentCents).toBe(2000);
    expect(f.unspentOwedCents).toBe(200);
  });

  it("refunding unspent funds brings the remainder to zero, never revenue", () => {
    const f = computeFunds({ agreedTotalCents: 17100, budgetCents: 2200, netPaidCents: 16900, purchases: [{ amount_cents: 2000 }] });
    expect(f.remainingCents).toBe(0);
    expect(f.serviceRevenueCents).toBe(14900);
  });

  it("blocks a purchase above what the customer approved and paid", () => {
    expect(purchaseAllowed(2200, 2500)).toBe(false);
    expect(purchaseAllowed(2200, 2200)).toBe(true);
  });

  it("cannot complete a Loumilab-purchased order until all 10 handoff items are done", () => {
    const all = Object.fromEntries(HANDOFF_ITEMS.map(([k]) => [k, true]));
    expect(handoffMissing("loumilab_purchase", { ...all, email_billing: false }).canComplete).toBe(false);
    expect(handoffMissing("loumilab_purchase", all).canComplete).toBe(true);
    expect(handoffMissing("loumilab_purchase", all, true).canComplete).toBe(false);
  });

  it("management plans are $19 and $39 per month", () => {
    expect(MANAGEMENT_PLANS.essential.cents).toBe(1900);
    expect(MANAGEMENT_PLANS.business.cents).toBe(3900);
  });
});
