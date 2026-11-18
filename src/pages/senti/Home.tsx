import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { supabase } from "@/integrations/supabase/client";
import SentiShell, { Eyebrow } from "@/components/senti/SentiShell";
import { SentiHeroFilm } from "@/components/senti/SentiHeroFilm";
import SentiStatus from "@/components/senti/SentiStatus";

const btn = "inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const foundations = [
  ["Language and meaning", "How systems identify and represent relationships within language."],
  ["Observational learning", "Learning from recorded events, their order and their context."],
  ["Behavioral intelligence", "Relationships among actions, reactions and outcomes."],
  ["Relational memory", "Retaining, retrieving and revising contextual knowledge over time."],
  ["Learning and adaptation", "Updating what is known as new evidence and corrections arrive."],
  ["Computational efficiency", "Reusing structured knowledge instead of repeating costly inference."],
];
const uses: [string, string, string][] = [
  ["Adaptive software", "Applications that improve interactions based on recorded behavior and changing context.", "Conceptual"],
  ["Intelligent workflow systems", "Systems that recognize recurring operational patterns and suggest improvements.", "Conceptual"],
  ["Contextual assistants", "Assistants that preserve relevant relationships across interactions and make fewer unsupported assumptions.", "Experimental"],
  ["Human-computer interaction", "Software that interprets sequences of user actions instead of treating each interaction independently.", "Conceptual"],
  ["Observational systems", "Applications that identify patterns in recorded events or operational activities.", "Experimental"],
  ["Efficient AI infrastructure", "Reducing repeated inference by reusing structured knowledge.", "Demonstrated in the Lab"],
];
const method = [["Observe", "Record what happened, when and who was involved."], ["Represent", "Turn it into entities, events and attributes."], ["Connect", "Link them as relationships with evidence."], ["Retrieve", "Find what is known about an entity or time range."], ["Infer", "Propose relationships, labelled as inferred or hypothesis."], ["Evaluate", "Measure against baselines on fixed datasets."], ["Revise", "Update with new evidence, keeping every earlier version."]];
const layers = [
  ["Input", "Text observations today. Other inputs are future research."],
  ["Context & relationships", "Entities, links, time order, evidence, contradictions."],
  ["Persistent memory", "Observations, relationships, corrections and history."],
  ["Learning & adaptation", "Counting-based scores today; trained models are future work."],
  ["Inference", "Evidence lookup and relationship queries."],
  ["Evaluation", "Versioned engine, recorded tests and failure review."],
];

const Inquiry = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255), company: z.string().trim().max(120).optional(), message: z.string().trim().min(10).max(2000) });

function InquiryForm() {
  const [f, setF] = useState({ name: "", email: "", company: "", interest: "Investment", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = Inquiry.safeParse(f);
    if (!r.success) return toast.error(r.error.errors[0].message);
    setBusy(true);
    const { error } = await supabase.from("contact_submissions").insert({ name: r.data.name, email: r.data.email, company: r.data.company || null, service: `Senti — ${f.interest}`, message: r.data.message });
    setBusy(false);
    if (error) return toast.error("Something went wrong. Please email hello@loumilab.com.");
    setSent(true);
    supabase.functions.invoke("send-contact-email", { body: { email: r.data.email } }).catch(() => {});
  };
  if (sent) return <p className="text-lg text-atmo-ivory">Thank you. We'll be in touch.</p>;
  const inp = "w-full rounded-2xl border border-atmo-ivory/15 bg-atmo-charcoal/60 px-4 py-3 text-atmo-ivory placeholder:text-atmo-ivory/40 outline-none focus:border-atmo-ivory/50";
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-atmo-ivory/70">Name<input className={`${inp} mt-1`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} required /></label>
      <label className="text-sm text-atmo-ivory/70">Email<input type="email" className={`${inp} mt-1`} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} required /></label>
      <label className="text-sm text-atmo-ivory/70">Organization (optional)<input className={`${inp} mt-1`} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} maxLength={120} /></label>
      <label className="text-sm text-atmo-ivory/70">Interest<select className={`${inp} mt-1`} value={f.interest} onChange={(e) => setF({ ...f, interest: e.target.value })}>{["Investment", "Technical collaboration", "Research partnership", "Other"].map((o) => <option key={o}>{o}</option>)}</select></label>
      <label className="text-sm text-atmo-ivory/70 sm:col-span-2">Message<textarea rows={4} className={`${inp} mt-1`} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={2000} required /></label>
      <button disabled={busy} className={`${btn} bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85 sm:w-fit`}>{busy ? "Sending…" : "Send inquiry"}</button>
    </form>
  );
}

