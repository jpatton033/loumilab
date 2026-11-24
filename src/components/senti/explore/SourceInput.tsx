import { useRef, useState } from "react";
import { FileUp, Link2, PenLine, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { studio } from "@/lib/senti/studio";
import { extractText } from "@/lib/senti/extract";
import { MAX_SOURCE_CHARS } from "../../../../supabase/functions/_shared/sentiExplore";
import { inp, btn, ghost } from "@/components/senti/studio/StudioShell";

type Tab = "write" | "upload" | "link";
const STEPS = ["Reading source", "Finding people, places and events", "Finding relationships", "Saving"];

/** One input for pasting text or uploading a file. Creates the exploration when none is given. */
export default function SourceInput({ explorationId, onDone, compact }: { explorationId?: string; onDone: (explorationId: string) => void; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState(""); const [original, setOriginal] = useState("");
  const [title, setTitle] = useState(""); const [kind, setKind] = useState<"text" | "pdf" | "docx" | "txt" | "markdown">("text");
  const [file, setFile] = useState<File | null>(null); const [hash, setHash] = useState<string | null>(null);
  const [meta, setMeta] = useState({ author: "", date: "", place: "" }); const [showMeta, setShowMeta] = useState(false);
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(-1); const [error, setError] = useState<string | null>(null); const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const read = async (f: File) => {
    setError(null); setStep(0);
    try {
      const r = await extractText(f);
      setFile(f); setHash(r.hash); setKind(r.kind); setText(r.text.slice(0, MAX_SOURCE_CHARS)); setOriginal(r.text);
      setTitle((t) => t || f.name.replace(/\.[^.]+$/, ""));
      if (r.text.length > MAX_SOURCE_CHARS) setError(`Only the first ${MAX_SOURCE_CHARS.toLocaleString()} characters will be read.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't read this file."); setFile(null); }
    setStep(-1);
  };

  const submit = async () => {
    setError(null);
    if (text.trim().length < 3) return setError("Add some text first.");
    try {
      setStep(0);
      let eid = explorationId;
      const name = title.trim() || text.trim().split(/\s+/).slice(0, 6).join(" ").slice(0, 80);
      if (!eid) eid = (await studio<{ exploration: { id: string } }>("create_exploration", { title: name })).exploration.id;
      let file_path: string | null = null;
      if (file) {
        const { data: { user } } = await supabase.auth.getUser();
        file_path = `${user!.id}/${eid}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_").slice(-80)}`;
        const up = await supabase.storage.from("senti-sources").upload(file_path, file);
        if (up.error) throw new Error("The file couldn't be saved. Please try again.");
      }
      setStep(1); const t2 = setTimeout(() => setStep(2), 1200);
      const m = Object.fromEntries(Object.entries(meta).filter(([, v]) => v.trim()));
      await studio("ingest_source", { exploration_id: eid, title: name, kind, text: text.trim(), original_text: (original || text).slice(0, MAX_SOURCE_CHARS * 2), file_path, sha256: hash, metadata: m, research_consent: consent });
      clearTimeout(t2); setStep(3);
      setText(""); setOriginal(""); setTitle(""); setFile(null); setHash(null); setKind("text"); setMeta({ author: "", date: "", place: "" });
      setStep(-1); onDone(eid);
    } catch (e) { setStep(-1); setError(e instanceof Error ? e.message : "Something went wrong."); }
  };

  const busy = step >= 0;
  const tabs: [Tab, string, typeof PenLine][] = [["write", "Write or paste", PenLine], ["upload", "Upload", FileUp], ["link", "Link", Link2]];
  return (
    <div className={cn("rounded-3xl border border-atmo-copper/25 bg-atmo-charcoal/50 shadow-[0_30px_80px_-40px_hsl(var(--atmo-copper)/0.35)]", compact ? "p-4" : "p-5 sm:p-7")}>
      <div role="tablist" aria-label="How to add a source" className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition", tab === k ? "border-atmo-copper/60 bg-atmo-copper/15 text-atmo-ivory" : "border-atmo-ivory/15 text-atmo-ivory/60 hover:text-atmo-ivory")}>
            <I className="h-4 w-4" aria-hidden />{l}{k === "link" && <span className="text-[10px] uppercase tracking-wider text-atmo-copper">Soon</span>}
          </button>))}
      </div>

      {tab === "link" ? (
        <div className="rounded-2xl border border-dashed border-atmo-ivory/15 p-6 text-sm text-atmo-ivory/65">
          <p className="font-medium text-atmo-ivory">Reading web links is coming soon.</p>
          <p className="mt-1">Senti won't claim to have read a page it can't fetch safely. For now, copy the text from the page and paste it under "Write or paste."</p>
        </div>
      ) : (
        <>
          {tab === "upload" && !file && (
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}
              className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition", drag ? "border-atmo-copper bg-atmo-copper/10" : "border-atmo-ivory/20")}>
              <FileUp className="h-7 w-7 text-atmo-copper" aria-hidden />
              <p className="text-sm text-atmo-ivory/75">Drop a file here, or</p>
              <button type="button" className={ghost} onClick={() => fileRef.current?.click()} disabled={busy}>Choose a file</button>
              <p className="text-xs text-atmo-ivory/45">PDF, Word (.docx), plain text or Markdown · up to 10 MB</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.markdown" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
            </div>
          )}
          {(tab === "write" || file) && (
            <>
              {file && <p className="mb-2 text-xs text-atmo-ivory/55">Text found in <span className="text-atmo-ivory">{file.name}</span>. Check it and correct anything that came through wrong. <button className="underline" onClick={() => { setFile(null); setText(""); }}>Remove</button></p>}
              <textarea aria-label="Source text" value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_SOURCE_CHARS} rows={compact ? 5 : 9}
                placeholder="Paste a poem, letter, speech, historical passage, conversation or your own notes…"
                className="w-full resize-y rounded-2xl border border-atmo-ivory/10 bg-atmo-obsidian/60 p-4 text-[15px] leading-relaxed text-atmo-ivory placeholder:text-atmo-ivory/35 focus:outline-none focus:ring-2 focus:ring-atmo-copper/40" />
            </>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <input className={inp} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} aria-label="Title" />
            <button type="button" className="text-left text-xs text-atmo-ivory/55 underline-offset-4 hover:underline sm:text-right" onClick={() => setShowMeta((v) => !v)} aria-expanded={showMeta}>{showMeta ? "Hide details" : "Add author, date or place"}</button>
          </div>
          {showMeta && <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["author", "date", "place"] as const).map((k) => <input key={k} className={inp} placeholder={k[0].toUpperCase() + k.slice(1)} aria-label={k} value={meta[k]} maxLength={120} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} />)}
          </div>}
          <label className="mt-3 flex items-start gap-2 text-xs text-atmo-ivory/55"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />Loumilab may use this source in Senti research. Leave unchecked to keep it private to you.</label>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button className={cn(btn, "px-6")} onClick={submit} disabled={busy || text.trim().length < 3}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}{explorationId ? "Add to exploration" : "Explore"}</button>
            {busy && <p aria-live="polite" className="text-sm text-atmo-copper">{STEPS[step]}…</p>}
          </div>
        </>
      )}
    </div>
  );
}
