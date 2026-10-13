import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IssueRichContent from "@/components/thedot/IssueRichContent";
import { plainToHtml, nonEmptyHtml, safeResourceUrl } from "@/lib/thedot/editorial";

describe("The Dot. editorial content", () => {
  it("preserves legacy paragraph rules and escapes literal markup", () => {
    expect(plainToHtml("One\nTwo")).toBe("<p>One</p><p>Two</p>");
    expect(plainToHtml("One\nline\n\nTwo")).toBe("<p>One<br>line</p><p>Two</p>");
    expect(plainToHtml("<script>alert(1)</script>")).toContain("&lt;script&gt;");
  });
  it("does not publish empty editor blocks", () => {
    expect(nonEmptyHtml("<p></p>")).toBe("");
    expect(nonEmptyHtml("<p>&nbsp;</p>")).toBe("");
    expect(nonEmptyHtml('<p><img src="https://example.com/photo.jpg"></p>')).not.toBe("");
  });
  it("sanitizes unsafe HTML and URLs while retaining editorial formatting", () => {
    const markup = renderToStaticMarkup(<IssueRichContent body={'<p><strong>Bold</strong><u>Underlined</u><script>bad()</script><a href="javascript:alert(1)">link</a><img src="https://example.com/image.jpg" onerror="bad()"><img src="data:image/svg+xml,bad"></p>'} />);
    expect(markup).toContain("<strong>Bold</strong>");
    expect(markup).toContain("<u>Underlined</u>");
    expect(markup).toContain('src="https://example.com/image.jpg"');
    expect(markup).not.toMatch(/<script|onerror|javascript:|data:image/);
    expect(safeResourceUrl("//evil.example")).toBe(false);
    expect(safeResourceUrl("/resources")).toBe(true);
  });
});