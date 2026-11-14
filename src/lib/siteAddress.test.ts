import { describe, it, expect } from "vitest";
import { slugFromHost, customerUrl, isReservedSlug } from "./siteAddress";

describe("customer subdomains", () => {
  it("builds name.loumilab.com", () => expect(customerUrl("bakery")).toBe("https://bakery.loumilab.com"));
  it("reads slug from host", () => expect(slugFromHost("bakery.loumilab.com")).toBe("bakery"));
  it("ignores Loumilab hosts", () => {
    expect(slugFromHost("loumilab.com")).toBeNull();
    expect(slugFromHost("www.loumilab.com")).toBeNull();
    expect(slugFromHost("loumilab.lovable.app")).toBeNull();
  });
  it("reserves admin", () => expect(isReservedSlug("admin")).toBe(true));
});

describe("shareable links before subdomains are live", async () => {
  const { customerShareUrl, SUBDOMAINS_LIVE } = await import("./siteAddress");
  const { storeUrl } = await import("./orders/setup");
  it.skipIf(SUBDOMAINS_LIVE)("copied store link uses the working loumilab.com path", () => {
    expect(storeUrl("bakery")).toBe("https://loumilab.com/orders/store/bakery");
  });
  it.skipIf(SUBDOMAINS_LIVE)("local listing link uses the working path", () => {
    expect(customerShareUrl("local", "bakery")).toBe("https://loumilab.com/orders/local/bakery");
  });
});
