import { describe, it, expect } from "vitest";
import { splitPassages, evidenceStatus, supportWords, checkFile, fileKind, CAPABILITIES } from "../../../supabase/functions/_shared/sentiExplore";

describe("Senti Explore rules", () => {
  it("splits text into sentence passages no longer than 400 characters", () => {
    const long = "word ".repeat(200) + "end.";
    const p = splitPassages(`Maya baked bread. Jon sold the bread!\n\n${long}`);
    expect(p[0]).toBe("Maya baked bread.");
    expect(p[1]).toBe("Jon sold the bread!");
    expect(p.length).toBeGreaterThan(3);
    expect(p.every((s) => s.length <= 400)).toBe(true);
  });
  it("labels relationships as documented, inferred, disputed or unverified", () => {
    expect(evidenceStatus({ kind: "fact", support: 2, contradict: 0, evidence: ["a"] })).toBe("documented");
    expect(evidenceStatus({ kind: "inferred", support: 1, contradict: 0, evidence: ["a"] })).toBe("inferred");
    expect(evidenceStatus({ kind: "fact", support: 3, contradict: 1, evidence: ["a"] })).toBe("disputed");
    expect(evidenceStatus({ kind: "hypothesis", support: 1, contradict: 0, evidence: [] })).toBe("unverified");
  });
  it("describes support in words, not percentages", () => {
    expect(supportWords(3, 1)).toBe("supported by 3 passages, challenged by 1");
    expect(supportWords(1, 0)).toBe("supported by 1 passage");
  });
  it("accepts PDF, Word, text and Markdown up to 10 MB only", () => {
    expect(fileKind("poem.MD")).toBe("markdown");
    expect(checkFile("letter.pdf", 1000)).toBeNull();
    expect(checkFile("speech.docx", 10 * 1024 * 1024 + 1)).toBe("Files can be up to 10 MB.");
    expect(checkFile("photo.png", 1000)).not.toBeNull();
  });
  it("keeps AI-only reading marked as not available", () => {
    for (const id of ["themes", "tone", "symbolism", "links"]) expect(CAPABILITIES.find((c) => c.id === id)?.status).toBe("not_configured");
  });
});
