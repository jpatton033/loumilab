import { useCallback, useEffect, useMemo, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import SentiStatus from "@/components/senti/SentiStatus";
import SentiShell, { Eyebrow } from "@/components/senti/SentiShell";
import RelationGraph, { type GEdge, type GNode } from "@/components/senti/RelationGraph";
import { parseObservation, relationWeight, isContradicted } from "../../../supabase/functions/_shared/sentiEngine";

const KEY = "senti_session_token";
const btn = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primary = `${btn} bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85`;
const ghost = `${btn} border border-atmo-ivory/25 text-atmo-ivory hover:bg-atmo-ivory/10`;

const SCENARIOS: { name: string; lines: string[] }[] = [
  { name: "A neighborhood bakery", lines: ["Rosa opens the bakery at 6 am.", "Rosa bakes the bread every morning.", "Theo buys the bread before work.", "Theo did not buy the bread on Sunday.", "Rosa bakes the bread every morning."] },
  { name: "A community garden", lines: ["Maya waters the garden every morning.", "Jonah repairs the fence on Saturday.", "Maya did not water the garden yesterday.", "Maya waters the garden after rain stops."] },
];

type Graph = { events: { id: string; seq: number; text: string; time_hint: string | null; polarity: number }[]; entities: GNode[]; relations: (GEdge & { support: number; contradict: number; evidence: string[] })[]; corrections: { action: string; before: unknown; after: unknown; created_at: string }[]; engine: string };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("senti-engine", { body });
  if (error) {
    let msg = "The research engine is unavailable right now."; let code = "unavailable";
    if (error instanceof FunctionsHttpError) { try { const j = await error.context.json(); msg = j.error ?? msg; code = j.code ?? code; } catch { /* keep */ } }
    throw Object.assign(new Error(msg), { code });
  }
  return data;
}

/** Illustrative: the same published rules run in the browser over a fictional script. Nothing is stored. */
function Demo() {
  const [s, setS] = useState(0);
  const [step, setStep] = useState(0);
  const g = useMemo(() => {
    const ents = new Map<string, GNode>(); const rels = new Map<string, GEdge & { support: number; contradict: number }>();
    SCENARIOS[s].lines.slice(0, step).forEach((line) => {
      const p = parseObservation(line);
      p.entities.forEach((e) => { const x = ents.get(e.key); ents.set(e.key, { key: e.key, label: e.label, mentions: (x?.mentions ?? 0) + 1 }); });
      p.relations.forEach((r) => { const id = `${r.source}|${r.predicate}|${r.target}`; const x = rels.get(id) ?? { id, source_key: r.source, target_key: r.target, predicate: r.predicate, weight: 0, support: 0, contradict: 0 };
        if (r.polarity === 1) x.support++; else x.contradict++; x.weight = relationWeight(x.support, x.contradict); x.contradicted = isContradicted(x.support, x.contradict); rels.set(id, x); });
    });
    return { nodes: [...ents.values()], edges: [...rels.values()] };
  }, [s, step]);
  const lines = SCENARIOS[s].lines;
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="rounded-2xl border border-atmo-ivory/15 px-4 py-3 text-sm text-atmo-ivory/70">Illustrative demonstration. A fictional script runs through Senti's current rules in your browser. Nothing is saved.</p>
        <div className="mt-5 flex flex-wrap gap-2">{SCENARIOS.map((x, i) => <button key={x.name} className={i === s ? primary : ghost} onClick={() => { setS(i); setStep(0); }}>{x.name}</button>)}</div>
        <ol className="mt-6 space-y-2">{lines.map((l, i) => <li key={i} className={`rounded-xl px-4 py-2 text-sm transition-colors ${i < step ? "bg-atmo-charcoal/70 text-atmo-ivory" : "text-atmo-ivory/35"}`}>{l}</li>)}</ol>
        <div className="mt-6 flex gap-2">
          <button className={primary} disabled={step >= lines.length} onClick={() => setStep(step + 1)}>Next observation</button>
          <button className={ghost} onClick={() => setStep(0)}>Reset</button>
        </div>
      </div>
      <div className="lg:col-span-7"><RelationGraph nodes={g.nodes} edges={g.edges} /><p className="mt-3 text-xs text-atmo-ivory/50">Line thickness = confidence from counts. Dashed red = contradicted by a later observation.</p></div>
    </div>
  );
}

