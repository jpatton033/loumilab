import { describe, expect, it } from "vitest";
import { stripDesignationClaims } from "./designation";
import { isReservedName } from "./reserved";

describe("official designation claims", () => {
  it("drops official: true from an imported spaces.json", () => {
    const { manifest, stripped } = stripDesignationClaims({ name: "x", official: true, verified: true });
    expect(manifest).toEqual({ name: "x" });
    expect(stripped).toEqual(["official", "verified"]);
  });
  it("reserves Loumilab product names", () => {
    expect(isReservedName("orders")).toBe(true);
    expect(isReservedName("Spaces")).toBe(true);
    expect(isReservedName("my-bakery")).toBe(false);
  });
});