export default function SentiHome() {
  return (
    <SentiShell nav={false}>
      <SEOHead title="Senti by Loumilab | Experimental Research Initiative" description="Senti is a Loumilab research initiative exploring how computational systems learn relationships among language, observations, behavior, and experience." path="/senti" />
      <section data-page-hero className="relative isolate -mt-16 overflow-hidden lg:-mt-20" aria-label="Introduction">
        <SentiHeroFilm />
        <div className="section-container flex min-h-[100svh] flex-col justify-end pb-16 pt-32 text-center items-center sm:pb-20 [@media(min-aspect-ratio:4/5)]:items-start [@media(min-aspect-ratio:4/5)]:justify-center [@media(min-aspect-ratio:4/5)]:text-left">
          <Eyebrow>Experimental Research Initiative — Loumilab</Eyebrow>
          <h1 className="mt-6 max-w-2xl animate-fade-in font-hero text-5xl font-semibold leading-[1.0] tracking-tight text-atmo-ivory sm:text-6xl lg:text-7xl">Intelligence begins with understanding.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-atmo-ivory/75 sm:text-xl">Exploring how computational systems learn from language, observation, behavior, and experience.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/senti/lab" className={`${btn} bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85`}>Explore Senti Lab</Link>
            <Link to="/senti/research" className={`${btn} border border-atmo-ivory/30 text-atmo-ivory hover:bg-atmo-ivory/10`}>Discover the Research</Link>
          </div>
        </div>
      </section>

      <section className="section-container py-24 lg:py-32">
        <Reveal className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5"><Eyebrow>Introducing Senti</Eyebrow><h2 className="mt-4 font-hero text-4xl font-semibold leading-tight lg:text-5xl">Not another chatbot.</h2></div>
          <div className="space-y-5 text-lg leading-relaxed text-atmo-ivory/70 lg:col-span-6 lg:col-start-7">
            <p>Senti is a computational learning research initiative by Loumilab, exploring how intelligent systems can develop and refine relationships among language, observations, behavior, and experience. Through persistent memory, contextual reasoning, and experimental learning architectures, Senti investigates how software can become more adaptive, efficient, and capable of using accumulated knowledge.</p>
            <p>Most AI products send every question to a large language model and pay for each answer. Senti explores a different direction: keeping structured memory of what was observed, how things relate, and how those relationships change.</p>
            <p>Senti is an active research and development initiative. Today it runs Senti Core v0.1, a relational memory and event engine, and a rule-based sentence reader. Neither is a trained model, and Senti does not claim general intelligence, consciousness or human-like understanding.</p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-atmo-ivory/10 py-24 lg:py-32">
        <Reveal className="section-container max-w-4xl text-center">
          <Eyebrow>The research question</Eyebrow>
          <p className="mt-6 font-hero text-3xl font-semibold leading-snug text-atmo-ivory sm:text-4xl lg:text-5xl">Can computational systems develop, retain, and revise useful relationships among language, observed events, and behavior while substantially reducing dependence on repeated generative AI inference?</p>
        </Reveal>
      </section>

      <section className="section-container py-24 lg:py-32" aria-labelledby="foundations">
        <Eyebrow>Six research disciplines</Eyebrow>
        <h2 id="foundations" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">What Senti studies.</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-atmo-ivory/10 bg-atmo-ivory/10 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map(([t, d], i) => (
            <li key={t} className="bg-atmo-obsidian p-8 transition-colors hover:bg-atmo-charcoal/60">
              <span className="font-mono text-xs text-atmo-ivory/45">0{i + 1}</span>
              <p className="mt-3 font-hero text-2xl font-semibold">{t}.</p>
              <p className="mt-2 text-atmo-ivory/65">{d}</p>
            </li>))}
        </ol>
      </section>

      <section className="section-container pb-24 lg:pb-32" aria-labelledby="method">
        <Eyebrow>How Senti research works</Eyebrow>
        <h2 id="method" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Observe. Connect. Revise.</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-atmo-ivory/10 bg-atmo-ivory/10 sm:grid-cols-2 lg:grid-cols-7">
          {method.map(([t, d], i) => <li key={t} className="bg-atmo-obsidian p-6"><span className="font-mono text-xs text-atmo-ivory/45">0{i + 1}</span><p className="mt-2 font-semibold">{t}</p><p className="mt-1 text-sm text-atmo-ivory/60">{d}</p></li>)}
        </ol>
      </section>

      <section className="section-container pb-24 lg:pb-32" aria-labelledby="how">
        <Eyebrow>How Senti works</Eyebrow>
        <h2 id="how" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Six layers, built in order.</h2>
        <div className="mt-12 space-y-2">
          {layers.map(([t, d], i) => (
            <div key={t} className="grid items-center gap-2 rounded-2xl border border-atmo-ivory/10 px-6 py-5 sm:grid-cols-12" style={{ marginLeft: `${i * 2}%` }}>
              <span className="font-mono text-xs text-atmo-ivory/45 sm:col-span-1">L{i + 1}</span>
              <span className="font-semibold sm:col-span-4">{t}</span>
              <span className="text-sm text-atmo-ivory/60 sm:col-span-7">{d}</span>
            </div>))}
        </div>
      </section>

      <section className="section-container pb-24 lg:pb-32" aria-labelledby="uses">
        <Eyebrow>Potential uses</Eyebrow>
        <h2 id="uses" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">What could understanding make possible?</h2>
        <p className="mt-4 max-w-2xl text-atmo-ivory/65">Possible future directions, not products available today. Each is labelled with how far it has actually been taken.</p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map(([t, d, st]) => <li key={t} className="rounded-3xl border border-atmo-ivory/10 p-6"><span className="rounded-full border border-atmo-ivory/20 px-2.5 py-0.5 text-[11px] text-atmo-ivory/60">{st}</span><p className="mt-4 font-semibold">{t}</p><p className="mt-2 text-sm text-atmo-ivory/60">{d}</p></li>)}
        </ul>
      </section>

      <div className="section-container pb-24 lg:pb-32"><SentiStatus /></div>

      <section className="border-t border-atmo-ivory/10 py-24 lg:py-32">
        <div className="section-container grid items-center gap-10 lg:grid-cols-2">
          <div><Eyebrow>Interactive research lab</Eyebrow><h2 className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Watch relationships form.</h2>
            <p className="mt-5 text-lg text-atmo-ivory/70">Type a few observations. See what Senti links, what it remembers, and how a correction changes it, with every step backed by recorded evidence.</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/senti/lab" className={`${btn} bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85`}>Open the Lab</Link>
            <Link to="/senti/research" className={`${btn} border border-atmo-ivory/30 hover:bg-atmo-ivory/10`}>Methodology</Link>
            <Link to="/senti/updates" className={`${btn} border border-atmo-ivory/30 hover:bg-atmo-ivory/10`}>Updates</Link>
          </div>
        </div>
      </section>

      <section id="inquiries" className="section-container scroll-mt-24 border-t border-atmo-ivory/10 py-24 lg:py-32" aria-labelledby="inq">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><Eyebrow>Research & investment</Eyebrow><h2 id="inq" className="mt-4 font-hero text-4xl font-semibold">Talk with us.</h2><p className="mt-4 text-atmo-ivory/65">For investors, technical collaborators and research partners.</p></div>
          <div className="lg:col-span-7 lg:col-start-6"><InquiryForm /></div>
        </div>
      </section>
    </SentiShell>
  );
}
