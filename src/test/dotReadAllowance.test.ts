import { describe, it, expect } from "vitest";
import { recordRead, shouldGate } from "@/lib/thedot/readAllowance";

const base = { subscribed: false, dismissed: false };

describe("The Dot. read allowance", () => {
  it("does not double count the same issue", () => {
    expect(recordRead(["a"], "a")).toEqual(["a"]);
  });
  it("leaves the first three issues open and gates the fourth", () => {
    expect(shouldGate({ ...base, reads: ["a", "b"] }, "c")).toBe(false);
    expect(shouldGate({ ...base, reads: ["a", "b", "c"] }, "d")).toBe(true);
  });
  it("keeps a previously read free issue open", () => {
    expect(shouldGate({ ...base, reads: ["a", "b", "c", "d"] }, "b")).toBe(false);
  });
  it("never gates subscribers", () => {
    expect(shouldGate({ ...base, subscribed: true, reads: ["a", "b", "c"] }, "d")).toBe(false);
  });
  it("stops gating after dismissal this session", () => {
    expect(shouldGate({ ...base, dismissed: true, reads: ["a", "b", "c"] }, "d")).toBe(false);
  });
});
