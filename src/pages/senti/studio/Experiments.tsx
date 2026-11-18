import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Field, Pill, btn, ghost, inp } from "@/components/senti/studio/StudioShell";
import { CATEGORY_LABELS, fmtDate, studio, useResearcher } from "@/lib/senti/studio";

const blank = { name: "", hypothesis: "", description: "", category: "language", dataset_version_id: "", engine_version: "senti-core-0.1", config: "{}", criteria: "", notes: "" };

export default function StudioExperiments() {
  const { access, uid } = useResearcher();
  const [rows, setRows] = useState<any[]>([]);
  const [dvs, setDvs] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [f, setF] = useState(blank);
  const [edit, setEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, any[]>>({});
  const load = useCallback(async () => {
    const [e, d, g] = await Promise.all([
      supabase.from("senti_experiments").select("*").order("updated_at", { ascending: false }),
      supabase.from("senti_dataset_versions").select("id,version,record_count,senti_datasets(name)").order("created_at"),
      supabase.from("senti_engine_versions").select("id,status,kind").order("created_at"),
    ]);
    setRows(e.data ?? []); setDvs(d.data ?? []); setEngines(g.data ?? []);
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);
  const save = async () => {
    if (f.name.trim().length < 3) return toast.error("Give the experiment a name");
    let config: unknown; try { config = JSON.parse(f.config || "{}"); } catch { return toast.error("Settings must be valid JSON"); }
    const row = { ...f, name: f.name.trim(), dataset_version_id: f.dataset_version_id || null, config, updated_at: new Date().toISOString() };
    const { error } = edit ? await supabase.from("senti_experiments").update(row).eq("id", edit) : await supabase.from("senti_experiments").insert({ ...row, created_by: uid });
    if (error) return toast.error(error.message);
    toast.success(edit ? "Saved" : "Experiment created"); setF(blank); setEdit(null); load();
  };
  const setStatus = async (id: string, status: string) => { await supabase.from("senti_experiments").update({ status, updated_at: new Date().toISOString() }).eq("id", id); load(); };
  const run = async (id: string) => {
    setBusy(id);
    try { const r = await studio("run_experiment", { experiment_id: id }); r.status === "completed" ? toast.success("Run completed") : toast.error(r.error ?? "Run failed"); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(null); load(); showRuns(id, true);
  };
  const showRuns = async (id: string, force = false) => {
    if (open === id && !force) return setOpen(null);
    setOpen(id);
    const { data } = await supabase.from("senti_runs").select("*, senti_eval_results(category,baseline,metric,value,status,n)").eq("experiment_id", id).order("started_at", { ascending: false });
    setRuns((r) => ({ ...r, [id]: data ?? [] }));
  };
  return (
    <StudioShell title="Experiments">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title={edit ? "Edit experiment" : "New experiment"} className="lg:col-span-2">
          <div className="space-y-3">
            <Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Hypothesis"><textarea className={inp} rows={2} value={f.hypothesis} onChange={(e) => setF({ ...f, hypothesis: e.target.value })} /></Field>
            <Field label="Description"><textarea className={inp} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category"><select className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field label="Engine version"><select className={inp} value={f.engine_version} onChange={(e) => setF({ ...f, engine_version: e.target.value })}>{engines.map((g) => <option key={g.id} value={g.id}>{g.id} ({g.status})</option>)}</select></Field>
            </div>
            <Field label="Dataset version"><select className={inp} value={f.dataset_version_id} onChange={(e) => setF({ ...f, dataset_version_id: e.target.value })}><option value="">— none —</option>{dvs.map((d) => <option key={d.id} value={d.id}>{d.senti_datasets?.name} v{d.version} ({d.record_count})</option>)}</select></Field>
            <Field label='Settings (JSON, e.g. {"categories":["retrieval","contradiction"]})'><textarea className={`${inp} font-mono text-xs`} rows={3} value={f.config} onChange={(e) => setF({ ...f, config: e.target.value })} /></Field>
            <Field label="Success criteria"><input className={inp} value={f.criteria} onChange={(e) => setF({ ...f, criteria: e.target.value })} /></Field>
            <Field label="Notes"><textarea className={inp} rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <div className="flex gap-2"><button className={btn} onClick={save}>{edit ? "Save" : "Create draft"}</button>{edit && <button className={ghost} onClick={() => { setEdit(null); setF(blank); }}>Cancel</button>}</div>
          </div>
        </Card>
        <div className="space-y-3 lg:col-span-3">
          {!rows.length && <Empty>No experiments yet.</Empty>}
          {rows.map((x) => (
            <Card key={x.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold">{x.name}</h3><p className="text-xs text-atmo-ivory/50">{CATEGORY_LABELS[x.category] ?? x.category} · {x.engine_version} · updated {fmtDate(x.updated_at)}</p></div>
                <Pill s={x.status} />
              </div>
              {x.hypothesis && <p className="mt-2 text-sm text-atmo-ivory/70">{x.hypothesis}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {x.status !== "archived" && <button className={ghost} disabled={busy === x.id} onClick={() => run(x.id)}>{busy === x.id ? "Running…" : "Run on engine"}</button>}
                {x.status === "draft" && <button className={ghost} onClick={() => setStatus(x.id, "queued")}>Queue</button>}
                <button className={ghost} onClick={() => { setEdit(x.id); setF({ ...blank, ...x, dataset_version_id: x.dataset_version_id ?? "", config: JSON.stringify(x.config ?? {}) }); }}>Edit</button>
                <button className={ghost} onClick={() => setStatus(x.id, x.status === "archived" ? "draft" : "archived")}>{x.status === "archived" ? "Restore" : "Archive"}</button>
                <button className={ghost} onClick={() => showRuns(x.id)}>{open === x.id ? "Hide runs" : "Runs"}</button>
              </div>
              {open === x.id && <div className="mt-4 space-y-3">{!(runs[x.id] ?? []).length ? <Empty>No runs yet.</Empty> : runs[x.id].map((r) => (
                <div key={r.id} className="rounded-2xl border border-atmo-ivory/10 p-3 text-sm">
                  <div className="flex justify-between"><span className="text-atmo-ivory/60">{fmtDate(r.started_at)} · {r.engine_version}</span><Pill s={r.status} /></div>
                  {r.error && <p className="mt-1 text-xs text-atmo-ivory/70">{r.error}</p>}
                  {!!r.senti_eval_results?.length && <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">{r.senti_eval_results.map((e: any, i: number) => <li key={i} className="flex justify-between gap-2"><span>{e.category} · {e.baseline}</span><span className="font-mono">{e.status === "measured" ? `${e.metric} ${e.value} (n=${e.n})` : e.status.replace("_", " ")}</span></li>)}</ul>}
                </div>))}</div>}
            </Card>
          ))}
        </div>
      </div>
    </StudioShell>
  );
}
