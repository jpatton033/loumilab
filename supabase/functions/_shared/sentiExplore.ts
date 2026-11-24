// Senti Explore rules: splitting sources into passages, plain-language evidence labels and the
// honest capability list. Shared by `senti-studio` and the web app. No AI model, no training.

export const MAX_SOURCE_CHARS = 60_000;
export const MAX_PASSAGES = 250;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const FILE_KINDS: Record<string, "pdf" | "docx" | "txt" | "markdown"> = { pdf: "pdf", docx: "docx", txt: "txt", md: "markdown", markdown: "markdown" };

/** Returns the source kind for a file name, or null when the type isn't supported. */
export function fileKind(name: string): "pdf" | "docx" | "txt" | "markdown" | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return FILE_KINDS[ext] ?? null;
}

/** Validates an upload before reading it. Returns a plain-language error or null. */
export function checkFile(name: string, bytes: number): string | null {
  if (!fileKind(name)) return "Senti can read PDF, Word (.docx), plain text and Markdown files.";
  if (bytes <= 0) return "This file is empty.";
  if (bytes > MAX_FILE_BYTES) return "Files can be up to 10 MB.";
  return null;
}

/** Splits text into sentence passages of at most 400 characters (the rules reader's limit). */
export function splitPassages(text: string): string[] {
  const clean = text.replace(/\r/g, "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ");
  const blocks = clean.split(/\n\s*\n|\n(?=\s*[-*#\d])/).map((b) => b.replace(/\s+/g, " ").trim()).filter(Boolean);
  const out: string[] = [];
  for (const block of blocks) {
    const sentences = block.match(/[^.!?;]+(?:[.!?;]+["')\]]*|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [block];
    for (const s of sentences) {
      if (s.length < 3) continue;
      if (s.length <= 400) { out.push(s); continue; }
      let rest = s;
      while (rest.length > 400) {
        const cut = Math.max(rest.lastIndexOf(",", 400), rest.lastIndexOf(" ", 400));
        const at = cut > 100 ? cut + 1 : 400;
        out.push(rest.slice(0, at).trim()); rest = rest.slice(at).trim();
      }
      if (rest.length >= 3) out.push(rest);
    }
  }
  return out;
}

export type EvidenceStatus = "documented" | "inferred" | "disputed" | "unverified";
/** Plain-language status of a relationship. Never a probability. */
export function evidenceStatus(r: { kind?: string | null; support: number; contradict: number; evidence?: unknown[] | null }): EvidenceStatus {
  if (r.support > 0 && r.contradict > 0) return "disputed";
  if (!r.evidence || r.evidence.length === 0) return "unverified";
  if (r.kind === "fact") return "documented";
  return "inferred";
}

/** "supported by 3 passages, challenged by 1" */
export function supportWords(support: number, contradict: number): string {
  const p = (n: number) => `${n} passage${n === 1 ? "" : "s"}`;
  const a = support > 0 ? `supported by ${p(support)}` : "no supporting passage";
  return contradict > 0 ? `${a}, challenged by ${contradict}` : a;
}

export type Capability = { id: string; label: string; area: "meaning" | "context" | "connections" | "evolution"; status: "operational" | "not_configured"; engine: string | null };
/** What Senti can actually do today. A future engine flips entries to operational. */
export const CAPABILITIES: Capability[] = [
  { id: "passages", label: "Key passages", area: "meaning", status: "operational", engine: "senti-rules-0.1" },
  { id: "entities", label: "People, places, things and ideas", area: "meaning", status: "operational", engine: "senti-rules-0.1" },
  { id: "wording", label: "Positive and negative wording", area: "meaning", status: "operational", engine: "senti-rules-0.1" },
  { id: "time", label: "Time words", area: "context", status: "operational", engine: "senti-rules-0.1" },
  { id: "relations", label: "Relationships between items", area: "connections", status: "operational", engine: "senti-core-0.1" },
  { id: "revision", label: "Revision history", area: "evolution", status: "operational", engine: "senti-core-0.1" },
  { id: "themes", label: "Themes", area: "meaning", status: "not_configured", engine: null },
  { id: "tone", label: "Tone and emotional expression", area: "meaning", status: "not_configured", engine: null },
  { id: "symbolism", label: "Possible symbolism", area: "meaning", status: "not_configured", engine: null },
  { id: "alternatives", label: "Alternative interpretations", area: "meaning", status: "not_configured", engine: null },
  { id: "external_context", label: "Historical and cultural context from other sources", area: "context", status: "not_configured", engine: null },
  { id: "links", label: "Reading web links", area: "context", status: "not_configured", engine: null },
];
