import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IssueRichContent from "@/components/thedot/IssueRichContent";
import { splitStoryPreview } from "@/lib/thedot/storyPreview";

const parse = (html: string) => new DOMParser().parseFromString(html, "text/html").body;

describe("The Dot. main story preview", () => {
  it("keeps images, tables, dividers and text on both sides of the preview", () => {
    const story = 'Opening text<h2>Heading</h2><p>First</p><img src="https://example.com/before.jpg"><p>Second</p><img src="https://example.com/after.jpg"><hr><table><tbody><tr><td>Table content</td></tr></tbody></table><p>Third</p>Closing text';
    const { intro, rest } = splitStoryPreview(story);
    expect(parse(intro).querySelectorAll("p")).toHaveLength(2);
    expect(parse(rest).querySelector("p")?.textContent).toBe("Third");
    const rendered = parse(renderToStaticMarkup(<><IssueRichContent body={intro} /><IssueRichContent body={rest} /></>));
    expect(Array.from(rendered.querySelectorAll("img")).map((image) => image.src)).toEqual(["https://example.com/before.jpg", "https://example.com/after.jpg"]);
    expect(rendered.querySelector("td")?.textContent).toBe("Table content");
    expect(rendered.querySelectorAll("hr")).toHaveLength(1);
    expect(rendered.textContent).toContain("Opening text");
    expect(rendered.textContent).toContain("Closing text");
  });

  it("preserves complete nested lists without counting their paragraphs as the preview", () => {
    const list = '<ul><li><p>Outer</p><ul><li><p>Inner</p></li></ul></li><li><p>Last outer item</p></li></ul>';
    const { intro, rest } = splitStoryPreview(`${list}<p>First</p><p>Second</p>${list}<p>Third</p>`);
    for (const part of [intro, rest]) {
      const body = parse(part);
      expect(body.querySelectorAll("li")).toHaveLength(3);
      expect(body.querySelector("ul")?.lastElementChild?.textContent).toBe("Last outer item");
    }
    expect(parse(intro).lastElementChild?.textContent).toBe("Second");
  });

  it("keeps stories with fewer than two paragraphs intact, including media-only stories", () => {
    for (const story of ["", '<img src="https://example.com/photo.jpg"><hr>', "<p>One</p><table><tr><td>Cell</td></tr></table>"]) {
      expect(splitStoryPreview(story)).toEqual({ intro: story, rest: "" });
    }
  });

  it("continues sanitizing both split parts", () => {
    const { intro, rest } = splitStoryPreview('<p onclick="bad()">First</p><p>Second</p><script>bad()</script><img src="https://example.com/photo.jpg" onerror="bad()"><p>Third</p>');
    const rendered = parse(renderToStaticMarkup(<><IssueRichContent body={intro} /><IssueRichContent body={rest} /></>));
    expect(rendered.querySelector("script, [onclick], [onerror]")).toBeNull();
    expect(rendered.querySelector("img")?.src).toBe("https://example.com/photo.jpg");
  });
});