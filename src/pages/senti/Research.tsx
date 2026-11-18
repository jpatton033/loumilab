import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import SentiShell, { Eyebrow } from "@/components/senti/SentiShell";

const works = ["Recording text observations in private, expiring sessions", "Finding names and things mentioned, and linking them through the verb between them", "Time hints (e.g. “every morning”, “Sunday”) and observation order", "Confidence scores from counts of supporting and contradicting observations", "Contradiction flags, user corrections and a revision history", "Evidence lookup: every link points back to the observations behind it"];
const experimental = ["Trained or learned models of any kind", "Behavioral prediction", "Images, audio or other sensory input", "Long-range reasoning across many sessions", "Benchmarks against language-model baselines", "A dedicated Python research service"];
const layers = [
  ["1 · Input", "Text only today, validated and length-limited."],
  ["2 · Context & relationships", "Entity extraction, relationship representation, event sequencing, temporal hints, evidence links, contradiction detection."],
  ["3 · Persistent memory", "Observations, entities, relationships, corrections and session history in a relational database."],
  ["4 · Learning & adaptation", "Today: smoothed counting scores updated by new evidence and feedback. Trained models will be described only once they exist and are evaluated."],
  ["5 · Inference", "Deterministic evidence retrieval and relationship queries. Generative AI is not called."],
  ["6 · Evaluation", "Versioned engine (senti-rules-0.1), automated rule tests, recorded engine errors for failure review."],
];

export default function SentiResearch() {
  const [docs, setDocs] = useState<{ id: string; title: string; body: string; published_at: string | null }[]>([]);
  useEffect(() => { supabase.from("senti_updates").select("id,title,body,published_at").eq("kind", "document").eq("published", true).order("published_at", { ascending: false }).then(({ data }) => setDocs(data ?? [])); }, []);
  return (
    <SentiShell>
      <SEOHead title="Research | Senti by Loumilab" description="Senti's methodology, architecture, what works today, what remains experimental, and how claims will be evaluated." path="/senti/research" />
      <section className="section-container max-w-4xl py-16 lg:py-24">
        <Eyebrow>Research</Eyebrow>
        <h1 className="mt-4 font-hero text-4xl font-semibold lg:text-6xl">Methodology, in plain terms.</h1>
        <p className="mt-6 text-lg leading-relaxed text-atmo-ivory/70">Senti is built in layers, each independently testable. We state what works, what is experimental and how each claim will be checked. Capabilities are described only after they have been implemented and tested.</p>

        <h2 className="mt-16 font-hero text-3xl font-semibold">Architecture.</h2>
        <dl className="mt-6 divide-y divide-atmo-ivory/10 border-y border-atmo-ivory/10">{layers.map(([t, d]) => <div key={t} className="grid gap-2 py-5 sm:grid-cols-3"><dt className="font-semibold">{t}</dt><dd className="text-atmo-ivory/65 sm:col-span-2">{d}</dd></div>)}</dl>

        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          <div><h2 className="font-hero text-2xl font-semibold">Works today.</h2><ul className="mt-4 space-y-2 text-atmo-ivory/70">{works.map((w) => <li key={w}>— {w}</li>)}</ul></div>
          <div><h2 className="font-hero text-2xl font-semibold">Not built yet.</h2><ul className="mt-4 space-y-2 text-atmo-ivory/70">{experimental.map((w) => <li key={w}>— {w}</li>)}</ul></div>
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
