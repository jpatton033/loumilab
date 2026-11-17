import { describe, it, expect } from "vitest";
import { normalizeDomain, normalizeQuery, mapDomain } from "../../../supabase/functions/_shared/domainSearch";

describe("domain search rules", () => {
  it("normalizes full domains", () => {
    expect(normalizeDomain("https://www.Acme-Corp.com/about")).toBe("acme-corp.com");
    expect(normalizeDomain("acme")).toBeNull();
    expect(normalizeDomain("-bad.com")).toBeNull();
    expect(normalizeDomain("a b.com")).toBeNull();
  });
  it("rejects unsafe keyword queries", () => {
    expect(normalizeQuery("  Acme   Bakery ")).toBe("acme bakery");
    expect(normalizeQuery("<script>")).toBeNull();
    expect(normalizeQuery("a")).toBeNull();
  });
  it("maps live check results to statuses", () => {
    expect(mapDomain({ name: "x1.dev", registrable: true, tier: "standard", pricing: { currency: "USD", registration_cost: "10.11", renewal_cost: "10.11" } }, true))
      .toMatchObject({ status: "available", verified: true, pricing: { registration: "10.11", renewal: "10.11" } });
    expect(mapDomain({ name: "google.com", registrable: false, reason: "domain_unavailable" }, true)).toMatchObject({ status: "unavailable", pricing: null });
    expect(mapDomain({ name: "my.uk", registrable: false, reason: "extension_not_supported_via_api" }, true)?.status).toBe("unsupported");
    expect(mapDomain({ name: "gold.com", registrable: true, tier: "premium", pricing: { currency: "USD", registration_cost: "2500.00" } }, true)).toMatchObject({ status: "premium", pricing: { renewal: null } });
  });
  it("never invents a price", () => {
    expect(mapDomain({ name: "x2.com", registrable: true, tier: "standard" }, false)?.pricing).toBeNull();
    expect(mapDomain({ name: "x3.com", registrable: true, pricing: { currency: "USD", registration_cost: "free" } }, false)?.pricing).toBeNull();
  });
});
