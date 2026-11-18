import { Fragment, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Pill, ghost } from "@/components/senti/studio/StudioShell";
import { BASELINE_LABELS, CATEGORY_LABELS, fmtDate, useResearcher } from "@/lib/senti/studio";

export default function StudioEvaluations() {
  const { access } = useResearcher();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("senti_eval_results").select("*, senti_runs(experiment_id, config, senti_experiments(name))").order("created_at", { ascending: false }).limit(400);
    const { data: dv } = await supabase.from("senti_dataset_versions").select("id, version, senti_datasets(name)");
    const m = new Map((dv ?? []).map((d: any) => [d.id, `${d.senti_datasets?.name} v${d.version}`]));
    setRows((data ?? []).map((r: any) => ({ ...r, ds: m.get(r.dataset_version_id) ?? "—" })));
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);
  const latest = (c: string, b: string) => rows.find((r) => r.category === c && r.baseline === b);
  const publish = async (r: any) => { await supabase.from("senti_eval_results").update({ published: !r.published }).eq("id", r.id); load(); };
  return (
    <StudioShell title="Evaluation & benchmarks">
      <p className="mb-6 max-w-3xl text-sm text-atmo-ivory/65">Latest result per test category and baseline. Every result keeps its engine version, dataset version, settings and time, so any run can be repeated. Trained-model and external-LLM baselines stay “not configured” until they exist. Published results appear in the public status panel.</p>
      <Card title="Comparison matrix" className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-atmo-ivory/50"><th className="py-2 pr-3 font-normal">Category</th>{Object.values(BASELINE_LABELS).map((b) => <th key={b} className="py-2 pr-3 font-normal">{b}</th>)}</tr></thead>
          <tbody>{Object.entries(CATEGORY_LABELS).map(([c, label]) => (
            <tr key={c} className="border-t border-atmo-ivory/5"><td className="py-2 pr-3">{label}</td>
              {Object.keys(BASELINE_LABELS).map((b) => { const r = latest(c, b); return <td key={b} className="py-2 pr-3">{!r ? <span className="text-atmo-ivory/35">Not yet evaluated</span> : r.status === "measured" ? <span className="font-mono text-xs">{r.metric} {r.value} <span className="text-atmo-ivory/40">n={r.n}</span></span> : <Pill s={r.status} />}</td>; })}
            </tr>))}</tbody>
        </table>
      </Card>
      <Card title="All results" className="mt-6 overflow-x-auto">
        {!rows.length ? <Empty>No evaluations yet. Run an experiment on a dataset to produce results.</Empty> : (
          <table className="w-full min-w-[820px] text-xs">
            <thead><tr className="text-left text-atmo-ivory/50"><th className="py-2 pr-2 font-normal">When</th><th className="pr-2 font-normal">Experiment</th><th className="pr-2 font-normal">Category · baseline</th><th className="pr-2 font-normal">Result</th><th className="pr-2 font-normal">Engine</th><th className="pr-2 font-normal">Dataset</th><th className="font-normal" /></tr></thead>
            <tbody>{rows.map((r) => <Fragment key={r.id}><tr className="border-t border-atmo-ivory/5">
              <td className="py-2 pr-2">{fmtDate(r.created_at)}</td><td className="pr-2">{r.senti_runs?.senti_experiments?.name}</td><td className="pr-2">{r.category} · {r.baseline}</td>
              <td className="pr-2 font-mono">{r.status === "measured" ? `${r.metric} ${r.value} (n=${r.n})` : r.status.replace("_", " ")}</td><td className="pr-2 font-mono">{r.engine_version}</td>
              <td className="pr-2">{r.ds}</td>
              <td>{r.status === "measured" && <button className={ghost} onClick={() => publish(r)}>{r.published ? "Unpublish" : "Publish"}</button>}</td>
            </tr></Fragment>)}</tbody>
          </table>)}
      </Card>
    </StudioShell>
  );
}
