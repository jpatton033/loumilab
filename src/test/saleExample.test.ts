import { describe, expect, it } from "vitest";
import { saleBreakdown } from "@/lib/orders/saleExample";
import { DEFAULT_TIERS, progressiveFee } from "@/lib/orders/feeSchedule";

describe("$100 sale example", () => {
  it("$100 on the $0 plan at 5% = $5.00 fee, $3.20 Stripe est., $91.80 proceeds", () => {
    expect(saleBreakdown(10000, 500)).toEqual({ loumilab: 500, stripe: 320, proceeds: 9180 });
  });
  it("matches checkout's progressive math for the first sale of the month", () => {
    expect(progressiveFee(DEFAULT_TIERS, "launch", 0, 10000)?.feeCents).toBe(500);
  });
});
