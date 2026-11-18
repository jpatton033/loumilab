import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Field, Pill, btn, ghost, inp } from "@/components/senti/studio/StudioShell";
import { fmtDate, useResearcher } from "@/lib/senti/studio";

const KINDS = ["question", "hypothesis", "experiment", "observation", "failure", "finding", "decision", "future"];
const blank = { kind: "observation", title: "", body: "", experiment_id: "" };

export default function StudioJournal() {
  const { access, uid } = useResearcher();
  const [rows, setRows] = useState<any[]>([]);
  const [exps, setExps] = useState<any[]>([]);
  const [f, setF] = useState(blank);
  const [edit, setEdit] = useState<string | null>(null);
  const [hist, setHist] = useState<{ id: string; rows: any[] } | null>(null);
  const [filter, setFilter] = useState("");
  const load = useCallback(async () => {
    const [j, e] = await Promise.all([
      supabase.from("senti_journal").select("*, senti_experiments(name), senti_updates:published_update_id(published)").order("created_at", { ascending: false }),
      supabase.from("senti_experiments").select("id,name").order("created_at", { ascending: false }),
    ]);
    setRows(j.data ?? []); setExps(e.data ?? []);
  }, []);
  useEffect(() => { if (access === "ok") load(); }, [access, load]);
  const save = async () => {
    if (f.title.trim().length < 3) return toast.error("Add a title");
    const row = { kind: f.kind, title: f.title.trim(), body: f.body, experiment_id: f.experiment_id || null };
    const { error } = edit ? await supabase.from("senti_journal").update(row).eq("id", edit) : await supabase.from("senti_journal").insert({ ...row, author_id: uid });
    if (error) return toast.error(error.message); setF(blank); setEdit(null); load();
  };
  const publish = async (j: any) => {
    if (j.published_update_id) {
      const on = !j.senti_updates?.published;
      await supabase.from("senti_updates").update({ published: on, published_at: on ? new Date().toISOString() : null, title: j.title, body: j.body }).eq("id", j.published_update_id);
      toast.success(on ? "Published to Updates" : "Removed from Updates"); return load();
    }
    if (!confirm(`Publish “${j.title}” to the public Senti Updates page?`)) return;
    const { data, error } = await supabase.from("senti_updates").insert({ kind: "update", title: j.title, body: j.body, published: true, published_at: new Date().toISOString() }).select("id").single();
    if (error) return toast.error(error.message);
    await supabase.from("senti_journal").update({ published_update_id: data.id }).eq("id", j.id); toast.success("Published to Updates"); load();
  };
  const showHist = async (id: string) => { if (hist?.id === id) return setHist(null); const { data } = await supabase.from("senti_journal_revisions").select("*").eq("entry_id", id).order("created_at", { ascending: false }); setHist({ id, rows: data ?? [] }); };
  const shown = filter ? rows.filter((r) => r.kind === filter) : rows;
  return (
    <StudioShell title="Research journal">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title={edit ? "Edit entry" : "New entry (private)"} className="lg:col-span-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select className={inp} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
              <Field label="Related experiment"><select className={inp} value={f.experiment_id} onChange={(e) => setF({ ...f, experiment_id: e.target.value })}><option value="">—</option>{exps.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            </div>
            <Field label="Title"><input className={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Entry"><textarea className={inp} rows={8} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
            <div className="flex gap-2"><button className={btn} onClick={save}>{edit ? "Save (keeps history)" : "Add entry"}</button>{edit && <button className={ghost} onClick={() => { setEdit(null); setF(blank); }}>Cancel</button>}</div>
          </div>
        </Card>
        <div className="space-y-3 lg:col-span-3">
          <div className="flex flex-wrap gap-2"><button className={ghost} onClick={() => setFilter("")}>All</button>{KINDS.map((k) => <button key={k} className={ghost} onClick={() => setFilter(k)}>{k}</button>)}</div>
          {!shown.length && <Empty>No entries yet.</Empty>}
          {shown.map((j) => (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{j.title}</h3><p className="text-xs text-atmo-ivory/45">{fmtDate(j.created_at)}{j.updated_at !== j.created_at && ` · edited ${fmtDate(j.updated_at)}`}{j.senti_experiments && ` · ${j.senti_experiments.name}`}{j.author_id === uid ? " · you" : ""}</p></div>
                <div className="flex gap-2"><Pill s={j.kind} />{j.senti_updates?.published && <Pill s="operational" label="Public" />}</div></div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-atmo-ivory/75">{j.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={ghost} onClick={() => { setEdit(j.id); setF({ kind: j.kind, title: j.title, body: j.body, experiment_id: j.experiment_id ?? "" }); }}>Edit</button>
                <button className={ghost} onClick={() => publish(j)}>{j.senti_updates?.published ? "Unpublish" : "Publish to Updates"}</button>
                <button className={ghost} onClick={() => showHist(j.id)}>History</button>
              </div>
              {hist?.id === j.id && <div className="mt-3 space-y-2">{!hist.rows.length ? <Empty>No earlier versions.</Empty> : hist.rows.map((h) => <div key={h.id} className="rounded-xl border border-atmo-ivory/10 p-2 text-xs"><p className="text-atmo-ivory/45">{fmtDate(h.created_at)}</p><p className="font-semibold">{h.title}</p><p className="whitespace-pre-wrap text-atmo-ivory/65">{h.body}</p></div>)}</div>}
            </Card>))}
        </div>
      </div>
    </StudioShell>
  );
}
