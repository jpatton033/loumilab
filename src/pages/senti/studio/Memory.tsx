import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RelationGraph from "@/components/senti/RelationGraph";
import StudioShell, { Card, Empty, Field, Pill, btn, ghost, inp } from "@/components/senti/studio/StudioShell";
import SessionPicker, { useStudioSessions } from "@/components/senti/studio/SessionPicker";
import { fmtDate, studio, useResearcher } from "@/lib/senti/studio";

const KIND_HELP: Record<string, string> = { fact: "Recorded fact — entered as a structured observation or confirmed by a researcher.", inferred: "Inferred — produced by the rules reader from text.", hypothesis: "Unverified hypothesis — proposed, not yet supported by evidence." };

export default function StudioMemory() {
  const { access } = useResearcher();
  const s = useStudioSessions(access === "ok");
  const [entities, setEntities] = useState<any[]>([]);
  const [rels, setRels] = useState<any[]>([]);
  const [q, setQ] = useState({ entity: "", from: "", to: "", all: false });
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [fix, setFix] = useState({ predicate: "", note: "" });
  const [add, setAdd] = useState({ source: "", predicate: "", target: "", kind: "hypothesis" });
  const load = useCallback(async () => {
    if (!s.sid) return;
    const { data: e } = await supabase.from("senti_entities").select("key,label,mentions,attributes").eq("session_id", s.sid);
    setEntities(e ?? []);
    if (q.all) { const { data } = await supabase.from("senti_relations").select("*").eq("session_id", s.sid); setRels(data ?? []); return; }
    try {
      const r = await studio("retrieve", { session_id: s.sid, entity: q.entity || undefined, from: q.from ? new Date(q.from).toISOString() : undefined, to: q.to ? new Date(q.to).toISOString() : undefined });
      setRels(r.relations ?? []);
    } catch (err) { toast.error((err as Error).message); }
  }, [s.sid, q]);
  useEffect(() => { load(); }, [load]);
  const open = useCallback(async (id: string) => { setSel(id); try { setDetail(await studio("explain", { relation_id: id })); } catch (e) { toast.error((e as Error).message); } }, []);
  const revise = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!sel) return;
    try { const r = await studio("revise", { relation_id: sel, action, note: fix.note || undefined, ...extra }); setFix({ predicate: "", note: "" }); await load(); open(r.relation?.id ?? sel); }
    catch (e) { toast.error((e as Error).message); }
  };
  const relate = async () => {
    if (!add.source || !add.predicate || !add.target) return toast.error("Fill in all three parts");
    try { await studio("relate", { session_id: s.sid, ...add }); setAdd({ ...add, source: "", predicate: "", target: "" }); load(); } catch (e) { toast.error((e as Error).message); }
  };
  const keys = new Set(rels.flatMap((r) => [r.source_key, r.target_key]));
  const nodes = entities.filter((e) => keys.has(e.key));
  return (
    <StudioShell title="Relational memory explorer">
      <SessionPicker s={s} />
      {!s.sid ? <Empty>Create a research session first.</Empty> : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Card title="Query memory">
              <div className="grid gap-3 sm:grid-cols-4">
                <input className={inp} placeholder="Entity (e.g. Ana)" value={q.entity} onChange={(e) => setQ({ ...q, entity: e.target.value })} />
                <input type="datetime-local" className={inp} value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} aria-label="From" />
                <input type="datetime-local" className={inp} value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} aria-label="To" />
                <label className="flex items-center gap-2 text-sm text-atmo-ivory/70"><input type="checkbox" checked={q.all} onChange={(e) => setQ({ ...q, all: e.target.checked })} /> Include superseded & rejected</label>
              </div>
            </Card>
            <RelationGraph nodes={nodes} edges={rels.map((r) => ({ ...r, contradicted: r.support > 0 && r.contradict > 0 }))} onSelect={open} selected={sel} />
            <Card title="Relationships">
              {!rels.length ? <Empty>No relationships match.</Empty> : <ul className="space-y-1.5 text-sm">{rels.map((r) => (
                <li key={r.id}><button onClick={() => open(r.id)} className={`flex w-full flex-wrap items-center gap-2 rounded-xl px-2 py-1 text-left hover:bg-atmo-ivory/5 ${sel === r.id ? "bg-atmo-ivory/10" : ""}`}>
                  <span>{r.source_key} <b>{r.predicate}</b> {r.target_key}</span><Pill s={r.kind} />{r.status !== "active" && <Pill s={r.status} />}{r.support > 0 && r.contradict > 0 && <Pill s="contradicted" />}<span className="text-xs text-atmo-ivory/45">weight {r.weight} · v{r.version}</span>
                </button></li>))}</ul>}
            </Card>
            <Card title="Add a hypothesis or fact">
              <div className="grid gap-2 sm:grid-cols-4">
                <input className={inp} placeholder="Source" value={add.source} onChange={(e) => setAdd({ ...add, source: e.target.value })} />
                <input className={inp} placeholder="Relationship" value={add.predicate} onChange={(e) => setAdd({ ...add, predicate: e.target.value })} />
                <input className={inp} placeholder="Target" value={add.target} onChange={(e) => setAdd({ ...add, target: e.target.value })} />
                <select className={inp} value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value })}><option value="hypothesis">Hypothesis</option><option value="fact">Recorded fact</option><option value="inferred">Inferred</option></select>
              </div>
              <button className={`${btn} mt-3`} onClick={relate}>Add</button>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card title="Evidence & history" className="lg:sticky lg:top-24">
              {!detail ? <Empty>Select a relationship to see how it was created and how it changed.</Empty> : (
                <div className="space-y-4 text-sm">
                  <div><p className="text-lg">{detail.relation.source_key} <b>{detail.relation.predicate}</b> {detail.relation.target_key}</p>
                    <div className="mt-1 flex flex-wrap gap-2"><Pill s={detail.relation.kind} /><Pill s={detail.relation.status} />{detail.relation.contradicted && <Pill s="contradicted" />}</div>
                    <p className="mt-2 text-xs text-atmo-ivory/55">{KIND_HELP[detail.relation.kind]}</p>
                    <p className="mt-1 text-xs text-atmo-ivory/55">Support {detail.relation.support} · Contradictions {detail.relation.contradict} · weight {detail.relation.weight}</p>
                    {detail.superseded_by && <p className="mt-1 text-xs">Superseded by “{detail.superseded_by.predicate}”.</p>}</div>
                  <div><p className="mb-1 text-atmo-ivory/60">Evidence</p>{detail.evidence.length ? <ul className="space-y-1">{detail.evidence.map((e: any) => <li key={e.id} className="rounded-xl border border-atmo-ivory/10 px-2 py-1">#{e.seq} {e.text}{e.polarity === -1 && " (negated)"} <span className="text-xs text-atmo-ivory/40">{fmtDate(e.occurred_at ?? e.created_at)}</span></li>)}</ul> : <Empty>No event evidence (entered or confirmed by a researcher).</Empty>}</div>
                  <div><p className="mb-1 text-atmo-ivory/60">Version history</p><ol className="space-y-1 text-xs">{detail.versions.map((v: any, i: number) => <li key={i}>v{v.version} · {v.reason} · {v.snapshot?.predicate} (+{v.snapshot?.support}/−{v.snapshot?.contradict}) <span className="text-atmo-ivory/40">{fmtDate(v.created_at)}</span></li>)}</ol></div>
                  {detail.relation.status === "active" && <div className="space-y-2 border-t border-atmo-ivory/10 pt-3">
                    <div className="flex flex-wrap gap-2"><button className={ghost} onClick={() => revise("support")}>Add support</button><button className={ghost} onClick={() => revise("contradict")}>Add contradiction</button><button className={ghost} onClick={() => revise("reject")}>Reject</button></div>
                    <div className="flex flex-wrap gap-2">{["fact", "inferred", "hypothesis"].filter((k) => k !== detail.relation.kind).map((k) => <button key={k} className={ghost} onClick={() => revise("set_kind", { kind: k })}>Mark as {k}</button>)}</div>
                    <Field label="Correct the relationship (keeps the old version)"><div className="flex gap-2"><input className={inp} placeholder="e.g. walks" value={fix.predicate} onChange={(e) => setFix({ ...fix, predicate: e.target.value })} /><button className={btn} disabled={!fix.predicate} onClick={() => revise("supersede", { predicate: fix.predicate })}>Supersede</button></div></Field>
                    <input className={inp} placeholder="Note (optional, saved in history)" value={fix.note} onChange={(e) => setFix({ ...fix, note: e.target.value })} />
                  </div>}
                </div>)}
            </Card>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
