import { describe, it, expect } from "vitest";
import { LEGACY_STUDIO_ROUTES } from "./routes";

describe("Senti Studio old addresses", () => {
  it("send each old tool to its new home", () => {
    expect(LEGACY_STUDIO_ROUTES.memory).toBe("/senti/studio/research/diagnostics/memory");
    expect(LEGACY_STUDIO_ROUTES.learning).toBe("/senti/studio/research/models");
    expect(LEGACY_STUDIO_ROUTES.datasets).toBe("/senti/studio/library/datasets");
    expect(Object.keys(LEGACY_STUDIO_ROUTES).sort()).toEqual(["datasets", "evaluations", "experiments", "journal", "learning", "memory", "observations"]);
  });
});
