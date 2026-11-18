// Senti Core v0.1 — relational memory and event engine (not a trained model).
// Pure logic shared by the senti-studio function, evaluations and tests.
import { entityKey, isContradicted, parseObservation, relationWeight } from "./sentiEngine.ts";

export const CORE_VERSION = "senti-core-0.1";
export const RULES_VERSION = "senti-rules-0.1";
export type RelKind = "fact" | "inferred" | "hypothesis";

export interface CoreEvent { id: string; at: number; text?: string; actor?: string; action?: string; target?: string; outcome?: string; polarity: 1 | -1 }
export interface CoreRelation { id: string; source: string; target: string; predicate: string; kind: RelKind; support: number; contradict: number; weight: number; evidence: string[]; version: number; status: "active" | "superseded"; history: { version: number; reason: string; support: number; contradict: number }[] }

/** In-memory version of Core; the database version in senti-studio applies the same rules. */
export class MemoryStore {
  events: CoreEvent[] = [];
  entities = new Map<string, { key: string; label: string; mentions: number }>();
  relations = new Map<string, CoreRelation>();
  private n = 0;
  private id = () => `m${++this.n}`;
  private touch(label: string) { const key = entityKey(label) || label.toLowerCase(); const e = this.entities.get(key); if (e) e.mentions++; else this.entities.set(key, { key, label, mentions: 1 }); return key; }

  /** Adds evidence to a relation (creating it if needed); polarity −1 counts as a contradiction. */
  link(source: string, predicate: string, target: string, polarity: 1 | -1, evidence: string, kind: RelKind) {
    const k = `${source}|${predicate}|${target}`;
    let r = this.relations.get(k);
    if (!r) { r = { id: this.id(), source, target, predicate, kind, support: 0, contradict: 0, weight: 0, evidence: [], version: 0, status: "active", history: [] }; this.relations.set(k, r); }
    if (polarity === 1) r.support++; else r.contradict++;
    r.weight = relationWeight(r.support, r.contradict); r.evidence.push(evidence); r.version++;
    if (kind === "fact" && r.kind !== "fact") r.kind = "fact";
    r.history.push({ version: r.version, reason: polarity === 1 ? "supported" : "contradicted", support: r.support, contradict: r.contradict });
    return r;
  }

  /** Free text goes through the rules reader; relations it finds are "inferred". */
  ingestText(text: string, at = this.events.length) {
    const p = parseObservation(text);
    const ev: CoreEvent = { id: this.id(), at, text, polarity: p.polarity };
    this.events.push(ev);
    p.entities.forEach((e) => this.touch(e.label));
    p.relations.forEach((r) => this.link(r.source, r.predicate, r.target, r.polarity, ev.id, "inferred"));
    return ev;
  }

  /** Structured observations are recorded facts. */
  ingestStructured(o: { actor: string; action: string; target?: string; outcome?: string; negated?: boolean; at?: number }) {
    const ev: CoreEvent = { id: this.id(), at: o.at ?? this.events.length, actor: o.actor, action: o.action, target: o.target, outcome: o.outcome, polarity: o.negated ? -1 : 1 };
    this.events.push(ev);
    const a = this.touch(o.actor);
    const pred = entityKey(o.action) || o.action.toLowerCase();
    if (o.target) this.link(a, pred, this.touch(o.target), ev.polarity, ev.id, "fact");
    if (o.outcome) this.link(a, "led to", this.touch(o.outcome), ev.polarity, ev.id, "fact");
    return ev;
  }

  /** Marks a relation superseded by a corrected one, keeping the old version. */
  supersede(oldId: string, predicate: string) {
    const old = [...this.relations.values()].find((r) => r.id === oldId); if (!old) return null;
    old.status = "superseded"; old.history.push({ version: old.version + 1, reason: "superseded", support: old.support, contradict: old.contradict }); old.version++;
    return this.link(old.source, entityKey(predicate) || predicate, old.target, 1, `correction:${oldId}`, "fact");
  }

  retrieve(q: { entity?: string; from?: number; to?: number }) {
    const key = q.entity ? entityKey(q.entity) : null;
    const inRange = (r: CoreRelation) => (q.from === undefined && q.to === undefined) || r.evidence.some((id) => { const e = this.events.find((x) => x.id === id); return !!e && (q.from === undefined || e.at >= q.from) && (q.to === undefined || e.at <= q.to); });
    return [...this.relations.values()].filter((r) => r.status === "active" && (!key || r.source === key || r.target === key) && inRange(r)).sort((a, b) => b.weight - a.weight);
  }

