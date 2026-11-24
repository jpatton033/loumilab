import { checkFile, fileKind } from "../../../supabase/functions/_shared/sentiExplore";

export async function sha256(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reads text from a PDF, Word, plain text or Markdown file in the browser. Throws plain-language errors. */
export async function extractText(file: File): Promise<{ text: string; kind: "pdf" | "docx" | "txt" | "markdown"; hash: string }> {
  const err = checkFile(file.name, file.size);
  if (err) throw new Error(err);
  const kind = fileKind(file.name)!;
  const buf = await file.arrayBuffer();
  const hash = await sha256(buf);
  let text = "";
  if (kind === "txt" || kind === "markdown") text = new TextDecoder().decode(buf);
  else if (kind === "docx") {
    const mammoth = await import("mammoth");
    text = (await mammoth.extractRawText({ arrayBuffer: buf })).value;
  } else {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 100); i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      pages.push(c.items.map((it: any) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : "")).join(""));
    }
    text = pages.join("\n\n");
  }
  text = text.replace(/\u0000/g, "").trim();
  if (text.length < 3) throw new Error(kind === "pdf" ? "Senti couldn't find text in this PDF. Scanned pages without a text layer can't be read yet." : "Senti couldn't find text in this file.");
  return { text, kind, hash };
}
