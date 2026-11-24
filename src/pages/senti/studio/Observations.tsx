import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Card, Empty, Field, Pill, btn, inp } from "@/components/senti/studio/StudioShell";
import SessionPicker, { useStudioSessions } from "@/components/senti/studio/SessionPicker";
import { fmtDate, studio, useResearcher } from "@/lib/senti/studio";

const blank = { actor: "", action: "", target: "", outcome: "", occurred_at: "", negated: false, attrs: "" };

export default function StudioObservations() {
  const { access } = useResearcher();
  const s = useStudioSessions(access === "ok");
  const [f, setF] = useState(blank);
  const [text, setText] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [rels, setRels] = useState<any[]>([]);
  const [last, setLast] = useState<any[] | null>(null);
  const load = useCallback(async () => {
    if (!s.sid) return;
    const [e, r] = await Promise.all([
      supabase.from("senti_events").select("*").eq("session_id", s.sid).order("seq", { ascending: false }),
      supabase.from("senti_relations").select("*").eq("session_id", s.sid).order("updated_at", { ascending: false }),
    ]);
    setEvents(e.data ?? []); setRels(r.data ?? []);
  }, [s.sid]);
  useEffect(() => { load(); }, [load]);
  const submit = async (structured: boolean) => {
    try {
      const attributes = Object.fromEntries(f.attrs.split(",").map((p) => p.split("=").map((x) => x.trim())).filter((p) => p.length === 2 && p[0]));
      const body = structured
        ? { session_id: s.sid, actor: f.actor.trim(), action: f.action.trim(), target: f.target.trim() || undefined, outcome: f.outcome.trim() || undefined, negated: f.negated, occurred_at: f.occurred_at ? new Date(f.occurred_at).toISOString() : undefined, attributes }
        : { session_id: s.sid, text: text.trim() };
      if (structured && (!f.actor.trim() || !f.action.trim())) return toast.error("Add who and what they did");
      const r = await studio("ingest", body);
      setLast(r.relations ?? []); structured ? setF(blank) : setText(""); load();
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <StudioShell title="Observation & event studio">
      <SessionPicker s={s} />
      {!s.sid ? <Empty>Create a research session to begin.</Empty> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card title="Structured observation (recorded fact)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Who / what (participant)"><input className={inp} value={f.actor} onChange={(e) => setF({ ...f, actor: e.target.value })} placeholder="Ana" /></Field>
                <Field label="Action"><input className={inp} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} placeholder="feeds" /></Field>
                <Field label="Affects (entity)"><input className={inp} value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} placeholder="cat" /></Field>
                <Field label="Outcome"><input className={inp} value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })} placeholder="cat calm" /></Field>
                <Field label="When it happened"><input type="datetime-local" className={inp} value={f.occurred_at} onChange={(e) => setF({ ...f, occurred_at: e.target.value })} /></Field>
                <Field label="Attributes (key=value, comma-separated)"><input className={inp} value={f.attrs} onChange={(e) => setF({ ...f, attrs: e.target.value })} placeholder="place=kitchen" /></Field>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-atmo-ivory/70"><input type="checkbox" checked={f.negated} onChange={(e) => setF({ ...f, negated: e.target.checked })} /> This did <b>not</b> happen (counts as contradicting evidence)</label>
              <button className={`${btn} mt-4`} onClick={() => submit(true)}>Record observation</button>
            </Card>
            <Card title="Sentence (rules reader, not AI)">
              <p className="mb-2 text-xs text-atmo-ivory/50">Read by senti-rules-0.1. Links it finds are labelled “inferred”. No language model is used.</p>
              <textarea className={inp} rows={2} maxLength={400} value={text} onChange={(e) => setText(e.target.value)} placeholder="Leo walks the dog every morning." />
              <button className={`${btn} mt-3`} disabled={text.trim().length < 3} onClick={() => submit(false)}>Read sentence</button>
            </Card>
            {last && <Card title="Just produced">{last.length ? <ul className="space-y-1 text-sm">{last.map((r) => <li key={r.id}>{r.source_key} <b>{r.predicate}</b> {r.target_key} · <Pill s={r.kind} /> v{r.version} · weight {r.weight}</li>)}</ul> : <Empty>No relationships found in that observation.</Empty>}</Card>}
          </div>
          <div className="space-y-4">
            <Card title="Relationships" action={<Link to="/senti/studio/research/diagnostics/memory" className="text-xs text-atmo-ivory/60 hover:text-atmo-ivory">Inspect & correct →</Link>}>
              {!rels.length ? <Empty>None yet.</Empty> : <ul className="space-y-1.5 text-sm">{rels.map((r) => <li key={r.id} className="flex flex-wrap items-center gap-2"><span>{r.source_key} <b>{r.predicate}</b> {r.target_key}</span><Pill s={r.kind} />{r.status !== "active" && <Pill s={r.status} />}{r.support > 0 && r.contradict > 0 && <Pill s="contradicted" />}<span className="text-xs text-atmo-ivory/45">v{r.version} · +{r.support}/−{r.contradict}</span></li>)}</ul>}
            </Card>
            <Card title="Event log">
              {!events.length ? <Empty>No events yet.</Empty> : <ul className="space-y-2 text-sm">{events.map((e) => <li key={e.id} className="border-b border-atmo-ivory/5 pb-2"><span className="text-atmo-ivory/40">#{e.seq} · {e.event_type} · {fmtDate(e.occurred_at ?? e.created_at)}</span><br />{e.text}{e.polarity === -1 && <span className="text-atmo-ivory/50"> (negated)</span>}{Object.keys(e.attributes ?? {}).length > 0 && <span className="block text-xs text-atmo-ivory/45">{Object.entries(e.attributes).map(([k, v]) => `${k}=${v}`).join(", ")}</span>}</li>)}</ul>}
            </Card>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
