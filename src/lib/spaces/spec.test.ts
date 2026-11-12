import { describe, it, expect } from "vitest";
import { validateManifest, validateFiles, checkEntryHtml, STARTER_MANIFEST } from "./spec";

describe("Spaces manifest", () => {
  it("accepts the starter manifest", () => expect(validateManifest(STARTER_MANIFEST).ok).toBe(true));
  it("rejects server apps", () => expect(validateManifest({ ...STARTER_MANIFEST, type: "node" }).ok).toBe(false));
  it("requires semantic versions", () => expect(validateManifest({ ...STARTER_MANIFEST, version: "v1" }).ok).toBe(false));
});
describe("Spaces files", () => {
  it("finds the root inside a dist folder", () => {
    const r = validateFiles([{ path: "dist/index.html", size: 10 }, { path: "dist/a.js", size: 5 }]);
    expect(r.root).toBe("dist/"); expect(r.kept.map((f) => f.path)).toEqual(["index.html", "a.js"]);
  });
  it("fails without index.html", () => expect(validateFiles([{ path: "a.js", size: 1 }]).ok).toBe(false));
  it("blocks server files", () => expect(validateFiles([{ path: "index.html", size: 1 }, { path: "api.php", size: 1 }]).ok).toBe(false));
  it("blocks path traversal", () => expect(validateFiles([{ path: "index.html", size: 1 }, { path: "../x.js", size: 1 }]).ok).toBe(false));
  it("warns on root-absolute assets", () => expect(checkEntryHtml('<script src="/assets/a.js">')).toHaveLength(1));
});
