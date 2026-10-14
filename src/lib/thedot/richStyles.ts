/** Only editor-generated typography is allowed; never URLs, layout or arbitrary CSS. */
const color = /^(?:#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d.,%\s]+\))$/i;
const families = new Set([
  "Arial, Helvetica, sans-serif", "Helvetica, Arial, sans-serif",
  "Georgia, 'Times New Roman', serif", "'Times New Roman', Times, serif",
  "Verdana, Geneva, sans-serif", "Tahoma, Geneva, sans-serif", "'Courier New', monospace",
].map((family) => family.toLowerCase().replace(/["']/g, "")));
const supportedTags = new Set(["p", "h1", "h2", "h3", "span", "mark"]);

export function safeEditorialStyle(style: string, tag: string): string {
  if (!supportedTags.has(tag)) return "";
  return style.split(";").flatMap((declaration) => {
    const colon = declaration.indexOf(":");
    if (colon < 0) return [];
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    const block = /^(p|h[1-3])$/.test(tag);
    const allowed =
      (property === "color" && color.test(value)) ||
      (property === "background-color" && tag === "mark" && color.test(value)) ||
      (property === "font-size" && /^(12|13|14|15|16|18|20|24|28|32|36)px$/.test(value)) ||
      (property === "font-family" && families.has(value.toLowerCase().replace(/["']/g, ""))) ||
      (property === "text-align" && block && /^(left|center|right|justify)$/.test(value)) ||
      (property === "line-height" && block && /^(1\.2|1\.15|1\.5|2)$/.test(value));
    return allowed ? [`${property}: ${value}`] : [];
  }).join("; ");
}

interface HtmlNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
}

/** Runs after raw HTML parsing and before the standard HTML sanitizer. */
export function rehypeEditorialStyles() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.properties && "style" in node.properties) {
        const style = safeEditorialStyle(String(node.properties.style), node.tagName ?? "");
        if (style) node.properties.style = style;
        else delete node.properties.style;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}