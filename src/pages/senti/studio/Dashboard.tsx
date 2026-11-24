import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Pill } from "@/components/senti/studio/StudioShell";
import { fmtDate, studio, useResearcher } from "@/lib/senti/studio";

export default function StudioDashboard() {
  const { access } = useResearcher();
  const [d, setD] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  useEffect(() => {
    if (access !== "ok") return;
    (async () => {
      const [ex, runs, eng, ms, ds, ev, models, jr, au] = await Promise.all([
        supabase.from("senti_experiments").select("id,name,status,updated_at").in("status", ["draft", "queued", "running"]).order("updated_at", { ascending: false }).limit(6),
        supabase.from("senti_runs").select("id,status,engine_version,started_at,finished_at,experiment_id,senti_experiments(name)").order("started_at", { ascending: false }).limit(6),
        supabase.from("senti_engine_versions").select("*").order("created_at"),
        supabase.from("senti_milestones").select("*").order("sort"),
        supabase.from("senti_datasets").select("id,name,synthetic,senti_dataset_versions(id,version,record_count)").order("created_at"),
        supabase.from("senti_eval_results").select("category,baseline,metric,value,status,created_at").eq("status", "measured").order("created_at", { ascending: false }).limit(8),
        supabase.from("senti_models").select("id,name,status"),
        supabase.from("senti_journal").select("id,title,kind,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("senti_audit").select("op,ok,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      setD({ ex: ex.data ?? [], runs: runs.data ?? [], eng: eng.data ?? [], ms: ms.data ?? [], ds: ds.data ?? [], ev: ev.data ?? [], models: models.data ?? [], jr: jr.data ?? [], au: au.data ?? [] });
    })();
    studio("health").then(setHealth).catch((e) => setHealth({ ok: false, error: e.message }));
  }, [access]);
  return (
    <StudioShell title="Research overview">
      {!d ? <Empty>Loading…</Empty> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Engine versions">
            <ul className="space-y-2 text-sm">{d.eng.map((e: any) => <li key={e.id} className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{e.id}</span><Pill s={e.status} /></li>)}</ul>
          </Card>
          <Card title="Service health">
            {!health ? <Empty>Checking…</Empty> : <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between"><span>Core API</span><Pill s={health.ok ? "operational" : "failed"} label={health.ok ? "Healthy" : "Unavailable"} /></li>
              <li className="flex justify-between"><span>Database response</span><span className="text-atmo-ivory/60">{health.db_ms ?? "—"} ms</span></li>
              <li className="flex justify-between"><span>Python research service</span><Pill s="none" label={health.python_service === "configured" ? "Configured" : "Not configured"} /></li>
            </ul>}
          </Card>
          <Card title="Model registry">
            {d.models.length ? <ul className="space-y-2 text-sm">{d.models.map((m: any) => <li key={m.id} className="flex justify-between"><span>{m.name}</span><Pill s={m.status} /></li>)}</ul> : <Empty>No trained model. Not yet available.</Empty>}
          </Card>
          <Card title="Active experiments" action={<Link to="/senti/studio/research/experiments" className="text-xs text-atmo-ivory/60 hover:text-atmo-ivory">All →</Link>}>
            {d.ex.length ? <ul className="space-y-2 text-sm">{d.ex.map((e: any) => <li key={e.id} className="flex justify-between gap-2"><span className="truncate">{e.name}</span><Pill s={e.status} /></li>)}</ul> : <Empty>No active experiments.</Empty>}
          </Card>
          <Card title="Recent runs">
            {d.runs.length ? <ul className="space-y-2 text-sm">{d.runs.map((r: any) => <li key={r.id} className="flex justify-between gap-2"><span className="truncate">{r.senti_experiments?.name ?? "Experiment"} <span className="text-atmo-ivory/40">· {fmtDate(r.started_at)}</span></span><Pill s={r.status} /></li>)}</ul> : <Empty>No runs yet.</Empty>}
          </Card>
          <Card title="Latest measured results" action={<Link to="/senti/studio/research/evaluations" className="text-xs text-atmo-ivory/60 hover:text-atmo-ivory">All →</Link>}>
            {d.ev.length ? <ul className="space-y-1.5 text-sm">{d.ev.map((r: any, i: number) => <li key={i} className="flex justify-between gap-2"><span className="truncate">{r.category} · {r.baseline}</span><span className="font-mono text-xs">{r.metric} {r.value}</span></li>)}</ul> : <Empty>No evaluations have run yet.</Empty>}
          </Card>
          <Card title="Datasets">
            {d.ds.length ? <ul className="space-y-2 text-sm">{d.ds.map((x: any) => <li key={x.id} className="flex justify-between gap-2"><span className="truncate">{x.name}</span><span className="text-atmo-ivory/50">{x.senti_dataset_versions?.length ?? 0} version(s){x.synthetic ? " · synthetic" : ""}</span></li>)}</ul> : <Empty>No datasets registered.</Empty>}
          </Card>
          <Card title="Milestones">
            <ul className="space-y-2 text-sm">{d.ms.map((m: any) => <li key={m.id} className="flex justify-between gap-2"><span>{m.title}</span><Pill s={m.status} /></li>)}</ul>
          </Card>
          <Card title="Activity">
            {d.jr.length + d.au.length ? <ul className="space-y-1.5 text-sm">
              {d.jr.map((j: any) => <li key={j.id} className="truncate">Journal · {j.title} <span className="text-atmo-ivory/40">{fmtDate(j.created_at)}</span></li>)}
              {d.au.map((a: any, i: number) => <li key={i} className="truncate text-atmo-ivory/60">{a.op} {a.ok ? "" : "· error"} <span className="text-atmo-ivory/40">{fmtDate(a.created_at)}</span></li>)}
            </ul> : <Empty>No activity yet.</Empty>}
          </Card>
        </div>
      )}
    </StudioShell>
  );
}
