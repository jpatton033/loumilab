import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import StudioShell, { Empty, ghost } from "@/components/senti/studio/StudioShell";
import SourceInput from "@/components/senti/explore/SourceInput";
import RelationGraph from "@/components/senti/RelationGraph";
import { studio, fmtDate } from "@/lib/senti/studio";
import { cn } from "@/lib/utils";
import { CAPABILITIES, evidenceStatus, supportWords, type EvidenceStatus } from "../../../../supabase/functions/_shared/sentiExplore";

type Source = { id: string; title: string; kind: string; text: string; metadata: Record<string, string>; passages: number; engine_version: string; created_at: string };
type Ev = { id: string; seq: number; text: string; time_hint: string | null; polarity: number; source_id: string | null; passage_index: number | null; created_at: string };
type Ent = { key: string; label: string; kind: string; mentions: number };
type Rel = { id: string; source_key: string; target_key: string; predicate: string; weight: number; support: number; contradict: number; evidence: string[]; kind: string; status: string; created_at: string };
type Ver = { relation_id: string; version: number; reason: string; created_at: string; snapshot: Partial<Rel> };
type WS = { exploration: { id: string; title: string }; sources: Source[]; events: Ev[]; entities: Ent[]; relations: Rel[]; versions: Ver[]; corrections: { action: string; before: any; after: any; created_at: string }[]; reader: string; core: string };

type Label = "In the text" | "Pattern found" | "Possible interpretation" | "Not supported";
const LabelPill = ({ l }: { l: Label }) => (
  <span className={cn("inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
    l === "In the text" ? "border-atmo-ivory/40 text-atmo-ivory" : l === "Pattern found" ? "border-atmo-copper/50 text-atmo-copper" : l === "Possible interpretation" ? "border-atmo-teal/60 text-atmo-ivory/80" : "border-atmo-ivory/15 text-atmo-ivory/45")}>{l}</span>
);
const STATUS: Record<EvidenceStatus, string> = { documented: "Directly documented", inferred: "Inferred from wording", disputed: "Disputed", unverified: "Unverified" };
const AREAS = ["Meaning", "Context", "Connections", "Evolution"] as const;
type Area = typeof AREAS[number];

const Item = ({ label, title, detail, onClick, active }: { label: Label; title: string; detail?: string; onClick?: () => void; active?: boolean }) => (
  <button type="button" onClick={onClick} disabled={!onClick}
    className={cn("flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition", active ? "border-atmo-copper/60 bg-atmo-copper/10" : "border-atmo-ivory/10 hover:border-atmo-ivory/25", !onClick && "cursor-default hover:border-atmo-ivory/10")}>
    <span className="min-w-0"><span className="block text-sm text-atmo-ivory">{title}</span>{detail && <span className="mt-0.5 block text-xs text-atmo-ivory/55">{detail}</span>}</span><LabelPill l={label} />
  </button>
);
const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-atmo-ivory/50 first:mt-0">{children}</h3>;

