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
  it("preserves editor typography, alignment and highlights", () => {
    const markup = renderToStaticMarkup(<IssueRichContent body={'<p style="text-align: center; line-height: 2"><span style="color: rgb(11, 114, 243); font-size: 24px; font-family: Arial, Helvetica, sans-serif">Styled</span><mark style="background-color: #fef08a">Highlighted</mark></p>'} />);
    expect(markup).toContain("text-align:center");
    expect(markup).toContain("line-height:2");
    expect(markup).toContain("color:rgb(11, 114, 243)");
    expect(markup).toContain("font-size:24px");
    expect(markup).toContain("font-family:Arial, Helvetica, sans-serif");
    expect(markup).toContain('<mark style="background-color:#fef08a">Highlighted</mark>');
  });
  it("rejects arbitrary CSS and unsafe values without losing valid formatting", () => {
    const markup = renderToStaticMarkup(<IssueRichContent body={'<p style="text-align: right; position: fixed; background-image: url(https://evil.example); color: expression(alert(1)); line-height: 999"><span style="font-size: 999px; font-family: evil; color: #0b72f3">Safe</span></p><div style="color: #0b72f3">No styles</div><mark style="background-color: url(javascript:bad)">No highlight</mark>'} />);
    expect(markup).toContain("text-align:right");
    expect(markup).toContain("color:#0b72f3");
    expect(markup).not.toMatch(/position|url\(|expression|999|evil|javascript/);
    expect(markup).toContain("<div>No styles</div>");
  });
});