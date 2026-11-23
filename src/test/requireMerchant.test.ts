import { describe, expect, it } from "vitest";
import { merchantSignInHref } from "@/components/orders/RequireMerchant";
describe("dashboard sign-in redirect", () => {
  it("returns the merchant to the dashboard after sign-in", () => {
    expect(merchantSignInHref("/orders/dashboard")).toBe("/orders/sign-in?next=%2Forders%2Fdashboard");
  });
});
