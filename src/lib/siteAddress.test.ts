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
