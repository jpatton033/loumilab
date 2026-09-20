import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Palette,
  Quote,
  Redo,
  RemoveFormatting,
  Search,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { FindReplaceDialog } from "./FindReplaceDialog";
import { cn } from "@/lib/utils";

/** font-size support on the textStyle mark. */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

/** line-height support on blocks. */
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.lineHeight || null,
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lh: string) =>
        ({ commands }: any) =>
          this.options.types.every((t: string) => commands.updateAttributes(t, { lineHeight: lh })),
    } as any;
  },
});

const FONT_FAMILIES = [
  { label: "Brand (Space Grotesk)", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["12px", "13px", "14px", "15px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"];
const LINE_HEIGHTS = [
  { label: "Single", v: "1.2" },
  { label: "1.15", v: "1.15" },
  { label: "1.5", v: "1.5" },
  { label: "Double", v: "2" },
];
const SWATCHES = [
  "#18181b",
  "#3f4247",
  "#6b6f76",
  "#0b72f3",
  "#0f766e",
  "#b91c1c",
  "#b45309",
  "#7c3aed",
  "#ffffff",
];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#e5e7eb"];

export interface MailEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  placeholder?: string;
}

export function MailEditor({ value, onChange, onUploadImage, placeholder }: MailEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      LineHeight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Superscript,
      Subscript,
      Placeholder.configure({ placeholder: placeholder ?? "Write your message…" }),
      CharacterCount.configure({}),
      Typography,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "mail-content prose prose-slate max-w-none focus:outline-none min-h-[320px]",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0 };
    return {
      words: (editor.storage.characterCount?.words?.() as number) ?? 0,
      chars: (editor.storage.characterCount?.characters?.() as number) ?? 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const insertImageFile = async (file: File) => {
    const url = await onUploadImage(file);
    editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
  };

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-background"
          : "flex flex-col overflow-hidden rounded-2xl border border-border bg-background",
      )}
    >
      <Toolbar
        editor={editor}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onOpenFind={() => setFindOpen(true)}
        onInsertImageFile={insertImageFile}
      />
      <div className="flex-1 overflow-auto bg-surface-subtle p-3 sm:p-6">
        <div className="mx-auto max-w-[760px] rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
          <EditorContent editor={editor} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {stats.words} words · {stats.chars} characters
        </span>
        <span className="hidden sm:inline">Spellcheck on · ⌘/Ctrl+F to find</span>
      </div>
      <FindReplaceDialog open={findOpen} onClose={() => setFindOpen(false)} editor={editor} />
    </div>
  );
}

const Group = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-0.5 border-r border-border pr-1 last:border-r-0">{children}</div>
);

