import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Find & replace across the message body. Matching runs against the plain
 * text for counting and the HTML source for replacement, so formatting is
 * preserved around replaced words.
 */
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function FindReplaceDialog({
  open,
  onClose,
  editor,
}: {
  open: boolean;
  onClose: () => void;
  editor: Editor;
}) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => findRef.current?.focus(), 30);
  }, [open]);

  if (!open) return null;

  const countMatches = () => {
    if (!find) return setCount(0);
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n");
    const re = new RegExp(escapeRe(find), caseSensitive ? "g" : "gi");
    setCount(text.match(re)?.length ?? 0);
  };

  const replaceAll = () => {
    if (!find) return;
    // Replace only inside text nodes — never tag names or attributes
    // (hrefs, styles, classes), so markup can't be corrupted.
    const re = new RegExp(escapeRe(find), caseSensitive ? "g" : "gi");
    const { state, view } = editor;
    const ranges: { from: number; to: number }[] = [];
    state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(node.text))) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        ranges.push({ from: pos + m.index, to: pos + m.index + m[0].length });
      }
    });
    if (!ranges.length) return setCount(0);
    const tr = state.tr;
    for (let i = ranges.length - 1; i >= 0; i--) {
      tr.insertText(replace, ranges[i].from, ranges[i].to);
    }
    view.dispatch(tr);
    setCount(0);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-foreground/30 p-6" onClick={onClose}>
      <div
        className="mt-24 w-full max-w-lg rounded-2xl border border-border bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Find &amp; replace</p>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <Input ref={findRef} value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find" />
          <Input value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Replace with" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />{" "}
            Case sensitive
          </label>
          <div className="flex items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={countMatches}>
              Count
            </Button>
            <Button type="button" size="sm" onClick={replaceAll}>
              Replace all
            </Button>
            {count !== null && (
              <span className="ml-auto text-xs text-muted-foreground">
                {count} match{count === 1 ? "" : "es"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FindReplaceDialog;