function Live() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(KEY));
  const [g, setG] = useState<Graph | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [down, setDown] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [relabel, setRelabel] = useState("");
  const [last, setLast] = useState<{ predicate: string; source: string; target: string; before: number | null; after: number; contradicted: boolean }[]>([]);

  const fail = (e: unknown) => { const x = e as Error & { code?: string }; if (x.code === "no_session") { localStorage.removeItem(KEY); setToken(null); setG(null); } else if (x.code === "unavailable" || x.code === "engine_error") setDown(x.message); else toast.error(x.message); };
  const load = useCallback(async (t: string) => { try { setG(await call({ op: "graph", token: t })); setDown(null); } catch (e) { fail(e); } }, []);
  useEffect(() => { call({ op: "status" }).then((s) => { if (!s.live) setDown("Live research mode is currently off."); else if (token) load(token); }).catch(() => setDown("The research engine is unavailable right now.")); }, [token, load]);

  const start = async () => { setBusy(true); try { const r = await call({ op: "create_session", consent }); localStorage.setItem(KEY, r.token); setToken(r.token); } catch (e) { fail(e); } setBusy(false); };
  const observe = async (e: React.FormEvent) => { e.preventDefault(); if (!token) return; setBusy(true); try { const r = await call({ op: "observe", token, text }); setG(r.graph); setLast(r.changes); setText(""); } catch (x) { fail(x); } setBusy(false); };
  const correct = async (action: "reject" | "relabel" | "confirm") => { if (!token || !sel) return; setBusy(true); try { const r = await call({ op: "correct", token, relation_id: sel, action, predicate: action === "relabel" ? relabel : undefined }); setG(r.graph); setSel(null); setRelabel(""); } catch (x) { fail(x); } setBusy(false); };
  const remove = async () => { if (!token || !confirm("Delete this session and everything in it?")) return; try { await call({ op: "delete_session", token }); } catch { /* already gone */ } localStorage.removeItem(KEY); setToken(null); setG(null); toast.success("Session deleted."); };

  if (down) return <div role="status" className="rounded-3xl border border-atmo-ivory/15 p-8"><p className="font-semibold">Live research mode is unavailable.</p><p className="mt-2 text-sm text-atmo-ivory/60">{down} No results are shown rather than made up. Try the guided demonstration in the meantime.</p></div>;
  if (!token) return (
    <div className="max-w-xl rounded-3xl border border-atmo-ivory/15 p-8">
      <p className="font-semibold">Start a private research session.</p>
      <p className="mt-2 text-sm text-atmo-ivory/60">Your observations are stored only in this session, which expires after 30 days and can be deleted at any time. Please use fictional or everyday examples and no personal information.</p>
      <label className="mt-5 flex items-start gap-3 text-sm text-atmo-ivory/70"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" /> Loumilab may use this session's text to evaluate future versions of Senti. (Optional; off by default.)</label>
      <button className={`${primary} mt-6`} disabled={busy} onClick={start}>Start session</button>
    </div>);

  const selRel = g?.relations.find((r) => r.id === sel);
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <form onSubmit={observe}>
          <label htmlFor="obs" className="text-sm text-atmo-ivory/70">Add an observation</label>
          <textarea id="obs" rows={2} maxLength={400} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Ana feeds the cat every evening." className="mt-2 w-full rounded-2xl border border-atmo-ivory/15 bg-atmo-charcoal/60 px-4 py-3 text-atmo-ivory placeholder:text-atmo-ivory/40 outline-none focus:border-atmo-ivory/50" />
          <button className={`${primary} mt-3`} disabled={busy || text.trim().length < 3}>{busy ? "Processing…" : "Record"}</button>
        </form>
        {last.length > 0 && <div className="rounded-2xl border border-atmo-ivory/10 p-4 text-sm"><p className="text-atmo-ivory/55">What changed</p>{last.map((c, i) => <p key={i} className="mt-1">{c.source} → {c.predicate} → {c.target}: {c.before === null ? "new" : c.before.toFixed(2)} → {c.after.toFixed(2)}{c.contradicted && <span className="text-destructive"> · contradicted</span>}</p>)}</div>}
        {selRel && (
          <div className="rounded-2xl border border-dot/50 p-4 text-sm">
            <p className="font-semibold">{selRel.source_key} → {selRel.predicate} → {selRel.target_key}</p>
            <p className="mt-1 text-atmo-ivory/60">Confidence {selRel.weight.toFixed(2)} · {selRel.support} supporting · {selRel.contradict} contradicting</p>
            <ul className="mt-2 space-y-1 text-atmo-ivory/70">{g?.events.filter((e) => selRel.evidence.includes(e.id)).map((e) => <li key={e.id}>“{e.text}”</li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={ghost} onClick={() => correct("confirm")}>Confirm</button>
              <button className={ghost} onClick={() => correct("reject")}>Reject</button>
              <input value={relabel} onChange={(e) => setRelabel(e.target.value)} placeholder="Correct verb" maxLength={40} className="h-11 w-36 rounded-full border border-atmo-ivory/25 bg-transparent px-4" />
              <button className={ghost} disabled={relabel.trim().length < 2} onClick={() => correct("relabel")}>Relabel</button>
            </div>
          </div>)}
        <div><p className="text-sm text-atmo-ivory/55">Memory · {g?.events.length ?? 0} observations</p>
          <ol className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">{g?.events.map((e) => <li key={e.id} className="text-atmo-ivory/75">{e.seq}. {e.text}{e.time_hint && <span className="text-atmo-ivory/45"> · {e.time_hint}</span>}</li>)}</ol></div>
        {!!g?.corrections.length && <div><p className="text-sm text-atmo-ivory/55">Revision history</p><ul className="mt-2 space-y-1 text-xs text-atmo-ivory/60">{g.corrections.map((c, i) => <li key={i}>{new Date(c.created_at).toLocaleTimeString()} · {c.action}</li>)}</ul></div>}
        <button className="text-sm text-atmo-ivory/55 underline underline-offset-4 hover:text-atmo-ivory" onClick={remove}>Delete this session</button>
      </div>
      <div className="lg:col-span-7"><RelationGraph nodes={g?.entities ?? []} edges={g?.relations ?? []} selected={sel} onSelect={setSel} /><p className="mt-3 text-xs text-atmo-ivory/50">Select a link to see its evidence and correct it. Engine: {g?.engine}. Rules and counting statistics, not a trained model.</p></div>
    </div>
  );
}