export default function Workspace() {
  const { id } = useParams();
  const [ws, setWs] = useState<WS | null>(null); const [err, setErr] = useState<string | null>(null);
  const [area, setArea] = useState<Area>("Meaning"); const [src, setSrc] = useState<string>("all");
  const [hl, setHl] = useState<{ key: string; ids: Set<string> } | null>(null);
  const [adding, setAdding] = useState(false); const [view, setView] = useState<"graph" | "list">("graph"); const [rel, setRel] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => studio<WS>("workspace", { exploration_id: id }).then(setWs).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const evById = useMemo(() => new Map((ws?.events ?? []).map((e) => [e.id, e])), [ws]);
  const srcName = useMemo(() => new Map((ws?.sources ?? []).map((s) => [s.id, s.title])), [ws]);
  const events = useMemo(() => (ws?.events ?? []).filter((e) => src === "all" || e.source_id === src), [ws, src]);
  const evIds = useMemo(() => new Set(events.map((e) => e.id)), [events]);
  const rels = useMemo(() => (ws?.relations ?? []).filter((r) => r.status !== "rejected" && r.status !== "superseded" && (src === "all" || r.evidence?.some((e) => evIds.has(e)))), [ws, src, evIds]);
  const relSources = (r: Rel) => new Set((r.evidence ?? []).map((e) => evById.get(e)?.source_id).filter(Boolean));
  const ents = useMemo(() => {
    const keys = new Set(rels.flatMap((r) => [r.source_key, r.target_key]));
    const lower = events.map((e) => e.text.toLowerCase());
    return (ws?.entities ?? []).filter((e) => src === "all" || keys.has(e.key) || lower.some((t) => t.includes(e.label.toLowerCase())));
  }, [ws, rels, events, src]);
  const passagesWith = (label: string) => new Set(events.filter((e) => e.text.toLowerCase().includes(label.toLowerCase())).map((e) => e.id));

  const select = (key: string, ids: Set<string>) => {
    if (hl?.key === key) return setHl(null);
    setHl({ key, ids });
    requestAnimationFrame(() => textRef.current?.querySelector("[data-hl='1']")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };

  if (err) return <StudioShell title="Exploration"><Empty>{err}</Empty><Link to="/senti/studio" className={cn(ghost, "mt-4")}>Back to Explore</Link></StudioShell>;
  if (!ws) return <StudioShell title="Exploration" hideTitle><Empty>Opening exploration…</Empty></StudioShell>;

  const keyPassages = [...events].map((e) => ({ e, n: ws.relations.filter((r) => r.evidence?.includes(e.id)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5);
  const negative = events.filter((e) => e.polarity < 0);
  const times = [...new Set(events.map((e) => e.time_hint).filter(Boolean))] as string[];
  const meta = ws.sources.filter((s) => src === "all" || s.id === src).flatMap((s) => Object.entries(s.metadata ?? {}).map(([k, v]) => ({ k, v, s: s.title })));
  const selRel = rels.find((r) => r.id === rel) ?? null;

  // Evolution: each source added, then what changed in connections during that read, then manual revisions.
  const timeline = ws.sources.map((s, i) => {
    const start = new Date(s.created_at).getTime(), end = ws.sources[i + 1] ? new Date(ws.sources[i + 1].created_at).getTime() : Infinity;
    const vs = ws.versions.filter((v) => { const t = new Date(v.created_at).getTime(); return t >= start && t < end && !/rejected|superseded|relabelled/.test(v.reason ?? ""); });
    const byRel = new Map<string, Ver[]>(); vs.forEach((v) => byRel.set(v.relation_id, [...(byRel.get(v.relation_id) ?? []), v]));
    let fresh = 0, stronger = 0, challenged = 0;
    byRel.forEach((list) => {
      const first = Math.min(...list.map((v) => v.version)), last = list.reduce((a, b) => (b.version > a.version ? b : a));
      const prev = ws.versions.find((v) => v.relation_id === last.relation_id && v.version === first - 1);
      if (first === 1) fresh++; else if ((last.snapshot?.contradict ?? 0) > (prev?.snapshot?.contradict ?? 0)) challenged++; else stronger++;
    });
    return { s, fresh, stronger, challenged };
  });
  const revisions = ws.versions.filter((v) => /rejected|superseded|relabelled/.test(v.reason ?? ""));
  const relLabel = (rid: string) => { const r = ws.relations.find((x) => x.id === rid); return r ? `${r.source_key} → ${r.predicate} → ${r.target_key}` : "a connection"; };

  return (
    <StudioShell title={ws.exploration.title} hideTitle>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-atmo-copper">Exploration</p><h1 className="mt-2 font-hero text-3xl font-semibold sm:text-4xl">{ws.exploration.title}.</h1>
          <p className="mt-1 text-sm text-atmo-ivory/55">{ws.sources.length} source{ws.sources.length === 1 ? "" : "s"} · {ws.events.length} passages · read with {ws.reader} and {ws.core}</p></div>
        <button className="inline-flex items-center gap-2 rounded-full border border-atmo-copper/50 px-4 py-2 text-sm text-atmo-ivory transition hover:bg-atmo-copper/15" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          {adding ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}{adding ? "Close" : "Add another source"}</button>
      </div>
      {adding && <div className="mb-8"><SourceInput compact explorationId={ws.exploration.id} onDone={() => { setAdding(false); setArea("Evolution"); load(); }} /></div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Source */}
        <section aria-label="Original source" className="rounded-3xl border border-atmo-ivory/10 bg-atmo-charcoal/40 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="mb-3 flex flex-wrap gap-2">
            {ws.sources.length > 1 && <button onClick={() => setSrc("all")} className={cn("rounded-full border px-3 py-1 text-xs", src === "all" ? "border-atmo-copper/60 text-atmo-ivory" : "border-atmo-ivory/15 text-atmo-ivory/55")}>All sources</button>}
            {ws.sources.map((s) => <button key={s.id} onClick={() => setSrc(s.id)} className={cn("max-w-[14rem] truncate rounded-full border px-3 py-1 text-xs", src === s.id || ws.sources.length === 1 ? "border-atmo-copper/60 text-atmo-ivory" : "border-atmo-ivory/15 text-atmo-ivory/55")}>{s.title}</button>)}
          </div>
          {hl && <p className="mb-2 text-xs text-atmo-copper">{hl.ids.size} supporting passage{hl.ids.size === 1 ? "" : "s"} highlighted · <button className="underline" onClick={() => setHl(null)}>clear</button></p>}
          <div ref={textRef} className="space-y-1 overflow-y-auto pr-1 text-[15px] leading-relaxed lg:max-h-[calc(100vh-14rem)]">
            {events.map((e, i) => {
              const newSrc = src === "all" && ws.sources.length > 1 && (i === 0 || events[i - 1].source_id !== e.source_id);
              const on = hl?.ids.has(e.id);
              return (<div key={e.id}>
                {newSrc && <p className="mb-1 mt-4 text-[11px] uppercase tracking-wider text-atmo-ivory/40 first:mt-0">{srcName.get(e.source_id ?? "") ?? "Earlier notes"}</p>}
                <p data-hl={on ? "1" : undefined} className={cn("rounded-lg px-2 py-1 transition", on ? "bg-atmo-copper/20 text-atmo-ivory" : hl ? "text-atmo-ivory/40" : "text-atmo-ivory/80")}>{e.text}</p>
              </div>);
            })}
            {!events.length && <Empty>No passages in this source.</Empty>}
          </div>
        </section>

        {/* Analysis */}
        <section aria-label="Analysis">
          <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-atmo-ivory/10 bg-atmo-charcoal/40 p-1">
            {AREAS.map((a) => <button key={a} role="tab" aria-selected={area === a} onClick={() => setArea(a)} className={cn("flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm transition", area === a ? "bg-atmo-ivory text-atmo-obsidian" : "text-atmo-ivory/60 hover:text-atmo-ivory")}>{a}</button>)}
          </div>

          {area === "Meaning" && <div>
            <H>Key passages</H>
            <div className="space-y-2">{keyPassages.length ? keyPassages.map(({ e, n }) => <Item key={e.id} label="In the text" title={`“${e.text.length > 140 ? e.text.slice(0, 140) + "…" : e.text}”`} detail={`Linked to ${n} connection${n === 1 ? "" : "s"}`} active={hl?.key === `p${e.id}`} onClick={() => select(`p${e.id}`, new Set([e.id]))} />) : <Empty>No passage linked two items yet.</Empty>}</div>
            <H>People, places, things and ideas</H>
            <div className="space-y-2">{ents.slice(0, 14).map((e) => <Item key={e.key} label="Pattern found" title={e.label} detail={`${e.kind === "name" ? "Name" : e.kind === "time" ? "Time" : "Thing or idea"} · mentioned ${e.mentions} time${e.mentions === 1 ? "" : "s"}`} active={hl?.key === `e${e.key}`} onClick={() => select(`e${e.key}`, passagesWith(e.label))} />)}{!ents.length && <Empty>Nothing identified.</Empty>}</div>
            <H>Wording</H>
            <Item label="Pattern found" title={negative.length ? `${negative.length} passage${negative.length === 1 ? "" : "s"} use negative wording` : "No negative wording found"} detail="Words like not, never or no longer. This is about wording, not feelings." active={hl?.key === "neg"} onClick={negative.length ? () => select("neg", new Set(negative.map((e) => e.id))) : undefined} />
            <H>Not available yet</H>
            <div className="space-y-2">{CAPABILITIES.filter((c) => c.area === "meaning" && c.status !== "operational").map((c) => <Item key={c.id} label="Not supported" title={c.label} detail="Needs a language model Senti doesn't have yet. Senti won't guess." />)}</div>
          </div>}

          {area === "Context" && <div>
            {meta.length > 0 && <><H>You supplied</H><div className="space-y-2">{meta.map((m, i) => <Item key={i} label="In the text" title={`${m.k[0].toUpperCase() + m.k.slice(1)}: ${m.v}`} detail={`Entered by you for “${m.s}”, not checked against other sources`} />)}</div></>}
            <H>Who?</H><div className="space-y-2">{ents.filter((e) => e.kind === "name").slice(0, 8).map((e) => <Item key={e.key} label="In the text" title={e.label} detail="Named in the text" active={hl?.key === `w${e.key}`} onClick={() => select(`w${e.key}`, passagesWith(e.label))} />)}{!ents.some((e) => e.kind === "name") && <Empty>No names found in the text.</Empty>}</div>
            <H>What?</H><div className="space-y-2">{rels.slice(0, 6).map((r) => <Item key={r.id} label={evidenceStatus(r) === "documented" ? "In the text" : "Pattern found"} title={`${r.source_key} ${r.predicate} ${r.target_key}`} detail={supportWords(r.support, r.contradict)} active={hl?.key === `r${r.id}`} onClick={() => select(`r${r.id}`, new Set(r.evidence))} />)}{!rels.length && <Empty>No actions found yet.</Empty>}</div>
            <H>When?</H><div className="space-y-2">{times.map((t) => <Item key={t} label="In the text" title={t} detail="Time words in the text" active={hl?.key === `t${t}`} onClick={() => select(`t${t}`, new Set(events.filter((e) => e.time_hint === t).map((e) => e.id)))} />)}{!times.length && <Empty>The text doesn't say when.</Empty>}</div>
            <H>Where?</H><Item label="Not supported" title="Senti can't yet tell places apart from other names" detail="Places appear under Who? and Meaning when they're capitalized." />
            <H>Why? and How?</H><Item label="Not supported" title="Senti doesn't infer reasons or causes" detail="Only connections stated in the text are shown, under Connections." />
            <div className="mt-6 rounded-2xl border border-dashed border-atmo-ivory/15 p-4 text-sm text-atmo-ivory/60">Historical, social and cultural context from outside sources isn't available yet. Senti only reports what this exploration's sources say and what you supplied.</div>
          </div>}

          {area === "Connections" && <div>
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm text-atmo-ivory/60">{rels.length} connection{rels.length === 1 ? "" : "s"}</p>
              <div className="flex gap-1 rounded-full border border-atmo-ivory/10 p-0.5 text-xs">{(["graph", "list"] as const).map((v) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cn("rounded-full px-3 py-1 capitalize", view === v ? "bg-atmo-ivory/15 text-atmo-ivory" : "text-atmo-ivory/55")}>{v}</button>)}</div></div>
            {view === "graph" ? <RelationGraph plain nodes={(ws.entities.filter((e) => rels.some((r) => r.source_key === e.key || r.target_key === e.key)))} edges={rels.map((r) => ({ ...r, contradicted: r.support > 0 && r.contradict > 0 }))} selected={rel} onSelect={(rid) => { setRel(rid); const r = rels.find((x) => x.id === rid); if (r) select(`r${rid}`, new Set(r.evidence)); }} />
              : <div className="space-y-2">{rels.map((r) => <Item key={r.id} label={evidenceStatus(r) === "documented" ? "In the text" : evidenceStatus(r) === "unverified" ? "Not supported" : "Pattern found"} title={`${r.source_key} → ${r.predicate} → ${r.target_key}`} detail={`${STATUS[evidenceStatus(r)]} · ${supportWords(r.support, r.contradict)}${relSources(r).size > 1 ? ` · across ${relSources(r).size} sources` : ""}`} active={rel === r.id} onClick={() => { setRel(r.id); select(`r${r.id}`, new Set(r.evidence)); }} />)}</div>}
            {selRel && <div className="mt-4 rounded-2xl border border-atmo-copper/30 bg-atmo-charcoal/50 p-4">
              <p className="font-medium">{selRel.source_key} → {selRel.predicate} → {selRel.target_key}</p>
              <p className="mt-1 text-sm text-atmo-ivory/65">{STATUS[evidenceStatus(selRel)]} · {supportWords(selRel.support, selRel.contradict)}{relSources(selRel).size > 1 ? ` · found in ${relSources(selRel).size} sources` : ""}</p>
              <p className="mt-2 text-xs text-atmo-ivory/45">Found by linking two items through the word between them in one passage. It's a pattern in the wording, not a confirmed fact.</p>
              <ul className="mt-3 space-y-1.5 text-sm">{selRel.evidence.map((eid) => evById.get(eid)).filter(Boolean).map((e) => <li key={e!.id} className="rounded-lg bg-atmo-obsidian/50 px-3 py-2 text-atmo-ivory/80">“{e!.text}” <span className="text-xs text-atmo-ivory/40">· {srcName.get(e!.source_id ?? "") ?? "notes"}</span></li>)}</ul>
            </div>}
          </div>}

          {area === "Evolution" && <div>
            <p className="mb-4 rounded-2xl border border-atmo-ivory/10 p-4 text-sm text-atmo-ivory/60">Evolution shows how Senti's saved knowledge changes as sources are added. This is stored information being updated, not a model learning. Earlier versions are always kept.</p>
            <ol className="relative space-y-5 border-l border-atmo-copper/30 pl-5">
              {timeline.map(({ s, fresh, stronger, challenged }) => <li key={s.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-atmo-copper" aria-hidden />
                <p className="text-xs text-atmo-ivory/45">{fmtDate(s.created_at)}</p>
                <p className="font-medium">Added “{s.title}”</p>
                <p className="text-sm text-atmo-ivory/65">{s.passages} passages read. {fresh} new connection{fresh === 1 ? "" : "s"}{stronger ? `, ${stronger} more strongly supported` : ""}{challenged ? `, ${challenged} challenged` : ""}.</p>
              </li>)}
              {revisions.map((v, i) => <li key={i} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border border-atmo-copper bg-atmo-obsidian" aria-hidden />
                <p className="text-xs text-atmo-ivory/45">{fmtDate(v.created_at)}</p><p className="font-medium">Revised {relLabel(v.relation_id)}</p><p className="text-sm text-atmo-ivory/65 first-letter:uppercase">{v.reason}</p></li>)}
            </ol>
            {!timeline.length && <Empty>Nothing has been added yet.</Empty>}
          </div>}
        </section>
      </div>
    </StudioShell>
  );
}
