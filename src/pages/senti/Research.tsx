import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import SentiShell, { Eyebrow } from "@/components/senti/SentiShell";
import SentiStatus from "@/components/senti/SentiStatus";

const topics = [
  ["Relational memory", "Senti keeps what it learns as connected records of people, things, events and relationships. Each new source adds to that memory, and nothing is silently overwritten."],
  ["Contextual interpretation", "Meaning depends on who wrote something, when, where and why. Senti separates what a source documents from what is only a possible interpretation, and says when evidence is missing."],
  ["Sentiment", "Instead of a single positive or negative label, the research asks how emotion and attitude relate to circumstances such as loss, social conditions or history. Today Senti only flags positive and negative wording."],
  ["Learning", "Today learning means evidence counting: links grow stronger or weaker as sources support or challenge them. Trained learning algorithms remain a research goal."],
  ["Evidence revision", "New sources can support, challenge or replace earlier links. Every earlier version is kept, so you can see how an interpretation changed and why."],
  ["Computational efficiency", "Reusing structured knowledge, instead of recomputing everything for each question, may make contextual systems cheaper and faster. This is being measured, not assumed."],
];
const works = ["Recording text observations in private, expiring sessions", "Finding names and things mentioned, and linking them through the verb between them", "Time hints (e.g. “every morning”, “Sunday”) and observation order", "Confidence scores from counts of supporting and contradicting observations", "Contradiction flags, user corrections and a revision history", "Evidence lookup: every link points back to the observations behind it", "Senti Core v0.1: structured events, stable entities, relationships labelled as recorded fact, inferred or hypothesis", "Versioned relationships: new evidence supports, contradicts or supersedes earlier links without erasing them", "Retrieval by entity, event or time range", "Reproducible rules-only and structured-memory evaluations on synthetic datasets"];
const experimental = ["Deeper interpretation: themes, tone, symbolism and alternative readings", "Finding patterns on its own, without rules written in advance", "Trained or learned models of any kind", "Broader context drawn from outside sources", "Behavioral prediction", "Images, audio or other sensory input", "Long-range reasoning across many sessions", "Benchmarks against trained-model and language-model baselines", "A dedicated Python research service"];
const layers = [
  ["1 · Input", "Text only today, validated and length-limited."],
  ["2 · Context & relationships", "Entity extraction, relationship representation, event sequencing, temporal hints, evidence links, contradiction detection."],
  ["3 · Persistent memory", "Observations, entities, relationships, corrections and session history in a relational database."],
  ["4 · Learning & adaptation", "Today: smoothed counting scores updated by new evidence and feedback. Trained models will be described only once they exist and are evaluated."],
  ["5 · Inference", "Deterministic evidence retrieval and relationship queries. Generative AI is not called."],
  ["6 · Evaluation", "Versioned engines (senti-rules-0.1, senti-core-0.1), automated tests, reproducible evaluation runs tied to engine and dataset versions, and recorded engine errors for failure review."],
];

export default function SentiResearch() {
  const [docs, setDocs] = useState<{ id: string; title: string; body: string; published_at: string | null }[]>([]);
  useEffect(() => { supabase.from("senti_updates").select("id,title,body,published_at").eq("kind", "document").eq("published", true).order("published_at", { ascending: false }).then(({ data }) => setDocs(data ?? [])); }, []);
  return (
    <SentiShell>
      <SEOHead title="Research | Senti by Loumilab" description="How Senti approaches relational memory, contextual interpretation, sentiment, learning and evidence revision: what works today and what remains research." path="/senti/research" />
      <section className="section-container max-w-4xl py-16 lg:py-24">
        <Eyebrow>Research</Eyebrow>
        <h1 className="mt-4 font-hero text-4xl font-semibold lg:text-6xl">Methodology, in plain terms.</h1>
        <p className="mt-6 text-lg leading-relaxed text-atmo-ivory/70">Senti investigates how software can identify, connect and retain relationships among language, sentiment, history and experience, and revise them as evidence arrives. Today's foundation is structured observation processing, relational memory, evidence tracking and experiment tooling. Everything beyond that is labeled as research, and capabilities are described only after they have been built and tested.</p>

        <div className="mt-12"><SentiStatus /></div>

        <h2 className="mt-16 font-hero text-3xl font-semibold">The research areas.</h2>
        <dl className="mt-6 divide-y divide-atmo-ivory/10 border-y border-atmo-ivory/10">{topics.map(([t, d]) => <div key={t} className="grid gap-2 py-5 sm:grid-cols-3"><dt className="font-semibold">{t}</dt><dd className="text-atmo-ivory/65 sm:col-span-2">{d}</dd></div>)}</dl>

        <h2 className="mt-16 font-hero text-3xl font-semibold">Architecture.</h2>
        <dl className="mt-6 divide-y divide-atmo-ivory/10 border-y border-atmo-ivory/10">{layers.map(([t, d]) => <div key={t} className="grid gap-2 py-5 sm:grid-cols-3"><dt className="font-semibold">{t}</dt><dd className="text-atmo-ivory/65 sm:col-span-2">{d}</dd></div>)}</dl>

        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          <div><h2 className="font-hero text-2xl font-semibold">Works today.</h2><ul className="mt-4 space-y-2 text-atmo-ivory/70">{works.map((w) => <li key={w}>— {w}</li>)}</ul></div>
          <div><h2 className="font-hero text-2xl font-semibold">Still in research.</h2><ul className="mt-4 space-y-2 text-atmo-ivory/70">{experimental.map((w) => <li key={w}>— {w}</li>)}</ul></div>
        </div>

        <h2 className="mt-16 font-hero text-3xl font-semibold">How claims will be evaluated.</h2>
        <p className="mt-4 text-atmo-ivory/70">Each engine version is fixed and named. Changes are compared on the same recorded scenarios: how often relationships are extracted correctly, how corrections change later results, and how answers compare with a language-model baseline in accuracy, cost and speed. Results will be published here with their method, including failures.</p>

        <h2 className="mt-16 font-hero text-3xl font-semibold">Data and privacy.</h2>
        <p className="mt-4 text-atmo-ivory/70">Lab sessions are anonymous, expire after 30 days and can be deleted by the visitor at any time. Text is used for evaluation only when the visitor opts in. The Lab is not connected to Loumilab Orders or any customer data.</p>

        {docs.length > 0 && <><h2 className="mt-16 font-hero text-3xl font-semibold">Technical documents.</h2>
          <div className="mt-6 space-y-8">{docs.map((d) => <article key={d.id} className="border-t border-atmo-ivory/10 pt-6"><h3 className="text-xl font-semibold">{d.title}</h3><p className="mt-1 text-xs text-atmo-ivory/45">{d.published_at && new Date(d.published_at).toLocaleDateString()}</p><p className="mt-3 whitespace-pre-line text-atmo-ivory/70">{d.body}</p></article>)}</div></>}
      </section>
    </SentiShell>
  );
}