export default function SentiLab() {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  return (
    <SentiShell>
      <SEOHead title="Senti Lab | Senti by Loumilab" description="Try Senti's research engine: paste short text, see the people, things and links it finds, and correct them, with evidence for every step." path="/senti/lab" />
      <section className="section-container py-16 lg:py-24">
        <Eyebrow>Senti Lab</Eyebrow>
        <h1 className="mt-4 font-hero text-4xl font-semibold lg:text-6xl">What would you like to explore?</h1>
        <p className="mt-4 max-w-2xl text-lg text-atmo-ivory/70">Explore language, ideas, history, and human expression. Discover relationships, examine context, and see how understanding evolves.</p>
        <ol className="mt-8 grid max-w-4xl gap-px overflow-hidden rounded-3xl border border-atmo-ivory/10 bg-atmo-ivory/10 sm:grid-cols-4">
          {[["Paste", "Type or paste a few short sentences."], ["Explore", "See the people, things and time words Senti finds."], ["Connect", "Open any link to read the sentences behind it."], ["Correct", "Fix a link and watch the result update. Nothing is erased."]].map(([t, d], i) => <li key={t} className="bg-atmo-obsidian p-5"><span className="font-mono text-xs text-atmo-ivory/45">0{i + 1}</span><p className="mt-2 font-semibold">{t}</p><p className="mt-1 text-sm text-atmo-ivory/60">{d}</p></li>)}
        </ol>
        <p className="mt-4 max-w-2xl text-sm text-atmo-ivory/50">Today the public Lab reads short pasted text with transparent rules, in a temporary session you can delete. It does not accept uploads, read web links, or interpret themes, tone or symbolism; those remain private research or future work.</p>
        <div className="mt-8 flex gap-2" role="tablist">
          <button role="tab" aria-selected={mode === "demo"} className={mode === "demo" ? primary : ghost} onClick={() => setMode("demo")}>Guided demonstration</button>
          <button role="tab" aria-selected={mode === "live"} className={mode === "live" ? primary : ghost} onClick={() => setMode("live")}>Live research mode</button>
        </div>
        <div className="mt-10">{mode === "demo" ? <Demo /> : <Live />}</div>
        <p className="mt-6 text-xs text-atmo-ivory/45">Live mode runs on the same Senti Core v0.1 rules used in Loumilab's private Research Studio, in a separate public space. Your session never mixes with internal research data.</p>
      </section>
      <div className="section-container pb-24"><SentiStatus /></div>
    </SentiShell>
  );
}