  explain(id: string) {
    const r = [...this.relations.values()].find((x) => x.id === id); if (!r) return null;
    return { relation: r, contradicted: isContradicted(r.support, r.contradict), evidence: this.events.filter((e) => r.evidence.includes(e.id)) };
  }
}

// ---------- Evaluation ----------
export type Triple = [string, string, string];
export interface EvalRecord { split?: "train" | "val" | "test"; text?: string; expect?: Triple[]; time?: string | null; steps?: string[]; query?: string; expectRelated?: string[]; contradicted?: Triple }
export const CATEGORIES = ["language", "temporal", "retrieval", "contradiction", "behavior", "generalization", "efficiency"] as const;
export const BASELINES = ["rules", "memory", "model", "llm"] as const;
export type Category = typeof CATEGORIES[number]; export type Baseline = typeof BASELINES[number];
export interface EvalRow { category: Category; baseline: Baseline; metric: string; value: number | null; n: number; status: "measured" | "not_configured" | "not_available" }

const tkey = (t: Triple) => t.map((x) => entityKey(x) || x.toLowerCase()).join("|");
const round = (x: number) => Math.round(x * 1000) / 1000;

function f1(records: EvalRecord[]) {
  let tp = 0, fp = 0, fn = 0, n = 0;
  for (const r of records) {
    if (!r.text || !r.expect) continue; n++;
    const got = new Set(parseObservation(r.text).relations.map((x) => tkey([x.source, x.predicate, x.target])));
    const want = new Set(r.expect.map(tkey));
    got.forEach((g) => (want.has(g) ? tp++ : fp++)); want.forEach((w) => { if (!got.has(w)) fn++; });
  }
  const p = tp + fp ? tp / (tp + fp) : 0, rc = tp + fn ? tp / (tp + fn) : 0;
  return { value: n ? round(p + rc ? (2 * p * rc) / (p + rc) : 0) : null, n };
}

/** Runs one category for the baselines Core can measure; others are reported, never invented. */
export function evaluate(category: Category, records: EvalRecord[], now: () => number = () => performance.now()): EvalRow[] {
  const off = (b: Baseline, metric: string): EvalRow => ({ category, baseline: b, metric, value: null, n: 0, status: b === "model" || b === "llm" ? "not_configured" : "not_available" });
  const m = (b: Baseline, metric: string, value: number | null, n: number): EvalRow => (n ? { category, baseline: b, metric, value, n, status: "measured" } : { ...off(b, metric), status: "not_available" });
  const rest = (metric: string) => [off("model", metric), off("llm", metric)];
  switch (category) {
    case "language": { const r = f1(records); return [m("rules", "f1", r.value, r.n), m("memory", "f1", r.value, r.n), ...rest("f1")]; }
    case "generalization": { const r = f1(records.filter((x) => x.split === "test")); return [m("rules", "test_f1", r.value, r.n), m("memory", "test_f1", r.value, r.n), ...rest("test_f1")]; }
    case "temporal": {
      const rs = records.filter((r) => r.text && r.time !== undefined);
      const ok = rs.filter((r) => (parseObservation(r.text!).timeHint ?? null) === (r.time ? r.time.toLowerCase() : null)).length;
      return [m("rules", "accuracy", rs.length ? round(ok / rs.length) : null, rs.length), off("memory", "accuracy"), ...rest("accuracy")];
    }
    case "retrieval": {
      const rs = records.filter((r) => r.steps?.length && r.query && r.expectRelated?.length);
      let mem = 0, rules = 0, total = 0;
      for (const r of rs) {
        const s = new MemoryStore(); r.steps!.forEach((t) => s.ingestText(t));
        const got = new Set(s.retrieve({ entity: r.query }).flatMap((x) => [x.source, x.target]));
        const last = new MemoryStore(); last.ingestText(r.steps![r.steps!.length - 1]);
        const gotLast = new Set(last.retrieve({ entity: r.query }).flatMap((x) => [x.source, x.target]));
        for (const e of r.expectRelated!) { total++; const k = entityKey(e); if (got.has(k)) mem++; if (gotLast.has(k)) rules++; }
      }
      return [m("rules", "recall", total ? round(rules / total) : null, rs.length), m("memory", "recall", total ? round(mem / total) : null, rs.length), ...rest("recall")];
    }
    case "contradiction": {
      const rs = records.filter((r) => r.steps?.length && r.contradicted);
      let mem = 0;
      for (const r of rs) {
        const s = new MemoryStore(); r.steps!.forEach((t) => s.ingestText(t));
        const rel = s.relations.get(tkey(r.contradicted!)); if (rel && isContradicted(rel.support, rel.contradict)) mem++;
      }
      // A rules-only reader keeps no memory, so it can never see a contradiction across observations.
      return [m("rules", "detection_rate", rs.length ? 0 : null, rs.length), m("memory", "detection_rate", rs.length ? round(mem / rs.length) : null, rs.length), ...rest("detection_rate")];
    }
    case "efficiency": {
      const texts = records.flatMap((r) => r.text ? [r.text] : r.steps ?? []);
      if (!texts.length) return [off("rules", "ms_per_observation"), off("memory", "ms_per_observation"), ...rest("ms_per_observation")];
      let t = now(); texts.forEach((x) => parseObservation(x)); const rules = (now() - t) / texts.length;
      const s = new MemoryStore(); t = now(); texts.forEach((x) => s.ingestText(x)); const mem = (now() - t) / texts.length;
      return [m("rules", "ms_per_observation", round(rules), texts.length), m("memory", "ms_per_observation", round(mem), texts.length), ...rest("ms_per_observation")];
    }
    default: return [off("rules", "accuracy"), off("memory", "accuracy"), ...rest("accuracy")];
  }
}

