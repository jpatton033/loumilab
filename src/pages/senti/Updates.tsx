import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import SentiShell, { Eyebrow } from "@/components/senti/SentiShell";

export default function SentiUpdates() {
  const [rows, setRows] = useState<{ id: string; title: string; body: string; version: string | null; published_at: string | null }[] | null>(null);
  useEffect(() => { supabase.from("senti_updates").select("id,title,body,version,published_at").eq("kind", "update").eq("published", true).order("published_at", { ascending: false }).then(({ data }) => setRows(data ?? [])); }, []);
  return (
    <SentiShell>
      <SEOHead title="Updates | Senti by Loumilab" description="Senti research progress: what was built, experiment results, and the challenges that remain open." path="/senti/updates" />
      <section className="section-container max-w-3xl py-16 lg:py-24">
        <Eyebrow>Updates</Eyebrow>
        <h1 className="mt-4 font-hero text-4xl font-semibold lg:text-6xl">Research notes.</h1>
        <p className="mt-6 text-lg text-atmo-ivory/70">Real development progress: what was built, what experiments showed, and which challenges remain open. Nothing is described as working until it has been tested.</p>
        <ol className="mt-12 space-y-10 border-l border-atmo-ivory/15 pl-8">
          {rows === null ? <li className="text-atmo-ivory/50">Loading…</li> : rows.length === 0 ? <li className="text-atmo-ivory/50">No updates yet.</li> : rows.map((r) => (
            <li key={r.id} className="relative"><span className="absolute -left-[37px] top-2 h-2 w-2 rounded-full bg-atmo-ivory" aria-hidden />
              <p className="text-xs text-atmo-ivory/45">{r.published_at && new Date(r.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}{r.version && ` · ${r.version}`}</p>
              <h2 className="mt-1 font-hero text-2xl font-semibold">{r.title}</h2>
              <p className="mt-3 whitespace-pre-line text-atmo-ivory/70">{r.body}</p></li>))}
        </ol>
      </section>
    </SentiShell>
  );
}
