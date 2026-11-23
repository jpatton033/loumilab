import { describe, expect, it } from "vitest";
import { SHOWCASE } from "@/lib/orders/builder/presets";

describe("showcase images", () => {
  it("never reuses a photo across the sample websites", () => {
    const all: string[] = [];
    for (const site of SHOWCASE) {
      site.products.forEach((p) => p.image && all.push(p.image));
      for (const s of site.design().sections) {
        if (typeof s.props.image === "string") all.push(s.props.image);
        if (Array.isArray(s.props.images)) all.push(...(s.props.images as string[]));
      }
    }
    expect(all.length).toBe(24);
    expect(new Set(all).size).toBe(all.length);
  });
});
