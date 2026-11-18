import { describe, it, expect } from "vitest";
import { parseObservation, relationWeight, isContradicted, cleanText, entityKey } from "../../../supabase/functions/_shared/sentiEngine";

describe("Senti engine rules", () => {
  it("links named people and things through the verb between them", () => {
    const p = parseObservation("Maya waters the garden every morning.");
    expect(p.entities.map((e) => e.key)).toEqual(["maya", "garden"]);
    expect(p.relations[0]).toMatchObject({ source: "maya", target: "garden", predicate: "water", polarity: 1 });
    expect(p.timeHint).toBe("every morning");
  });
  it("marks negated observations", () => {
    expect(parseObservation("Maya did not water the garden yesterday.").relations[0]).toMatchObject({ predicate: "water", polarity: -1 });
  });
  it("normalizes plural and tense so repeats count as the same thing", () => {
    expect(entityKey("Gardens")).toBe(entityKey("garden"));
  });
  it("scores support and contradiction from counts", () => {
    expect(relationWeight(0, 0)).toBe(0.5);
    expect(relationWeight(3, 0)).toBe(0.8);
    expect(relationWeight(1, 1)).toBe(0.5);
    expect(isContradicted(2, 1)).toBe(true);
    expect(isContradicted(2, 0)).toBe(false);
  });
  it("keeps verb stems readable", () => {
    expect(parseObservation("Rosa bakes the bread.").relations[0].predicate).toBe("bake");
    expect(parseObservation("Leo watches the dog.").relations[0].predicate).toBe("watch");
  });
  it("rejects empty or oversized input", () => {
    expect(cleanText("  ")).toBeNull();
    expect(cleanText("x".repeat(401))).toBeNull();
  });
});
