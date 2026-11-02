import { describe, expect, it } from "vitest";
import { isLikelyBot } from "@/lib/tracking/botDetect";

describe("traffic bot filter", () => {
  it("counts a normal desktop Chrome visitor", () => {
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toBe(false);
  });
  it("counts an iPhone Instagram in-app visitor", () => {
    expect(isLikelyBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0")).toBe(false);
  });
  it("skips Googlebot", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
  });
  it("skips headless Chrome", () => {
    expect(isLikelyBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0 Safari/537.36")).toBe(true);
  });
  it("skips automated browsers flagged by webdriver", () => {
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36", true)).toBe(true);
  });
});
