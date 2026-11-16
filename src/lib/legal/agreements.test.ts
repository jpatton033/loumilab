import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { agreementSections, contentHash, CHECKBOX_LABEL } from "./agreements";

const text = readFileSync("src/content/legal/spaces-hosting-v1.0.md", "utf8");

describe("Spaces Hosting & Acceptable Use Agreement v1.0", () => {
  it("contains all 22 numbered sections in order", () => {
    const s = agreementSections(text);
    expect(s.map((x) => x.n)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
    expect(s[21].title).toBe("Contact Information");
  });
  it("ends with the full contact section (no truncation)", () => {
    expect(text.trim().endsWith("provided through Loumilab's official website.")).toBe(true);
  });
  it("hashes identically to the database fingerprint", async () => {
    expect(await contentHash(text)).toBe("9129bbf63187b17b7b0ff6271023c13158cc49a3b775f8143ec5bc1a69b32992");
  });
  it("uses the exact sign-up wording", () => {
    expect(CHECKBOX_LABEL).toBe("I agree to the Loumilab Terms of Service and Spaces Hosting & Acceptable Use Agreement, and acknowledge the Privacy Policy.");
  });
});