function Toolbar({
  editor,
  fullscreen,
  onToggleFullscreen,
  onOpenFind,
  onInsertImageFile,
}: {
  editor: Editor;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenFind: () => void;
  onInsertImageFile: (f: File) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [hlOpen, setHlOpen] = useState(false);

  const btn =
    "inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-40";
  const on = "bg-accent/15 text-accent";
  const select = "h-8 rounded-md border border-border bg-background px-1.5 text-xs text-foreground";

  const is = (n: string, a?: any) => editor.isActive(n, a);

  const setLink = () => {
    const prev = (editor.getAttributes("link").href as string) || "";
    const href = window.prompt("Link URL", prev);
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-background/95 p-1.5 backdrop-blur">
      <Group>
        <button type="button" className={btn} title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </button>
      </Group>

      <select
        aria-label="Paragraph style"
        className={select}
        value={is("heading", { level: 1 }) ? "h1" : is("heading", { level: 2 }) ? "h2" : is("heading", { level: 3 }) ? "h3" : "p"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
        }}
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <select
        aria-label="Font"
        className={select}
        value={(editor.getAttributes("textStyle").fontFamily as string) ?? ""}
        onChange={(e) =>
          e.target.value
            ? editor.chain().focus().setFontFamily(e.target.value).run()
            : editor.chain().focus().unsetFontFamily().run()
        }
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className={select}
        value={(editor.getAttributes("textStyle").fontSize as string) ?? ""}
        onChange={(e) =>
          e.target.value
            ? (editor.chain().focus() as any).setFontSize(e.target.value).run()
            : (editor.chain().focus() as any).unsetFontSize().run()
        }
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s.replace("px", "")}
          </option>
        ))}
      </select>

      <Group>
        <button type="button" className={cn(btn, is("bold") && on)} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("italic") && on)} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("underline") && on)} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("strike") && on)} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("superscript") && on)} title="Superscript" onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SupIcon className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("subscript") && on)} title="Subscript" onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubIcon className="h-4 w-4" />
        </button>
      </Group>

      <Group>
        <div className="relative">
          <button type="button" className={btn} title="Text color" onClick={() => setColorOpen((v) => !v)}>
            <Palette className="h-4 w-4" />
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-9 z-20 grid grid-cols-5 gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Text color ${c}`}
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                />
              ))}
              <button
                type="button"
                className="col-span-5 mt-1 rounded-md border border-border px-2 py-1 text-[11px]"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorOpen(false);
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" className={btn} title="Highlight" onClick={() => setHlOpen((v) => !v)}>
            <Highlighter className="h-4 w-4" />
          </button>
          {hlOpen && (
            <div className="absolute left-0 top-9 z-20 grid grid-cols-3 gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Highlight ${c}`}
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: c }).run();
                    setHlOpen(false);
                  }}
                />
              ))}
              <button
                type="button"
                className="col-span-3 mt-1 rounded-md border border-border px-2 py-1 text-[11px]"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHlOpen(false);
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </Group>

      <Group>
        <button type="button" className={cn(btn, is({ textAlign: "left" } as any) && on)} title="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="h-4 w-4" />
        </button>
        <select
          aria-label="Line spacing"
          className={select}
          onChange={(e) => (editor.chain().focus() as any).setLineHeight(e.target.value).run()}
          defaultValue=""
        >
          <option value="">Spacing</option>
          {LINE_HEIGHTS.map((l) => (
            <option key={l.v} value={l.v}>
              {l.label}
            </option>
          ))}
        </select>
      </Group>

      <Group>
        <button type="button" className={cn(btn, is("bulletList") && on)} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("orderedList") && on)} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("taskList") && on)} title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, is("blockquote") && on)} title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </button>
      </Group>

      <Group>
        <button type="button" className={cn(btn, is("link") && on)} title="Link" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Insert image" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) await onInsertImageFile(f);
          }}
        />
        <button
          type="button"
          className={btn}
          title="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon className="h-4 w-4" />
        </button>
        {editor.isActive("table") && (
          <select
            aria-label="Table actions"
            className={select}
            value=""
            onChange={(e) => {
              const c = editor.chain().focus();
              const v = e.target.value;
              if (v === "row-after") c.addRowAfter().run();
              else if (v === "row-before") c.addRowBefore().run();
              else if (v === "col-after") c.addColumnAfter().run();
              else if (v === "col-before") c.addColumnBefore().run();
              else if (v === "del-row") c.deleteRow().run();
              else if (v === "del-col") c.deleteColumn().run();
              else if (v === "del-table") c.deleteTable().run();
              else if (v === "header") c.toggleHeaderRow().run();
            }}
          >
            <option value="">Table…</option>
            <option value="row-after">Add row below</option>
            <option value="row-before">Add row above</option>
            <option value="col-after">Add column right</option>
            <option value="col-before">Add column left</option>
            <option value="del-row">Delete row</option>
            <option value="del-col">Delete column</option>
            <option value="header">Toggle header row</option>
            <option value="del-table">Delete table</option>
          </select>
        )}
      </Group>

      <Group>
        <button
          type="button"
          className={btn}
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Find & replace" onClick={onOpenFind}>
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title={fullscreen ? "Exit full screen" : "Full screen"} onClick={onToggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </Group>
    </div>
  );
}

export default MailEditor;
