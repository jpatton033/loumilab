import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Field, Pill, btn, ghost, inp } from "@/components/senti/studio/StudioShell";
import { fmtDate, useResearcher } from "@/lib/senti/studio";

export default function StudioLearning() {
  const { access, uid } = useResearcher();
  const [engines, setEngines] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [dvs, setDvs] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", engine_version: "senti-learn-0.1", dataset_version_id: "", training_config: '{\n  "epochs": 0\n}', notes: "" });
  const [ev, setEv] = useState({ id: "", kind: "model", description: "" });
  const load = useCallback(async () => {
    const [e, m, d] = await Promise.all([
      supabase.from("senti_engine_versions").select("*").order("created_at"),
      supabase.from("senti_models").select("*").order("created_at", { ascending: false }),
      supabase.from("senti_dataset_versions").select("id,version,senti_datasets(name)"),
    ]);
    setEngines(e.data ?? []); setModels(m.data ?? []); setDvs(d.data ?? []);
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);
  const addModel = async () => {
    if (f.name.trim().length < 2) return toast.error("Name the training setup");
    let cfg: unknown; try { cfg = JSON.parse(f.training_config); } catch { return toast.error("Training settings must be valid JSON"); }
    const { error } = await supabase.from("senti_models").insert({ name: f.name.trim(), engine_version: f.engine_version, dataset_version_id: f.dataset_version_id || null, training_config: cfg, notes: f.notes, created_by: uid });
    if (error) return toast.error(error.message); setF({ ...f, name: "", notes: "" }); load();
  };
  const addEngine = async () => {
    if (!/^[a-z0-9.-]{3,40}$/.test(ev.id)) return toast.error("Use a lowercase id like senti-learn-0.2");
    const { error } = await supabase.from("senti_engine_versions").insert({ id: ev.id, kind: ev.kind, description: ev.description, status: "planned" });
    if (error) return toast.error(error.message); setEv({ id: "", kind: "model", description: "" }); load();
  };
  const setEngineStatus = async (id: string, status: string) => { await supabase.from("senti_engine_versions").update({ status, released_at: status === "operational" ? new Date().toISOString() : null }).eq("id", id); load(); };
  const anyTrained = models.some((m) => m.status === "evaluated" || m.status === "operational");
  return (
    <StudioShell title="Learning engine">
      <div className="mb-6 rounded-3xl border border-atmo-ivory/15 p-5 text-sm text-atmo-ivory/75">
        {anyTrained ? "At least one model has been evaluated." : "No trained model. Training runs need a training service (planned for the Python research service); until then this area manages versions, setups and notes only."}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Algorithm & engine versions">
          <ul className="space-y-3 text-sm">{engines.map((e) => (
            <li key={e.id} className="border-b border-atmo-ivory/5 pb-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{e.id} · {e.kind}</span><Pill s={e.status} /></div>
              <p className="mt-1 text-atmo-ivory/60">{e.description}</p>
              {e.kind !== "model" && <div className="mt-2 flex gap-2">{["operational", "experimental", "retired"].filter((s) => s !== e.status).map((s) => <button key={s} className={ghost} onClick={() => setEngineStatus(e.id, s)}>Mark {s}</button>)}</div>}
              {e.kind === "model" && <p className="mt-1 text-xs text-atmo-ivory/45">Model versions become operational only after a trained checkpoint is evaluated.</p>}
            </li>))}</ul>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input className={inp} placeholder="id, e.g. senti-learn-0.2" value={ev.id} onChange={(e) => setEv({ ...ev, id: e.target.value })} />
            <select className={inp} value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })}><option value="model">Model</option><option value="memory">Memory</option><option value="rules">Rules</option></select>
            <input className={inp} placeholder="Description" value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
          </div>
          <button className={`${btn} mt-3`} onClick={addEngine}>Register version (planned)</button>
        </Card>
        <div className="space-y-4">
          <Card title="New training setup">
            <div className="space-y-3">
              <Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Engine version"><select className={inp} value={f.engine_version} onChange={(e) => setF({ ...f, engine_version: e.target.value })}>{engines.filter((e) => e.kind === "model").map((e) => <option key={e.id}>{e.id}</option>)}</select></Field>
                <Field label="Dataset version"><select className={inp} value={f.dataset_version_id} onChange={(e) => setF({ ...f, dataset_version_id: e.target.value })}><option value="">—</option>{dvs.map((d) => <option key={d.id} value={d.id}>{d.senti_datasets?.name} v{d.version}</option>)}</select></Field>
              </div>
              <Field label="Training settings (JSON)"><textarea className={`${inp} font-mono text-xs`} rows={4} value={f.training_config} onChange={(e) => setF({ ...f, training_config: e.target.value })} /></Field>
              <Field label="Research notes"><textarea className={inp} rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
              <button className={btn} onClick={addModel}>Save setup</button>
            </div>
          </Card>
          <Card title="Training runs & checkpoints">
            {!models.length ? <Empty>No training setups yet.</Empty> : <ul className="space-y-2 text-sm">{models.map((m) => <li key={m.id} className="flex flex-wrap items-center justify-between gap-2"><span>{m.name} <span className="text-xs text-atmo-ivory/45">· {m.engine_version} · {fmtDate(m.created_at)}</span></span><span className="flex items-center gap-2"><span className="text-xs text-atmo-ivory/45">{m.checkpoint ?? "No checkpoint"}</span><Pill s={m.status} /></span></li>)}</ul>}
          </Card>
        </div>
      </div>
    </StudioShell>
  );
}
