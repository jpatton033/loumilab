import { describe, expect, it } from "vitest";
import { priceEmailSetup, type EmailSetupInput } from "../../supabase/functions/_shared/emailSetupPricing";

const base: EmailSetupInput = {
  package: "email", provider: "google", mailboxes: 1, extraDevices: 0, standaloneDomain: false,
  migration: false, ownsDomain: true, registrarAccess: "yes", complexNeeds: false,
};

describe("email setup pricing", () => {
  it("email package is $99", () => expect(priceEmailSetup(base).totalCents).toBe(9900));
  it("email + domain package is $149", () =>
    expect(priceEmailSetup({ ...base, package: "email_domain", ownsDomain: false }).totalCents).toBe(14900));
  it("adds $25 per extra mailbox and device", () =>
    expect(priceEmailSetup({ ...base, mailboxes: 3, extraDevices: 2 }).totalCents).toBe(9900 + 5000 + 5000));
  it("standalone domain setup adds $49", () =>
    expect(priceEmailSetup({ ...base, standaloneDomain: true }).totalCents).toBe(14800));
  it("migration requires review", () => expect(priceEmailSetup({ ...base, migration: true }).needsReview).toBe(true));
  it("more than 5 mailboxes requires review", () => {
    expect(priceEmailSetup({ ...base, mailboxes: 5 }).needsReview).toBe(false);
    expect(priceEmailSetup({ ...base, mailboxes: 6 }).needsReview).toBe(true);
  });
  it("more than 3 devices requires review", () => {
    expect(priceEmailSetup({ ...base, extraDevices: 3 }).needsReview).toBe(false);
    expect(priceEmailSetup({ ...base, extraDevices: 4 }).needsReview).toBe(true);
  });
  it("unconfirmed registrar access requires review", () =>
    expect(priceEmailSetup({ ...base, registrarAccess: "unsure" }).needsReview).toBe(true));
});
