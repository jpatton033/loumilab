import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Doc = { title: string; version: string; content: string; effective_date: string | null; content_hash?: string };

const fmtDate = (d: string | null) => d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not yet effective (draft)";

const md = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="mb-4 font-hero text-2xl font-semibold text-foreground" {...p} />,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="mb-3 mt-8 font-hero text-lg font-semibold text-foreground" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="mb-2 mt-5 font-semibold text-foreground" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mb-3 text-sm leading-relaxed text-foreground/85" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-foreground/85" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-foreground/85" {...p} />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="underline underline-offset-4" target="_blank" rel="noreferrer" {...p} />,
  hr: () => <hr className="my-6 border-border" />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-foreground" {...p} />,
};

export function AgreementBody({ doc }: { doc: Doc }) {
  return <article><ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{doc.content}</ReactMarkdown></article>;
}

export function printAgreement(doc: Doc) {
  const w = window.open("", "_blank", "noopener=no");
  if (!w) return;
  const html = DOMPurify.sanitize(marked.parse(doc.content, { async: false }) as string);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  w.document.write(`<!doctype html><html><head><title>${esc(doc.title)} v${esc(doc.version)}</title><style>body{font:14px/1.6 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:22px}h2{font-size:16px;margin-top:28px}.meta{color:#555;font-size:12px;border-bottom:1px solid #ddd;padding-bottom:12px}</style></head><body><p class="meta">Version ${esc(doc.version)} · Effective ${esc(fmtDate(doc.effective_date))}${doc.content_hash ? ` · Fingerprint ${esc(doc.content_hash.slice(0, 16))}` : ""}</p>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}

/** Accessible full-text viewer; closing it never touches the surrounding form. */
export function AgreementViewer({ doc, open, onOpenChange, footer }: { doc: Doc | null; open: boolean; onOpenChange: (o: boolean) => void; footer?: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-left sm:px-6">
          <DialogTitle className="pr-8 font-hero text-lg">{doc?.title ?? "Agreement"}</DialogTitle>
          <DialogDescription>{doc ? `Version ${doc.version} · Effective ${fmtDate(doc.effective_date)}` : "Loading…"}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6" tabIndex={0} aria-label="Agreement text">
          {doc ? <AgreementBody doc={doc} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
        </div>
        <DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:px-6">
          {doc && <Button variant="outline" onClick={() => printAgreement(doc)}><Printer size={16} /> Print or save as PDF</Button>}
          {footer ?? <Button onClick={() => onOpenChange(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
