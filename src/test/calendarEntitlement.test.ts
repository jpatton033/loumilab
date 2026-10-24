import { describe, it, expect } from "vitest";
import { resolveEntitlements, isEnabled } from "@/lib/orders/entitlements";

describe("calendar sync entitlement", () => {
  it("is enabled on the Free plan", () => {
    expect(isEnabled(resolveEntitlements({ entitlements: {} } as never), "calendar.sync")).toBe(true);
  });
});
