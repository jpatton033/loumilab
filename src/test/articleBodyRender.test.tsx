import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ArticleBody from "@/components/kc/ArticleBody";

describe("ArticleBody underline handling", () => {
  it("renders <u> as an element, not literal text", () => {
    const { container } = render(<ArticleBody body={"Hello <u>underlined</u> world"} />);
    expect(container.querySelector("u")).not.toBeNull();
    expect(container.querySelector("u")?.textContent).toBe("underlined");
    expect(container.textContent).not.toContain("<u>");
  });
  it("keeps markdown rendering intact", () => {
    const { container } = render(<ArticleBody body={"## Heading\n\n- item one\n- item two"} />);
    expect(container.querySelector("h2")?.textContent).toBe("Heading");
    expect(container.querySelectorAll("li").length).toBe(2);
  });
  it("strips dangerous raw html", () => {
    const { container } = render(<ArticleBody body={"<script>alert(1)</script>Safe text"} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).not.toContain("alert(1)");
  });
});
