import { describe, expect, it } from "vitest";
import { marginalBps, nextThreshold, progressiveFee } from "../../supabase/functions/_shared/progressiveFee";
import { DEFAULT_TIERS as T } from "@/lib/orders/feeSchedule";

const month = (plan: string, dollars: number) => progressiveFee(T, plan, 0, Math.round(dollars * 100))!.feeCents;

describe("progressive platform fee (monthly totals)", () => {
  it("Launch $6,000 → $277.50", () => expect(month("launch", 6000)).toBe(27750));

  const cases: Record<string, Record<number, number>> = {
    launch: { 0: 0, 2500: 12500, 2500.01: 12500, 5000: 23750, 5000.01: 23750, 10000: 43750, 10000.01: 43750, 20000: 78750 },
    starter: { 0: 0, 2500: 9750, 2500.01: 9750, 5000: 18250, 5000.01: 18250, 10000: 32750, 10000.01: 32750, 20000: 56750 },
    business: { 0: 0, 2500: 7250, 2500.01: 7250, 5000: 13250, 5000.01: 13250, 10000: 22750, 10000.01: 22750, 20000: 36750 },
  };
  for (const [plan, rows] of Object.entries(cases)) {
    for (const [sales, fee] of Object.entries(rows)) {
      it(`${plan} $${sales} → ${fee}¢`, () => expect(month(plan, Number(sales))).toBe(fee));
    }
  }
});

describe("tier boundaries", () => {
  it("$2,500.01 puts the extra cent in tier 2", () => {
    const r = progressiveFee(T, "launch", 0, 250001)!;
    expect(r.slices).toEqual([{ tier: 0, bps: 500, cents: 250000 }, { tier: 1, bps: 450, cents: 1 }]);
  });
  it("an order crossing a threshold is split", () => {
    const r = progressiveFee(T, "launch", 200000, 100000)!; // $2,000 → $3,000
    expect(r.slices.map((s) => s.cents)).toEqual([50000, 50000]);
    expect(r.feeCents).toBe(2500 + 2250);
  });
  it("orders summed one by one never exceed the monthly marginal total", () => {
    let vol = 0, total = 0;
    for (const o of [123456, 98765, 250000, 77777, 300000]) { total += progressiveFee(T, "starter", vol, o)!.feeCents; vol += o; }
    expect(Math.abs(total - progressiveFee(T, "starter", 0, vol)!.feeCents)).toBeLessThanOrEqual(5);
  });
  it("marginal rate and next threshold at exactly $2,500", () => {
    expect(marginalBps(T, "business", 250000)).toBe(240);
    expect(marginalBps(T, "business", 249999)).toBe(290);
    expect(nextThreshold(T, 250000)).toBe(500000);
    expect(nextThreshold(T, 1000001)).toBeNull();
  });
  it("a plan without tiers falls back (null)", () => expect(progressiveFee(T, "custom", 0, 1000)).toBeNull());
  it("refunds lowering volume move the next order back to the higher rate", () => {
    expect(marginalBps(T, "launch", 260000 - 20000)).toBe(500);
  });
});

describe("public pricing copy matches checkout math", async () => {
  const { bandLabels } = await import("@/components/orders/ProgressiveFees");
  it("bands read First/Next/Next/Above", () =>
    expect(bandLabels(T)).toEqual(["First $2,500", "Next $2,500", "Next $5,000", "Above $10,000"]));
  it("example slices for Launch $6,000", () => {
    const r = progressiveFee(T, "launch", 0, 600000)!;
    expect(r.slices.map((s) => [s.bps, s.cents])).toEqual([[500, 250000], [450, 250000], [400, 100000]]);
  });
});
