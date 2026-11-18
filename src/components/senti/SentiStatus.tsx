import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow } from "./SentiShell";

type Status = { engines: { id: string; kind: string; description: string; status: string; released_at: string | null }[]; milestones: { title: string; description: string; status: string }[]; evaluations: { category: string; baseline: string; metric: string; value: number; n: number; engine_version: string; created_at: string }[]; models_operational: number; last_verified: string | null };

const OBJECTIVE = "Determine whether software can build, retain and revise useful relationships among language, observations, behavior and experience while reducing dependence on repeated generative AI inference.";
const LIMITS = ["Reads simple English sentences with rules, not a language model.", "No trained model exists yet.", "Evaluations so far use small synthetic datasets written by Loumilab.", "Runs on Loumilab's current backend; the independent Python service is not deployed."];
const INVESTIGATING = ["Reproducible rules-only vs. structured-memory baselines", "Contradiction handling across observations", "Temporal reasoning over event order"];

/** Public research status: reads only published/public items through the senti_public_status RPC. */
export default function SentiStatus() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => { supabase.rpc("senti_public_status").then(({ data }) => setS(data as unknown as Status)); }, []);
  const operational = s?.engines.filter((e) => e.status === "operational") ?? [];
  return (
    <section aria-labelledby="status" className="rounded-3xl border border-atmo-ivory/10 bg-atmo-charcoal/30 p-6 sm:p-10">
      <Eyebrow>Research status</Eyebrow>
      <h2 id="status" className="mt-3 font-hero text-3xl font-semibold lg:text-4xl">Where Senti stands.</h2>
      <p className="mt-4 max-w-3xl text-atmo-ivory/70">{OBJECTIVE}</p>
      {!s ? <p className="mt-6 text-sm text-atmo-ivory/45">Loading…</p> : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div><h3 className="font-semibold">Current version</h3>
            <ul className="mt-3 space-y-2 text-sm text-atmo-ivory/70">{operational.map((e) => <li key={e.id}><span className="font-mono text-xs text-atmo-ivory">{e.id}</span> — {e.description}</li>)}</ul>
            <p className="mt-3 text-sm text-atmo-ivory/55">Trained models: {s.models_operational ? s.models_operational : "none yet"}.</p></div>
          <div><h3 className="font-semibold">Active investigations</h3><ul className="mt-3 space-y-1.5 text-sm text-atmo-ivory/70">{INVESTIGATING.map((x) => <li key={x}>— {x}</li>)}</ul>
            <h3 className="mt-6 font-semibold">Known limitations</h3><ul className="mt-3 space-y-1.5 text-sm text-atmo-ivory/70">{LIMITS.map((x) => <li key={x}>— {x}</li>)}</ul></div>
          <div><h3 className="font-semibold">Milestones</h3><ul className="mt-3 space-y-2 text-sm">{s.milestones.map((m) => <li key={m.title} className="flex items-start justify-between gap-3"><span className="text-atmo-ivory/75">{m.title}</span><span className="shrink-0 rounded-full border border-atmo-ivory/20 px-2 py-0.5 text-[11px] capitalize text-atmo-ivory/60">{m.status === "done" ? "Done" : m.status === "active" ? "In progress" : "Planned"}</span></li>)}</ul></div>
          <div className="lg:col-span-3"><h3 className="font-semibold">Evaluation status</h3>
            {s.evaluations.length ? <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{s.evaluations.map((e, i) => <li key={i} className="rounded-2xl border border-atmo-ivory/10 px-4 py-3"><span className="text-atmo-ivory/60">{e.category} · {e.baseline === "rules" ? "rules only" : e.baseline === "memory" ? "structured memory" : e.baseline}</span><br /><span className="font-mono">{e.metric} {e.value}</span> <span className="text-xs text-atmo-ivory/45">n={e.n} · {e.engine_version}</span></li>)}</ul>
              : <p className="mt-3 text-sm text-atmo-ivory/55">Not yet evaluated publicly. Results appear here only after a reproducible run is reviewed and published.</p>}
            <p className="mt-4 text-xs text-atmo-ivory/45">Last verified update: {s.last_verified ? new Date(s.last_verified).toLocaleDateString(undefined, { dateStyle: "long" }) : "not yet"}.</p></div>
        </div>
      )}
    </section>
  );
}
