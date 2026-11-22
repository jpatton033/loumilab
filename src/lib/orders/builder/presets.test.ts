import { beforeEach, describe, expect, it } from "vitest";
import { validateDesign } from "./schema";
import { findTemplate } from "./templates";
import { PENDING_DESIGN_KEY, PENDING_DESIGN_TTL, SHOWCASE, STYLE_PRESETS, PREVIEW_START, applyStyle, arrange, readPendingDesign, setPendingDesign } from "./presets";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k),
    clear: () => store.clear(), key: () => null, length: 0,
  } as Storage;
});

describe("one design system", () => {
  it("every showcase website is a design the builder accepts", () => {
    for (const s of SHOWCASE) expect(validateDesign(s.design()).success, s.key).toBe(true);
  });
  it("every style preset produces a valid design", () => {
    for (const p of STYLE_PRESETS) expect(validateDesign(applyStyle(PREVIEW_START(), p)).success).toBe(true);
  });
  it("older saved designs without the new style fields still load", () => {
    const d = findTemplate("bakery").build();
    const { buttonStyle: _b, contentWidth: _c, ...oldTheme } = d.theme;
    expect(validateDesign({ ...d, theme: oldTheme }).success).toBe(true);
  });
  it("rearranging keeps header first and footer last", () => {
    const d = arrange(PREVIEW_START(), ["products", "hero"]);
    expect(d.sections[0].type).toBe("header");
    expect(d.sections.at(-1)?.type).toBe("footer");
  });
});

describe("preview design hand-off", () => {
  it("round-trips a preview design", () => {
    const d = PREVIEW_START();
    expect(setPendingDesign(d)).toBe(true);
    expect(readPendingDesign()?.theme).toEqual(d.theme);
  });
  it("discards a draft older than 24 hours", () => {
    setPendingDesign(PREVIEW_START());
    expect(readPendingDesign(Date.now() + PENDING_DESIGN_TTL + 1000)).toBeNull();
  });
  it("discards a tampered draft", () => {
    const d = PREVIEW_START();
    d.sections[1].props.heading = "<script>alert(1)</script>";
    store.set(PENDING_DESIGN_KEY, JSON.stringify({ design: d, savedAt: Date.now() }));
    expect(readPendingDesign()).toBeNull();
  });
  it("refuses a design whose products section is hidden", () => {
    const d = PREVIEW_START();
    d.sections = d.sections.map((s) => (s.type === "products" ? { ...s, hidden: true } : s));
    expect(setPendingDesign(d)).toBe(false);
  });
});
