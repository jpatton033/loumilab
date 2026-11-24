import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudioShell, { Empty } from "@/components/senti/studio/StudioShell";
import SourceInput from "@/components/senti/explore/SourceInput";
import { useResearcher, fmtDate } from "@/lib/senti/studio";

export default function Explore() {
  const nav = useNavigate();
  const { access } = useResearcher();
  const [recent, setRecent] = useState<{ id: string; title: string; updated_at: string }[] | null>(null);
  useEffect(() => {
    if (access !== "ok") return;
    supabase.from("senti_explorations").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(6).then(({ data }) => setRecent(data ?? []));
  }, [access]);
  return (
    <StudioShell title="Explore" hideTitle>
      <div className="mx-auto max-w-3xl pt-6 sm:pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-atmo-copper">Senti · Explore</p>
        <h1 className="mt-3 font-hero text-4xl font-semibold leading-tight sm:text-5xl">What would you like to explore?</h1>
        <p className="mt-4 max-w-2xl text-lg text-atmo-ivory/70">Explore language, ideas, history, and human expression. Discover relationships, examine context, and see how understanding evolves.</p>
        <div className="mt-8"><SourceInput onDone={(id) => nav(`/senti/studio/x/${id}`)} /></div>
        <p className="mt-3 text-xs text-atmo-ivory/45">Senti reads with transparent rules and saves what it finds. It doesn't train a new model on each upload, and it doesn't use outside AI services.</p>

        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between"><h2 className="font-hero text-xl font-semibold">Continue exploring</h2><Link to="/senti/studio/library" className="text-sm text-atmo-ivory/60 hover:text-atmo-ivory">Library →</Link></div>
          {recent === null ? <Empty>Loading…</Empty> : recent.length === 0 ? <Empty>Your explorations will appear here.</Empty> : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {recent.map((r) => <li key={r.id}><Link to={`/senti/studio/x/${r.id}`} className="block rounded-2xl border border-atmo-ivory/10 bg-atmo-charcoal/40 p-4 transition hover:border-atmo-copper/40">
                <p className="font-medium">{r.title}</p><p className="mt-1 text-xs text-atmo-ivory/45">Updated {fmtDate(r.updated_at)}</p></Link></li>)}
            </ul>)}
        </section>
      </div>
    </StudioShell>
  );
}
