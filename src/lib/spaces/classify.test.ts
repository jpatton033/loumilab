import { describe, it, expect } from "vitest";
import { classifyArchive, checkZipEntry, preservable, statusForKind } from "./spec";

const run = (files: Record<string, string>) => classifyArchive(Object.keys(files), (p) => files[p] ?? null);
const pkg = (deps: Record<string, string>) => JSON.stringify({ dependencies: deps });

describe("Spaces archive classification", () => {
  it("plain static site is publishable", () => {
    expect(run({ "index.html": "<html></html>", "app.js": "" }).kind).toBe("static");
  });
  it("Vite source without dist is Build Required", () => {
    const c = run({ "package.json": pkg({ vite: "5", react: "18" }), "index.html": '<script type="module" src="/src/main.tsx"></script>', "src/main.tsx": "" });
    expect(c.kind).toBe("vite_source");
    expect(statusForKind(c.kind)).toBe("build_required");
  });
  it("Vite project with dist publishes the dist folder", () => {
    const c = run({ "package.json": pkg({ vite: "5", react: "18" }), "index.html": '<script src="/src/main.tsx"></script>', "dist/index.html": "<html></html>" });
    expect(c.kind).toBe("static");
    expect(c.compiledRoot).toBe("dist/");
  });
  it("Next.js server app is unsupported", () => {
    expect(run({ "package.json": pkg({ next: "14", react: "18" }), "app/page.tsx": "" }).kind).toBe("unsupported");
  });
  it("PHP is unsupported", () => {
    expect(run({ "index.php": "<?php" }).kind).toBe("unsupported");
  });
  it("Express backend needs outside services", () => {
    expect(run({ "package.json": pkg({ express: "4" }), "server/index.js": "" }).kind).toBe("needs_services");
  });
  it(".env files are never preserved", () => {
    expect(preservable(".env")).toBe(false);
    expect(preservable("app/.env.local")).toBe(false);
    expect(preservable("node_modules/x/index.js")).toBe(false);
    expect(preservable("src/main.tsx")).toBe(true);
  });
  it("path escape is refused", () => {
    expect(checkZipEntry("../../etc/passwd", 10, 10)).toMatch(/Unsafe/);
    expect(checkZipEntry("/abs.txt", 10, 10)).toMatch(/Unsafe/);
  });
  it("ZIP bomb ratio over 100:1 is refused", () => {
    expect(checkZipEntry("big.bin", 10_000, 20 * 1024 * 1024)).toMatch(/ZIP bomb/);
    expect(checkZipEntry("ok.js", 100_000, 2 * 1024 * 1024)).toBeNull();
  });
});
