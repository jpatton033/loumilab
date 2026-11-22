import { describe, expect, it } from "vitest";
import { setTrustedImageHosts, validateDesign } from "./schema";
import { TEMPLATES, legacyToDesign, templateForIndustry } from "./templates";
import { builderCaps } from "./gating";

setTrustedImageHosts(["abc.supabase.co"]);
const base = () => TEMPLATES[0].build();

describe("website design validation", () => {
  it("accepts every starter template", () => {
    expect(TEMPLATES).toHaveLength(6);
    for (const t of TEMPLATES) expect(validateDesign(t.build()).success).toBe(true);
  });
  it("rejects script content in text", () => {
    const d = base();
    d.sections[1].props.heading = "<script>alert(1)</script>";
    expect(validateDesign(d).success).toBe(false);
  });
  it("rejects javascript links and event handlers", () => {
    const d = base();
    d.sections[1].props.body = 'x" onerror=alert(1)';
    expect(validateDesign(d).success).toBe(false);
  });
  it("rejects unknown section types", () => {
    const d = base() as unknown as { sections: { type: string }[] };
    d.sections[0].type = "iframe";
    expect(validateDesign(d).success).toBe(false);
  });
  it("rejects images from outside hosts", () => {
    const d = base();
    d.sections[1].props.image = "https://evil.example.com/x.jpg";
    expect(validateDesign(d).success).toBe(false);
  });
  it("accepts merchant uploads from Loumilab storage", () => {
    const d = base();
    d.sections[1].props.image = "https://abc.supabase.co/storage/v1/object/sign/merchant-media/a.jpg?token=x";
    expect(validateDesign(d).success).toBe(true);
  });
  it("requires a visible products section", () => {
    const d = base();
    d.sections = d.sections.map((s) => (s.type === "products" ? { ...s, hidden: true } : s));
    expect(validateDesign(d).success).toBe(false);
  });
  it("rejects non-hex colors", () => {
    const d = base();
    d.theme.accent = "red; background:url(x)";
    expect(validateDesign(d).success).toBe(false);
  });
});

describe("existing stores", () => {
  it("turns a store's name and description into its starting design", () => {
    const d = legacyToDesign({ name: "KTaylor'd Cakes", description: "Custom cakes in Akron.", industry_slug: "bakery" });
    expect(d.template).toBe("bakery");
    const hero = d.sections.find((s) => s.type === "hero")!;
    expect(hero.props.heading).toBe("KTaylor'd Cakes");
    expect(hero.props.body).toBe("Custom cakes in Akron.");
    expect(validateDesign(d).success).toBe(true);
  });
  it("ignores an outside hero image instead of failing", () => {
    const d = legacyToDesign({ name: "A", hero_image_url: "https://elsewhere.com/x.jpg" });
    expect(validateDesign(d).success).toBe(true);
  });
  it("matches templates to business types", () => {
    expect(templateForIndustry("home-services").key).toBe("home");
    expect(templateForIndustry("hair-salon").key).toBe("beauty");
  });
});

describe("plan gating", () => {
  it("Starter (basic) can style but not arrange sections", () => {
    expect(builderCaps("basic")).toEqual({ arrange: false, advancedStyle: false });
  });
  it("Business (advanced) and Premium (full) can arrange sections", () => {
    expect(builderCaps("advanced").arrange).toBe(true);
    expect(builderCaps("full").arrange).toBe(true);
  });
});
