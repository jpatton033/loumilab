import { describe, it, expect } from "vitest";
import { CHOOSE_PORTAL, resolvePostAuthDestination as r, safeNext, portalSignInPath } from "./portal";

describe("post sign-in destination", () => {
  it("Spaces sign-in lands in the Library", () => {
    expect(r({ portal: "spaces", next: null, hasMerchant: true, isAdmin: true })).toBe("/spaces/app");
  });
  it("Orders merchant lands on the dashboard", () => {
    expect(r({ portal: "orders", next: null, hasMerchant: true, isAdmin: false })).toBe("/orders/dashboard");
  });
  it("Orders user without a business goes to setup", () => {
    expect(r({ portal: "orders", next: null, hasMerchant: false, isAdmin: false })).toBe("/orders/get-started");
  });
  it("admins go to Admin only when no product was chosen", () => {
    expect(r({ portal: null, next: null, hasMerchant: false, isAdmin: true })).toBe("/admin/overview");
  });
  it("keeps a requested same-site page", () => {
    expect(r({ portal: "spaces", next: "/spaces/invite/abc", hasMerchant: false, isAdmin: false })).toBe("/spaces/invite/abc");
  });
  it("rejects off-site destinations", () => {
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(r({ portal: "orders", next: "//evil.com", hasMerchant: true, isAdmin: false })).toBe("/orders/dashboard");
  });
  it("builds product sign-in links", () => {
    expect(portalSignInPath("spaces", "/spaces/app")).toBe("/spaces/sign-in?next=%2Fspaces%2Fapp");
  });
});

describe("multi-product accounts", () => {
  it("asks where to go when the account uses Spaces and Orders", () => {
    expect(r({ portal: null, next: null, hasMerchant: true, hasSpaces: true, isAdmin: false })).toBe(CHOOSE_PORTAL);
  });
  it("Spaces-only account lands in the Library", () => {
    expect(r({ portal: null, next: null, hasMerchant: false, hasSpaces: true, isAdmin: false })).toBe("/spaces/app");
  });
  it("Spaces sign-in goes to Spaces even with a store", () => {
    expect(r({ portal: "spaces", next: null, hasMerchant: true, hasSpaces: true, isAdmin: false })).toBe("/spaces/app");
  });
});
