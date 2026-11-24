import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Field, Pill, btn, ghost, inp } from "@/components/senti/studio/StudioShell";
import { fmtDate, studio, useResearcher } from "@/lib/senti/studio";

const MAX_RECORDS = 5000;
/** Splits deterministically: every 5th record to test, the next to validation, the rest to training. */
const split = (recs: any[]) => { const out = recs.map((r, i) => ({ ...r, split: r.split ?? (i % 5 === 0 ? "test" : i % 5 === 1 ? "val" : "train") })); const c = (s: string) => out.filter((r) => r.split === s).length; return { out, splits: { train: c("train"), val: c("val"), test: c("test") } }; };
function parseFile(text: string, name: string): any[] {
  if (name.endsWith(".json")) { const j = JSON.parse(text); if (!Array.isArray(j)) throw new Error("JSON must be an array of records"); return j; }
  if (name.endsWith(".jsonl")) return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const [head, ...lines] = text.split(/\r?\n/).filter(Boolean); const cols = head.split(",").map((c) => c.trim());
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v.trim()])));
}

export default function StudioDatasets() {
  const { access, uid } = useResearcher();
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", description: "", origin: "", permissions: "", synthetic: true });
  const [upl, setUpl] = useState<{ dataset: string; version: string; notes: string }>({ dataset: "", version: "1.0", notes: "" });
  const [view, setView] = useState<any>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("senti_datasets").select("*, senti_dataset_versions(id, version, record_count, splits, schema, notes, created_at)").order("created_at");
    setRows(data ?? []);
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);
  const create = async () => {
    if (f.name.trim().length < 3 || !f.origin.trim() || !f.permissions.trim()) return toast.error("Name, origin and usage permissions are required");
    const { error } = await supabase.from("senti_datasets").insert({ ...f, name: f.name.trim(), created_by: uid });
    if (error) return toast.error(error.message); setF({ name: "", description: "", origin: "", permissions: "", synthetic: true }); load();
  };
  const upload = async (file: File) => {
    if (!upl.dataset) return toast.error("Choose a dataset first");
    try {
      const recs = parseFile(await file.text(), file.name.toLowerCase());
      if (!recs.length || recs.length > MAX_RECORDS) return toast.error(`Upload 1–${MAX_RECORDS} records`);
      const { out, splits } = split(recs);
      const schema = Object.fromEntries([...new Set(out.flatMap((r) => Object.keys(r)))].map((k) => [k, typeof out.find((r) => r[k] !== undefined)?.[k]]));
      const { error } = await supabase.from("senti_dataset_versions").insert({ dataset_id: upl.dataset, version: upl.version, records: out, record_count: out.length, splits, schema, notes: upl.notes, created_by: uid });
      if (error) return toast.error(error.message.includes("duplicate") ? "That version already exists" : error.message);
      toast.success(`Uploaded ${out.length} records`); load();
    } catch (e) { toast.error(`Couldn't read the file: ${(e as Error).message}`); }
  };
  const inspect = async (id: string) => { const { data } = await supabase.from("senti_dataset_versions").select("*").eq("id", id).single(); setView(data); };
  const seed = async () => { try { const r = await studio("seed_synthetic"); toast.success(r.created ? `Added ${r.created} synthetic dataset(s)` : "Starter datasets already exist"); load(); } catch (e) { toast.error((e as Error).message); } };
  return (
    <StudioShell title="Research datasets">
      <p className="mb-6 max-w-3xl text-sm text-atmo-ivory/65">Synthetic datasets first. Public Lab visitor input is never used here unless the visitor opted in to research use.</p>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Register a dataset">
            <div className="space-y-3">
              <Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Description"><textarea className={inp} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
              <Field label="Origin"><input className={inp} value={f.origin} onChange={(e) => setF({ ...f, origin: e.target.value })} placeholder="Written by Loumilab researchers" /></Field>
              <Field label="Usage permissions"><input className={inp} value={f.permissions} onChange={(e) => setF({ ...f, permissions: e.target.value })} placeholder="Internal research only" /></Field>
              <label className="flex items-center gap-2 text-sm text-atmo-ivory/70"><input type="checkbox" checked={f.synthetic} onChange={(e) => setF({ ...f, synthetic: e.target.checked })} /> Synthetic (no real people's data)</label>
              <button className={btn} onClick={create}>Register</button>
            </div>
          </Card>
          <Card title="Upload a version">
            <div className="space-y-3">
              <Field label="Dataset"><select className={inp} value={upl.dataset} onChange={(e) => setUpl({ ...upl, dataset: e.target.value })}><option value="">—</option>{rows.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Version"><input className={inp} value={upl.version} onChange={(e) => setUpl({ ...upl, version: e.target.value })} /></Field><Field label="Notes"><input className={inp} value={upl.notes} onChange={(e) => setUpl({ ...upl, notes: e.target.value })} /></Field></div>
              <Field label="File (.json array, .jsonl or .csv)"><input type="file" accept=".json,.jsonl,.csv" className="text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></Field>
              <p className="text-xs text-atmo-ivory/45">Records can carry a "split" of train, val or test; otherwise splits are assigned automatically.</p>
            </div>
          </Card>
          <button className={ghost} onClick={seed}>Add starter synthetic datasets</button>
        </div>
        <div className="space-y-3 lg:col-span-3">
          {!rows.length && <Empty>No datasets registered.</Empty>}
          {rows.map((d) => (
            <Card key={d.id}>
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{d.name}</h3>{d.synthetic ? <Pill s="none" label="Synthetic" /> : <Pill s="active" label="Real data" />}</div>
              <p className="mt-1 text-sm text-atmo-ivory/65">{d.description}</p>
              <p className="mt-2 text-xs text-atmo-ivory/50">Origin: {d.origin} · Permissions: {d.permissions}</p>
              <ul className="mt-3 space-y-1 text-sm">{(d.senti_dataset_versions ?? []).map((v: any) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2"><span>v{v.version} · {v.record_count} records · train {v.splits?.train ?? 0} / val {v.splits?.val ?? 0} / test {v.splits?.test ?? 0} <span className="text-xs text-atmo-ivory/40">{fmtDate(v.created_at)}</span></span><button className={ghost} onClick={() => inspect(v.id)}>Inspect</button></li>))}
                {!d.senti_dataset_versions?.length && <Empty>No versions uploaded.</Empty>}</ul>
            </Card>))}
          {view && <Card title={`Version ${view.version} — schema & sample`} action={<button className={ghost} onClick={() => setView(null)}>Close</button>}>
            <pre className="max-h-40 overflow-auto rounded-xl bg-atmo-obsidian p-3 text-xs">{JSON.stringify(view.schema, null, 2)}</pre>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-atmo-obsidian p-3 text-xs">{JSON.stringify((view.records ?? []).slice(0, 5), null, 2)}</pre>
          </Card>}
        </div>
      </div>
    </StudioShell>
  );
}
