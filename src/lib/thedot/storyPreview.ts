/** Split after two top-level paragraphs without discarding or cutting other nodes.
 * Parsing is inert; both parts still pass through IssueRichContent's sanitizer.
 */
export function splitStoryPreview(html: string): { intro: string; rest: string } {
  if (!html || typeof DOMParser === "undefined") return { intro: html, rest: "" };

  const document = new DOMParser().parseFromString(html, "text/html");
  const nodes = Array.from(document.body.childNodes);
  let paragraphs = 0;
  const boundary = nodes.findIndex((node) => {
    if (node.nodeType === 1 && node.nodeName === "P") paragraphs += 1;
    return paragraphs === 2;
  });
  if (boundary === -1) return { intro: html, rest: "" };

  const intro = document.createElement("div");
  const rest = document.createElement("div");
  nodes.forEach((node, index) => (index <= boundary ? intro : rest).appendChild(node));
  return { intro: intro.innerHTML, rest: rest.innerHTML };
}