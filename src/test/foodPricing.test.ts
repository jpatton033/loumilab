import { describe, it, expect } from "vitest";
import { convert, ingredientCost, calculate, initialState, newIngredient } from "@/lib/tools/foodPricing";

describe("food pricing", () => {
  it("converts compatible units", () => {
    expect(convert(8, "oz", "lb")).toBeCloseTo(0.5);
    expect(convert(1, "cup", "tbsp")).toBeCloseTo(16);
  });
  it("refuses incompatible units", () => {
    expect(convert(1, "lb", "cup")).toBeNull();
  });
  it("5 lb bag at $20, 8 oz used = $2", () => {
    const r = ingredientCost({ ...newIngredient(), packagePrice: "20", packageQty: "5", packageUnit: "lb", usedQty: "8", usedUnit: "oz" });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.cost).toBeCloseTo(2);
  });
  it("uses margin math, not markup", () => {
    const s = initialState();
    s.ingredients = [{ ...newIngredient(), packagePrice: "10", packageQty: "1", packageUnit: "each", usedQty: "1", usedUnit: "each" }];
    s.yieldQty = "1";
    s.marginPct = "50";
    const r = calculate(s);
    expect(r.suggestedPrice).toBeCloseTo(20);
    expect(r.margin).toBeCloseTo(50);
    expect(r.markup).toBeCloseTo(100);
  });
  it("buffer and per-item packaging", () => {
    const s = initialState();
    s.ingredients = [{ ...newIngredient(), packagePrice: "10", packageQty: "1", packageUnit: "each", usedQty: "1", usedUnit: "each" }];
    s.yieldQty = "4";
    s.packaging = [{ id: "p", name: "box", amount: "0.5", basis: "item" }];
    s.bufferOn = true;
    s.bufferPct = "10";
    const r = calculate(s);
    expect(r.packaging).toBeCloseTo(2);
    expect(r.buffer).toBeCloseTo(1.2);
    expect(r.perItem).toBeCloseTo(3.3);
  });
});
