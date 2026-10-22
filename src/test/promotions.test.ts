import { describe, expect, it } from "vitest";
import { effectiveFeeBps } from "../../supabase/functions/_shared/promoFee";
import { promoDaysLeft } from "@/lib/orders/promotions";

const now = new Date("2026-11-01T12:00:00Z");
const future = "2026-11-10T12:00:00Z";
const past = "2026-10-30T12:00:00Z";

describe("promotion platform fee", () => {
  it("charges 0% during an active 0% promo", () => {
    expect(effectiveFeeBps(500, { status: "active", expires_at: future, promo_fee_bps: 0 }, now)).toBe(0);
  });
  it("returns the plan fee once the promo has expired, even before cleanup", () => {
    expect(effectiveFeeBps(500, { status: "active", expires_at: past, promo_fee_bps: 0 }, now)).toBe(500);
  });
  it("never raises the fee above the plan", () => {
    expect(effectiveFeeBps(300, { status: "active", expires_at: future, promo_fee_bps: 800 }, now)).toBe(300);
  });
  it("never goes negative", () => {
    expect(effectiveFeeBps(500, { status: "active", expires_at: future, promo_fee_bps: -200 }, now)).toBe(0);
  });
  it("ignores qualified-but-not-started and ended promos", () => {
    expect(effectiveFeeBps(500, { status: "qualified", expires_at: null, promo_fee_bps: 0 }, now)).toBe(500);
    expect(effectiveFeeBps(500, { status: "ended", expires_at: future, promo_fee_bps: 0 }, now)).toBe(500);
  });
  it("counts 14 days left right after a 14-day promo starts", () => {
    expect(promoDaysLeft(new Date(now.getTime() + 14 * 86_400_000).toISOString(), now)).toBe(14);
  });
});
