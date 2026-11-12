import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { spacesApi } from "@/lib/spaces/client";

/**
 * Runs a Spaces app on a Loumilab address WITHOUT giving its code the loumilab.com origin:
 * the entry HTML is fetched from the isolated file host and rendered in a sandboxed
 * srcdoc frame (no allow-same-origin), so it can't read Loumilab sign-ins or storage.
 */
export default function SpacesRun() {
  const { slug = "" } = useParams();
  const [doc, setDoc] = useState<string | null>(null);
  const [name, setName] = useState("App");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await spacesApi<{ name: string; base: string; entry: string; error?: string }>({ action: "open", slug });
        if (!r.base) throw new Error(r.error ?? "Unavailable");
        setName(r.name);
        const html = await fetch(r.base + r.entry).then((x) => { if (!x.ok) throw new Error("Could not load the app."); return x.text(); });
        const baseTag = `<base href="${r.base}">`;
        setDoc(/<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`) : baseTag + html);
      } catch (e) { setErr((e as Error).message); }
    })();
  }, [slug]);
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <SEOHead title={`${name} | Loumilab Spaces`} description="An app hosted on Loumilab Spaces." path={`/spaces/a/${slug}`} noindex />
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4 text-xs text-muted-foreground">
        <Link to="/spaces" className="font-medium text-foreground">Loumilab Spaces</Link>
        <span className="truncate px-3">{name}</span>
        <Link to="/spaces/app" className="hover:text-foreground">Dashboard</Link>
      </div>
      {err ? (
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div><p className="font-hero text-3xl font-semibold text-foreground">This app isn't available.</p><p className="mt-3 text-muted-foreground">{err} If it's private, <Link className="underline" to={`/sign-in?next=/spaces/a/${slug}`}>sign in</Link> with an account that has access.</p></div>
        </div>
      ) : doc ? (
        <iframe title={name} srcDoc={doc} sandbox="allow-scripts allow-forms allow-popups allow-modals" referrerPolicy="no-referrer" className="w-full flex-1 border-0 bg-white" />
      ) : <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Loading…</div>}
    </div>
  );
}
