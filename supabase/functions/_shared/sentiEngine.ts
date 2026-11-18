// Senti research engine v0.1 — deterministic rules + counting statistics. No AI model, no training.
// Shared by the senti-engine function and tests.

export const ENGINE_VERSION = "senti-rules-0.1";

export interface ParsedEntity { key: string; label: string; kind: "name" | "thing" | "time" }
export interface ParsedRelation { source: string; target: string; predicate: string; polarity: 1 | -1 }
export interface ParsedObservation { entities: ParsedEntity[]; relations: ParsedRelation[]; timeHint: string | null; polarity: 1 | -1 }

const STOP = new Set("a an the and or but if then so to of in on at by for with from into onto over under about as is are was were be been being it its this that these those he she they we i you his her their our my your them him us me there here very really just also not never no do does did has have had will would can could should may might".split(" "));
const NEG = /\b(not|never|no longer|didn't|doesn't|don't|isn't|wasn't|won't|can't|cannot|stopped)\b/i;
const TIME = /\b(yesterday|today|tonight|tomorrow|this (?:morning|afternoon|evening|week)|last (?:night|week|month|year)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|\d{1,2}(?::\d{2})?\s?(?:am|pm)|before|after|later|earlier|then|every (?:day|week|morning))\b/i;
const DET = /\b(?:the|a|an|my|our|his|her|their)\s+([a-z][a-z-]{2,})\b/gi;

const lemma = (w: string) => {
  const s = w.toLowerCase();
  if (s.length > 5 && s.endsWith("ing")) return s.slice(0, -3);
  if (s.length > 4 && s.endsWith("ied")) return s.slice(0, -3) + "y";
  if (s.length > 4 && s.endsWith("ed")) return /(?:at|iz|ak|ov|ur|ag)ed$/.test(s) ? s.slice(0, -1) : s.slice(0, -2);
  if (s.length > 4 && /(?:ches|shes|xes|zes|sses)$/.test(s)) return s.slice(0, -2);
  if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
};
export const entityKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(/\s+/).map(lemma).join(" ");

export function cleanText(input: unknown): string | null {
  const s = String(input ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return s.length >= 3 && s.length <= 400 ? s : null;
}

/** Finds names (capitalized runs) and determiner-led nouns, in order of appearance. */
export function extractEntities(text: string): (ParsedEntity & { at: number })[] {
  const found: (ParsedEntity & { at: number })[] = [];
  const seen = new Set<string>();
  const push = (label: string, kind: ParsedEntity["kind"], at: number) => {
    const key = entityKey(label);
    if (!key || STOP.has(key) || seen.has(key)) return;
    seen.add(key); found.push({ key, label, kind, at });
  };
  for (const m of text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)) {
    const first = m[1].split(" ")[0].toLowerCase();
    if (STOP.has(first) && !m[1].includes(" ")) continue;
    if (TIME.test(m[1]) && /day$/i.test(m[1])) continue;
    push(m[1], "name", m.index ?? 0);
  }
  for (const m of text.matchAll(DET)) push(m[1], "thing", (m.index ?? 0) + m[0].length - m[1].length);
  return found.sort((a, b) => a.at - b.at);
}

/** Splits text into observations and links consecutive entities through the first content word between them. */
export function parseObservation(text: string): ParsedObservation {
  const ents = extractEntities(text);
  const polarity: 1 | -1 = NEG.test(text) ? -1 : 1;
  const time = text.match(TIME)?.[0]?.toLowerCase() ?? null;
  const relations: ParsedRelation[] = [];
  for (let i = 0; i < ents.length - 1; i++) {
    const a = ents[i], b = ents[i + 1];
    const between = text.slice(a.at + a.label.length, b.at).toLowerCase().match(/[a-z']+/g) ?? [];
    const verb = between.find((w) => !STOP.has(w) && !NEG.test(w) && w.length > 2);
    relations.push({ source: a.key, target: b.key, predicate: verb ? lemma(verb) : "related to", polarity });
  }
  return { entities: ents.map(({ at: _at, ...e }) => e), relations, timeHint: time, polarity };
}

/** Confidence from counts (Laplace-smoothed): more support raises it, contradictions lower it. */
export const relationWeight = (support: number, contradict: number) => Math.round(((support + 1) / (support + contradict + 2)) * 1000) / 1000;
export const isContradicted = (support: number, contradict: number) => support > 0 && contradict > 0;