/** Assigns train/val/test splits deterministically (every 5th to test, every 5th+1 to val). */
export function assignSplits(records: EvalRecord[]) {
  const out = records.map((r, i) => ({ ...r, split: r.split ?? (i % 5 === 0 ? "test" : i % 5 === 1 ? "val" : "train") as EvalRecord["split"] }));
  const count = (s: string) => out.filter((r) => r.split === s).length;
  return { records: out, splits: { train: count("train"), val: count("val"), test: count("test") } };
}

export const SYNTHETIC: { name: string; description: string; records: EvalRecord[] }[] = [
  { name: "Simple relations v1", description: "Short synthetic sentences with hand-labelled subject–verb–object links and time words.", records: [
    { text: "Rosa bakes the bread every morning.", expect: [["rosa", "bake", "bread"]], time: "every morning" },
    { text: "Leo watches the dog.", expect: [["leo", "watch", "dog"]], time: null },
    { text: "Maya waters the garden on Sunday.", expect: [["maya", "water", "garden"]], time: "sunday" },
    { text: "Omar fixed the bike yesterday.", expect: [["omar", "fix", "bike"]], time: "yesterday" },
    { text: "Ana feeds the cat at 7 am.", expect: [["ana", "feed", "cat"]], time: "7 am" },
    { text: "Kofi paints the fence.", expect: [["kofi", "paint", "fence"]], time: null },
    { text: "Priya reads the report this morning.", expect: [["priya", "read", "report"]], time: "this morning" },
    { text: "Jun opens the shop.", expect: [["jun", "open", "shop"]], time: null },
    { text: "Lena drives the truck last week.", expect: [["lena", "drive", "truck"]], time: "last week" },
    { text: "Sam cleans the kitchen tonight.", expect: [["sam", "clean", "kitchen"]], time: "tonight" },
  ] },
  { name: "Memory and contradictions v1", description: "Multi-step synthetic stories for retrieval across observations and contradiction detection.", records: [
    { steps: ["Ana feeds the cat.", "Ana walks the dog.", "Leo calls Ana."], query: "Ana", expectRelated: ["cat", "dog", "leo"] },
    { steps: ["Rosa bakes the bread.", "Rosa sells the cake."], query: "Rosa", expectRelated: ["bread", "cake"] },
    { steps: ["Omar fixes the bike.", "Maya rides the bike."], query: "bike", expectRelated: ["omar", "maya"] },
    { steps: ["Ana feeds the cat.", "Ana did not feed the cat on Sunday."], contradicted: ["ana", "feed", "cat"] },
    { steps: ["Leo opens the shop.", "Leo never opens the shop."], contradicted: ["leo", "open", "shop"] },
    { steps: ["Kofi paints the fence.", "Kofi stopped painting the fence."], contradicted: ["kofi", "paint", "fence"] },
  ] },
];
