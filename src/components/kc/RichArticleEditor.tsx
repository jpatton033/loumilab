import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, List, ListOrdered, Quote, Minus,
  Link2, Unlink, Undo2, Redo2, RemoveFormatting,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", hr: "---" });
td.use(gfm);
td.addRule("underline", { filter: ["u"], replacement: (c) => `<u>${c}</u>` });

export const mdToHtml = (md: string) => marked.parse(md || "", { async: false, gfm: true, breaks: false }) as string;
export const htmlToMd = (html: string) => td.turndown(html).trim();

/** Strip external styling and demote H1s from pasted HTML. */
export const cleanPastedHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("style,meta,script,link,title,o\\:p,xml").forEach((n) => n.remove());
  doc.querySelectorAll("h1").forEach((h) => {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h.innerHTML;
    h.replaceWith(h2);
  });
  doc.querySelectorAll("h5,h6").forEach((h) => {
    const h4 = doc.createElement("h4");
    h4.innerHTML = h.innerHTML;
    h.replaceWith(h4);
  });
  // Google Docs wraps everything in <b id="docs-internal-guid...">
  doc.querySelectorAll('b[id^="docs-internal-guid"]').forEach((b) => b.replaceWith(...Array.from(b.childNodes)));
  doc.querySelectorAll("span,font").forEach((s) => {
    const st = (s.getAttribute("style") || "").toLowerCase();
    let inner: Node[] = Array.from(s.childNodes);
    const wrap = (tag: string) => {
      const el = doc.createElement(tag);
      inner.forEach((n) => el.appendChild(n));
      inner = [el];
    };
    if (/font-weight:\s*(bold|[6-9]00)/.test(st)) wrap("strong");
    if (/font-style:\s*italic/.test(st)) wrap("em");
    if (/text-decoration[^;]*underline/.test(st)) wrap("u");
    s.replaceWith(...inner);
  });
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const a of Array.from(el.attributes)) {
      if (!(el.tagName === "A" && a.name === "href")) el.removeAttribute(a.name);
    }
  });
  return doc.body.innerHTML;
};

const looksLikeMarkdown = (t: string) =>
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/.test(t);

/** Plain text -> HTML preserving structure. */
export const plainTextToHtml = (text: string) => {
  const t = text.replace(/\r\n?/g, "\n").replace(/^(\s*)#\s/gm, "$1## ");
  if (looksLikeMarkdown(t)) {
    // Ensure single newlines between blocks still split paragraphs.
    const spaced = t.replace(/([^\n])\n(?!\s*([-*+]\s|\d+[.)]\s|>))(?=\S)/g, "$1\n\n");
    return mdToHtml(spaced);
  }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return t
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${esc(l)}</p>`)
    .join("");
};

interface Props {
  value: string;
  onChange: (markdown: string) => void;
}

const Btn = ({ label, active, onClick, disabled, children }: {
  label: string; active?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40",
          active && "bg-secondary text-foreground",
        )}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const Sep = () => <span className="mx-1 h-5 w-px bg-border" />;

const blockValue = (e: Editor) =>
  e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "p";

const LinkButton = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const apply = () => {
    const href = url.trim();
    if (!href) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/|#)/.test(href) ? href : `https://${href}` }).run();
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setUrl(editor.getAttributes("link").href ?? ""); }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Add or edit link"
              className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground", editor.isActive("link") && "bg-secondary text-foreground")}
            >
              <Link2 size={16} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Add or edit link</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 space-y-3">
        <Input autoFocus placeholder="https://example.com or /orders" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" type="button" onClick={apply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const RichArticleEditor = ({ value, onChange }: Props) => {
  const lastEmitted = useRef<string | null>(null);
  const [, force] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false } as never),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing, or paste your article here…" }),
    ],
    content: mdToHtml(value),
    editorProps: {
      attributes: { class: "kc-prose min-h-[520px] px-6 py-5 focus:outline-none" },
      transformPastedHTML: cleanPastedHtml,
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain");
        if (html || !text) return false;
        event.preventDefault();
        editorRef.current?.commands.insertContent(plainTextToHtml(text));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const md = htmlToMd(editor.getHTML());
      lastEmitted.current = md;
      onChange(md);
    },
    onSelectionUpdate: () => force((n) => n + 1),
    onTransaction: () => force((n) => n + 1),
  });
  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;

  // Sync external value (e.g. article loaded async).
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(mdToHtml(value), { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;
  const c = () => editor.chain().focus();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mt-2 rounded-2xl border border-input bg-card">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-border bg-card px-2 py-1.5">
          <Btn label="Undo" onClick={() => c().undo().run()} disabled={!editor.can().undo()}><Undo2 size={16} /></Btn>
          <Btn label="Redo" onClick={() => c().redo().run()} disabled={!editor.can().redo()}><Redo2 size={16} /></Btn>
          <Sep />
          <select
            aria-label="Text style"
            value={blockValue(editor)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") c().setParagraph().run();
              else c().setHeading({ level: Number(v[1]) as 2 | 3 | 4 }).run();
            }}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <Sep />
          <Btn label="Bold" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}><Bold size={16} /></Btn>
          <Btn label="Italic" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}><Italic size={16} /></Btn>
          <Btn label="Underline" active={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}><UIcon size={16} /></Btn>
          <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}><Strikethrough size={16} /></Btn>
          <Sep />
          <Btn label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}><List size={16} /></Btn>
          <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
          <Btn label="Blockquote" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}><Quote size={16} /></Btn>
          <Btn label="Divider" onClick={() => c().setHorizontalRule().run()}><Minus size={16} /></Btn>
          <Sep />
          <LinkButton editor={editor} />
          <Btn label="Remove link" disabled={!editor.isActive("link")} onClick={() => c().unsetLink().run()}><Unlink size={16} /></Btn>
          <Btn label="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={16} /></Btn>
        </div>
        <EditorContent editor={editor} />
      </div>
    </TooltipProvider>
  );
};

export default RichArticleEditor;
