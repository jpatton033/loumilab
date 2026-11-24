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
  ["Meaning beyond the words", "What a poem, letter or speech says, and the themes, perspectives and ideas that may sit underneath it."],
  ["Sentiment in context", "How emotions, attitudes and motivations show up in language, and how their meaning shifts with circumstance. More than positive, negative or neutral."],
  ["History and circumstance", "Who created something, when and where, what surrounded it, and why certain ideas may have been expressed."],
  ["Contextual relationships", "How people, events, works and experiences connect, including the evidence that supports or conflicts."],
  ["Relational memory", "Keeping what has been learned, so each new source builds on the last instead of starting over."],
  ["Adaptive computational learning", "Revising interpretations as evidence arrives, and reusing structured knowledge instead of repeating costly computation."],
];
const uses: [string, string, string][] = [
  ["Adaptive software", "Applications that improve interactions based on recorded behavior and changing context.", "Conceptual"],
  ["Intelligent workflow systems", "Systems that recognize recurring operational patterns and suggest improvements.", "Conceptual"],
  ["Contextual assistants", "Assistants that preserve relevant relationships across interactions and make fewer unsupported assumptions.", "Experimental"],
  ["Human-computer interaction", "Software that interprets sequences of user actions instead of treating each interaction independently.", "Conceptual"],
  ["Observational systems", "Applications that identify patterns in recorded events or operational activities.", "Experimental"],
  ["Efficient AI infrastructure", "Reducing repeated inference by reusing structured knowledge.", "Demonstrated in the Lab"],
];
const method = [["Introduce", "Add a poem, a letter, an essay, a conversation or an observation."], ["Explore", "See the key passages, people, things and ideas, and the wording behind them."], ["Connect", "See how items relate, with the sentences that support or challenge each link."], ["Expand", "Add more material, such as a letter from the same writer or notes about the period."], ["Revise", "Watch interpretations change as evidence accumulates. Earlier versions are kept, not erased."]];
const layers = [
  ["Input", "Working today: text and written observations. Images, audio and other information are a research goal."],
  ["Context & relationships", "Working today: people and things, links, time order, evidence and conflicts. Deeper interpretation is a research goal."],
  ["Persistent memory", "Working today: observations, relationships, corrections and full history are kept."],
  ["Learning & adaptation", "Working today: evidence-counting scores. Trained learning algorithms are a research goal."],
  ["Inference", "Working today: evidence lookup and relationship questions. Independent pattern discovery is a research goal."],
  ["Evaluation", "Working today: versioned engines, recorded tests and review of failures."],
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
      <SEOHead title="Senti by Loumilab | Experimental Research Initiative" description="Senti is a Loumilab research initiative investigating meaning, sentiment, contextual relationships, relational memory and adaptive computational learning." path="/senti" />
      <section data-page-hero className="relative isolate -mt-16 overflow-hidden lg:-mt-20" aria-label="Introduction">
        <SentiHeroFilm />
        <div className="section-container flex min-h-[100svh] flex-col justify-end pb-16 pt-32 text-center items-center sm:pb-20 [@media(min-aspect-ratio:4/5)]:items-start [@media(min-aspect-ratio:4/5)]:justify-center [@media(min-aspect-ratio:4/5)]:text-left">
          <Eyebrow>Experimental Research Initiative — Loumilab</Eyebrow>
          <h1 className="mt-6 max-w-2xl animate-fade-in font-hero text-5xl font-semibold leading-[1.0] tracking-tight text-atmo-ivory sm:text-6xl lg:text-7xl">Intelligence begins with understanding.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-atmo-ivory/75 sm:text-xl">A Loumilab research initiative studying how software can connect meaning, sentiment, history and human experience.</p>
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
            <p>Most software treats every request as a separate event: a question goes in, an answer comes out, and nothing is learned about how ideas, people and events relate.</p>
            <p>Senti is a computational learning research initiative by Loumilab. It investigates how software can identify, interpret, connect and retain relationships among language, sentiment, history, behavior and experience, and refine those interpretations as new evidence arrives.</p>
            <p>The long-term goal is technology with deeper contextual understanding, built on relational learning, persistent memory and evidence-based adaptation. It is not a chatbot, a document summarizer or a conventional sentiment tool.</p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-atmo-ivory/10 py-24 lg:py-32">
        <Reveal className="section-container max-w-4xl text-center">
          <Eyebrow>The research question</Eyebrow>
          <p className="mt-6 font-hero text-3xl font-semibold leading-snug text-atmo-ivory sm:text-4xl lg:text-5xl">Can software build a connected, lasting understanding of meaning and context, and revise it honestly as new evidence arrives, instead of starting from nothing each time?</p>
        </Reveal>
      </section>

      <section className="section-container py-24 lg:py-32" aria-labelledby="foundations">
        <Eyebrow>Six areas of research</Eyebrow>
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
        <Eyebrow>How exploring works</Eyebrow>
        <h2 id="method" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Observe. Connect. Revise.</h2>
        <p className="mt-4 max-w-2xl text-atmo-ivory/65">Start with a poem, then add a letter by the same writer, then notes about the period. Senti is designed to link the three, mark what the sources document separately from what is only interpretation, and say plainly when the evidence isn't there.</p>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-atmo-ivory/10 bg-atmo-ivory/10 sm:grid-cols-2 lg:grid-cols-5">
          {method.map(([t, d], i) => <li key={t} className="bg-atmo-obsidian p-6"><span className="font-mono text-xs text-atmo-ivory/45">0{i + 1}</span><p className="mt-2 font-semibold">{t}</p><p className="mt-1 text-sm text-atmo-ivory/60">{d}</p></li>)}
        </ol>
      </section>

      <section className="section-container pb-24 lg:pb-32" aria-labelledby="how">
        <Eyebrow>How Senti is built</Eyebrow>
        <h2 id="how" className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Six layers, built in order.</h2>
        <p className="mt-4 max-w-2xl text-atmo-ivory/65">Each layer says what works today and what remains a research goal.</p>
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
        <p className="mt-4 max-w-2xl text-atmo-ivory/65">Poetry and documents are practical starting points. The broader vision covers patterns across observations, behavior, events and experience: software that builds useful context over time. These are possible directions, not products available today, and each is labeled with how far it has been taken.</p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map(([t, d, st]) => <li key={t} className="rounded-3xl border border-atmo-ivory/10 p-6"><span className="rounded-full border border-atmo-ivory/20 px-2.5 py-0.5 text-[11px] text-atmo-ivory/60">{st}</span><p className="mt-4 font-semibold">{t}</p><p className="mt-2 text-sm text-atmo-ivory/60">{d}</p></li>)}
        </ul>
      </section>

      <div className="section-container pb-24 lg:pb-32"><SentiStatus /></div>

      <section className="border-t border-atmo-ivory/10 py-24 lg:py-32">
        <div className="section-container grid items-center gap-10 lg:grid-cols-2">
          <div><Eyebrow>Interactive research lab</Eyebrow><h2 className="mt-4 font-hero text-4xl font-semibold lg:text-5xl">Watch relationships form.</h2>
            <p className="mt-5 text-lg text-atmo-ivory/70">Today the Lab reads short pasted text with transparent rules. You can see the people and things it finds, how it links them, and how a correction changes the result. Every step points back to the sentences behind it.</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/senti/lab" className={`${btn} bg-atmo-ivory text-atmo-obsidian hover:bg-atmo-ivory/85`}>Open the Lab</Link>
            <Link to="/senti/research" className={`${btn} border border-atmo-ivory/30 hover:bg-atmo-ivory/10`}>Methodology</Link>
            <Link to="/senti/updates" className={`${btn} border border-atmo-ivory/30 hover:bg-atmo-ivory/10`}>Updates</Link>
          </div>
        </div>
      </section>

      <section id="inquiries" className="section-container scroll-mt-24 border-t border-atmo-ivory/10 py-24 lg:py-32" aria-labelledby="inq">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><Eyebrow>Research & investment</Eyebrow><h2 id="inq" className="mt-4 font-hero text-4xl font-semibold">Talk with us.</h2><p className="mt-4 text-atmo-ivory/65">For investors, technical collaborators and research partners.</p><p className="mt-4 text-sm text-atmo-ivory/45">Senti studies how emotion is expressed. It does not feel emotions and is not conscious, and it makes no claim of human-level understanding or general intelligence.</p></div>
          <div className="lg:col-span-7 lg:col-start-6"><InquiryForm /></div>
        </div>
      </section>
    </SentiShell>
  );
}
