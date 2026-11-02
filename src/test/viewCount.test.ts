import { describe, it, expect } from "vitest";
import { showPublicViews } from "@/lib/kc/viewCount";
describe("public view count", () => {
  it("hides at 124", () => expect(showPublicViews(124)).toBe(false));
  it("shows at 125", () => expect(showPublicViews(125)).toBe(true));
});
