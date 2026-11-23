import { describe, expect, it } from "vitest";
import { merchantGuardDecision, merchantSignInHref } from "@/components/orders/RequireMerchant";
describe("dashboard sign-in redirect", () => {
  it("returns the merchant to the dashboard after sign-in", () => {
    expect(merchantSignInHref("/orders/dashboard")).toBe("/orders/sign-in?next=%2Forders%2Fdashboard");
  });
  it("waits for a fresh store lookup instead of trusting a cached 'no store' after sign-in", () => {
    expect(merchantGuardDecision({ session: "in", isPending: false, isFetching: true, hasMerchant: false })).toBe("loading");
  });
  it("sends a signed-in owner without a store to setup once the lookup finishes", () => {
    expect(merchantGuardDecision({ session: "in", isPending: false, isFetching: false, hasMerchant: false })).toBe("setup");
  });
  it("opens the dashboard for a signed-in owner with a store", () => {
    expect(merchantGuardDecision({ session: "in", isPending: false, isFetching: true, hasMerchant: true })).toBe("dashboard");
  });
  it("sends signed-out visitors to sign-in", () => {
    expect(merchantGuardDecision({ session: "out", isPending: false, isFetching: false, hasMerchant: false })).toBe("sign-in");
  });
});
