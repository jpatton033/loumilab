import { describe, expect, it } from "vitest";
import { formatActivity } from "@/lib/support/activity";

const base = { created_at: "2026-10-24T12:00:00Z", by_merchant: false, reason: "Merchant asked" };

describe("merchant support activity", () => {
  it("shows cents as dollars and booleans as On/Off", () => {
    const f = formatActivity({
      ...base,
      action: "support.change.fulfilment",
      old_value: { delivery_fee_cents: 300, delivery_enabled: false },
      new_value: { delivery_fee_cents: 450, delivery_enabled: true },
    });
    expect(f.changes).toEqual(["Delivery fee: $3.00 → $4.50", "Delivery: Off → On"]);
    expect(f.note).toBe("Merchant asked");
  });

  it("never exposes staff identity", () => {
    const f = formatActivity({
      ...base,
      action: "support.view_merchant",
      old_value: null,
      new_value: null,
      // even if extra fields slipped through, they're not rendered
      ...({ actor_email: "staff@loumilab.com", actor_role: "support_admin" } as object),
    });
    expect(JSON.stringify(f)).not.toContain("staff@loumilab.com");
    expect(JSON.stringify(f)).not.toContain("support_admin");
    expect(f.by).toBe("Loumilab support");
  });
});
