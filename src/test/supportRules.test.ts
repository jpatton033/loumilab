import { describe, expect, it } from "vitest";
import { canChange, fieldAllowed, grantIsActive } from "@/lib/support/rules";

const now = new Date("2026-10-24T12:00:00Z");
const active = { status: "active", expires_at: "2026-10-24T13:00:00Z", scopes: ["catalog"] };

describe("support rules", () => {
  it("never lets support change ownership, plan or payout fields", () => {
    for (const f of ["owner_id", "plan_slug", "stripe_account_id", "contact_email"]) {
      expect(fieldAllowed("store_details", f)).toBe(false);
      expect(fieldAllowed("catalog", f)).toBe(false);
    }
  });
  it("expired or revoked grants allow nothing", () => {
    expect(grantIsActive({ ...active, expires_at: "2026-10-24T11:59:00Z" }, now)).toBe(false);
    expect(grantIsActive({ ...active, status: "revoked" }, now)).toBe(false);
    expect(grantIsActive(active, now)).toBe(true);
  });
  it("viewers cannot change even with a grant; specialists only within scope", () => {
    expect(canChange(1, [active], "catalog", now)).toBe(false);
    expect(canChange(2, [active], "catalog", now)).toBe(true);
    expect(canChange(2, [active], "store_details", now)).toBe(false);
  });
});
