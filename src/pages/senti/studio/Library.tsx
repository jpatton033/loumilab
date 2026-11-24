import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FolderPlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, inp, ghost } from "@/components/senti/studio/StudioShell";
import { studio, fmtDate, useResearcher } from "@/lib/senti/studio";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Coll = { id: string; name: string };
type Expl = { id: string; title: string; collection_id: string | null; updated_at: string; created_at: string };
type Src = { id: string; exploration_id: string; title: string; kind: string; passages: number; created_at: string; file_path: string | null; metadata: Record<string, string> };

const download = (name: string, body: string, type: string) => {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};

export default function Library() {
  const { access } = useResearcher();
  const { toast } = useToast();
  const [colls, setColls] = useState<Coll[]>([]); const [expl, setExpl] = useState<Expl[] | null>(null); const [srcs, setSrcs] = useState<Src[]>([]);
  const [q, setQ] = useState(""); const [coll, setColl] = useState<string>("all"); const [newColl, setNewColl] = useState("");
  const load = useCallback(async () => {
    const [c, e, s] = await Promise.all([
      supabase.from("senti_collections").select("id, name").order("name"),
      supabase.from("senti_explorations").select("id, title, collection_id, updated_at, created_at").order("updated_at", { ascending: false }),
      supabase.from("senti_sources").select("id, exploration_id, title, kind, passages, created_at, file_path, metadata").order("created_at", { ascending: false }),
    ]);
    setColls(c.data ?? []); setExpl(e.data ?? []); setSrcs((s.data ?? []) as Src[]);
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);

  const saved = (msg: string) => toast({ title: msg });
  const fail = (msg = "That didn't save. Please try again.") => toast({ title: msg, variant: "destructive" });
  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => (expl ?? []).filter((e) => (coll === "all" || (coll === "none" ? !e.collection_id : e.collection_id === coll))
    && (!needle || e.title.toLowerCase().includes(needle) || srcs.some((s) => s.exploration_id === e.id && s.title.toLowerCase().includes(needle)))), [expl, coll, needle, srcs]);
  const shownSrcs = srcs.filter((s) => !needle || s.title.toLowerCase().includes(needle) || Object.values(s.metadata ?? {}).some((v) => String(v).toLowerCase().includes(needle)));

  const addColl = async () => {
    const name = newColl.trim(); if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("senti_collections").insert({ name, owner_id: user!.id });
    if (error) return fail(); setNewColl(""); saved(`Collection “${name}” created`); load();
  };
  const renameColl = async (c: Coll, name: string) => { if (!name.trim() || name === c.name) return; const { error } = await supabase.from("senti_collections").update({ name: name.trim() }).eq("id", c.id); error ? fail() : (saved("Collection renamed"), load()); };
  const delColl = async (c: Coll) => { if (!confirm(`Delete the collection “${c.name}”? Its explorations stay in your Library.`)) return; const { error } = await supabase.from("senti_collections").delete().eq("id", c.id); error ? fail() : (saved("Collection deleted"), setColl("all"), load()); };
  const rename = async (e: Expl, title: string) => { if (!title.trim() || title === e.title) return; const { error } = await supabase.from("senti_explorations").update({ title: title.trim().slice(0, 120) }).eq("id", e.id); error ? fail() : (saved("Renamed"), load()); };
  const move = async (e: Expl, cid: string) => { const { error } = await supabase.from("senti_explorations").update({ collection_id: cid || null }).eq("id", e.id); error ? fail() : (saved("Moved"), load()); };
  const remove = async (e: Expl) => {
    if (!confirm(`Delete “${e.title}” and all of its sources and analysis? This can't be undone.`)) return;
    const files = srcs.filter((s) => s.exploration_id === e.id && s.file_path).map((s) => s.file_path!);
    if (files.length) await supabase.storage.from("senti-sources").remove(files);
    const { error } = await supabase.from("senti_explorations").delete().eq("id", e.id);
    error ? fail("That couldn't be deleted.") : (saved("Deleted"), load());
  };
  const exportIt = async (e: Expl, fmt: "json" | "md") => {
    try {
      const ws: any = await studio("workspace", { exploration_id: e.id });
      const safe = e.title.replace(/[^\w-]+/g, "-").slice(0, 60) || "exploration";
      const payload = { title: ws.exploration.title, exported_at: new Date().toISOString(), engines: [ws.reader, ws.core], note: "Rule-based analysis. Relationships are patterns in wording, not confirmed facts.",
        sources: ws.sources.map((s: any) => ({ title: s.title, kind: s.kind, metadata: s.metadata, added: s.created_at, text: s.text })),
        connections: ws.relations.filter((r: any) => r.status !== "rejected").map((r: any) => ({ from: r.source_key, relation: r.predicate, to: r.target_key, status: r.status, support: r.support, challenged: r.contradict, evidence: (r.evidence ?? []).map((id: string) => ws.events.find((x: any) => x.id === id)?.text).filter(Boolean) })) };
      if (fmt === "json") download(`${safe}.json`, JSON.stringify(payload, null, 2), "application/json");
      else download(`${safe}.md`, [`# ${payload.title}`, "", `_${payload.note} Engines: ${payload.engines.join(", ")}._`, "", "## Sources", ...payload.sources.map((s: any) => `- ${s.title} (${s.kind}, added ${s.added.slice(0, 10)})`), "", "## Connections",
        ...payload.connections.map((c: any) => `- **${c.from} → ${c.relation} → ${c.to}**: supported by ${c.support}, challenged by ${c.challenged}${c.evidence.length ? `\n  - “${c.evidence.join("”\n  - “")}”` : ""}`)].join("\n"), "text/markdown");
    } catch { fail("Export failed."); }
  };

  return (
    <StudioShell title="Library">
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <input className={inp} placeholder="Search your Library" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search your Library" />
          <nav aria-label="Collections" className="space-y-1 text-sm">
            {[["all", "All explorations"], ["none", "Not in a collection"]].map(([k, l]) => <button key={k} onClick={() => setColl(k)} className={cn("block w-full rounded-xl px-3 py-2 text-left", coll === k ? "bg-atmo-ivory/10 text-atmo-ivory" : "text-atmo-ivory/60 hover:text-atmo-ivory")}>{l}</button>)}
            <p className="px-3 pt-3 text-[11px] uppercase tracking-wider text-atmo-ivory/40">Collections</p>
            {colls.map((c) => <div key={c.id} className={cn("group flex items-center gap-1 rounded-xl px-1", coll === c.id && "bg-atmo-ivory/10")}>
              <input defaultValue={c.name} onFocus={() => setColl(c.id)} onBlur={(e) => renameColl(c, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} aria-label={`Collection ${c.name}`} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-atmo-ivory/80 focus:outline-none" />
              <button onClick={() => delColl(c)} aria-label={`Delete collection ${c.name}`} className="p-1 text-atmo-ivory/30 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
            {!colls.length && <p className="px-3 text-xs text-atmo-ivory/40">No collections yet.</p>}
            <div className="flex gap-2 pt-2"><input className={inp} placeholder="New collection" value={newColl} maxLength={80} onChange={(e) => setNewColl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addColl()} aria-label="New collection name" /><button className={ghost} onClick={addColl} aria-label="Create collection"><FolderPlus className="h-4 w-4" /></button></div>
          </nav>
          <Card title="Research datasets"><p className="text-sm text-atmo-ivory/60">Versioned datasets used by experiments.</p><Link to="/senti/studio/library/datasets" className={cn(ghost, "mt-3")}>Open datasets</Link></Card>
        </aside>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-hero text-xl font-semibold">Explorations</h2>
            {expl === null ? <Empty>Loading…</Empty> : !shown.length ? <Empty>{expl.length ? "Nothing matches." : <>Nothing saved yet. <Link to="/senti/studio" className="underline">Start exploring</Link>.</>}</Empty> : (
              <ul className="space-y-3">{shown.map((e) => {
                const n = srcs.filter((s) => s.exploration_id === e.id).length;
                return <li key={e.id} className="rounded-2xl border border-atmo-ivory/10 bg-atmo-charcoal/40 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input defaultValue={e.title} onBlur={(ev) => rename(e, ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && (ev.target as HTMLInputElement).blur()} aria-label="Exploration title" className="min-w-0 flex-1 bg-transparent font-medium text-atmo-ivory focus:outline-none focus:ring-1 focus:ring-atmo-copper/40 rounded" />
                    <Link to={`/senti/studio/x/${e.id}`} className="rounded-full bg-atmo-ivory px-3 py-1 text-xs font-medium text-atmo-obsidian">Open</Link>
                  </div>
                  <p className="mt-1 text-xs text-atmo-ivory/45">{n} source{n === 1 ? "" : "s"} · updated {fmtDate(e.updated_at)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <select value={e.collection_id ?? ""} onChange={(ev) => move(e, ev.target.value)} aria-label="Collection" className="rounded-full border border-atmo-ivory/15 bg-atmo-obsidian px-3 py-1 text-atmo-ivory/75">
                      <option value="">No collection</option>{colls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <button className={ghost} onClick={() => exportIt(e, "md")}><Download className="mr-1 h-3.5 w-3.5" />Markdown</button>
                    <button className={ghost} onClick={() => exportIt(e, "json")}><Download className="mr-1 h-3.5 w-3.5" />JSON</button>
                    <button className="ml-auto text-atmo-ivory/40 hover:text-destructive" onClick={() => remove(e)}>Delete</button>
                  </div></li>;
              })}</ul>)}
          </section>
          <section>
            <h2 className="mb-3 font-hero text-xl font-semibold">Sources</h2>
            {!shownSrcs.length ? <Empty>No sources yet.</Empty> : <ul className="divide-y divide-atmo-ivory/10 rounded-2xl border border-atmo-ivory/10">
              {shownSrcs.slice(0, 50).map((s) => <li key={s.id}><Link to={`/senti/studio/x/${s.exploration_id}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-atmo-ivory/5">
                <span className="text-sm">{s.title}</span><span className="text-xs text-atmo-ivory/45">{s.kind.toUpperCase()} · {s.passages} passages · {fmtDate(s.created_at)}</span></Link></li>)}
            </ul>}
          </section>
        </div>
      </div>
    </StudioShell>
  );
}
