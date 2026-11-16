import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AgreementViewer } from "@/components/legal/AgreementViewer";
import { PRIVACY_URL, SPACES_AGREEMENT, TERMS_URL, acceptAgreement, fetchCurrentAgreement, flushPendingAcceptance, needsAgreement, type AgreementVersion } from "@/lib/legal/agreements";

/** One-time prompt shown only when a published, effective version still needs this user's acceptance. */
export function SpacesAgreementPrompt({ workspaceId }: { workspaceId?: string | null }) {
  const [doc, setDoc] = useState<AgreementVersion | null>(null);
  const [needed, setNeeded] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const check = useCallback(async () => {
    try {
      await flushPendingAcceptance();
      const n = await needsAgreement();
      setNeeded(n);
      if (n) setDoc(await fetchCurrentAgreement());
    } catch { setNeeded(false); }
  }, []);
  useEffect(() => { check(); }, [check]);
  if (!needed || !doc) return null;
  const accept = async () => {
    setBusy(true);
    try { await acceptAgreement(doc, "acceptance_prompt", workspaceId); toast.success("Agreement accepted."); setOpen(false); await check(); }
    catch (e) { toast.error((e as Error).message); await check(); }
    finally { setBusy(false); }
  };
  return (
    <div role="region" aria-label="Agreement required" className="mb-8 flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center">
      <ShieldCheck className="shrink-0 text-dot" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">Review the Spaces Hosting &amp; Acceptable Use Agreement</p>
        <p className="mt-1 text-muted-foreground">Your apps stay as they are. Deploying, restoring, and putting apps on the web need your acceptance of version {doc.version}.</p>
      </div>
      <Button onClick={() => setOpen(true)}>Review and accept</Button>
      <AgreementViewer doc={doc} open={open} onOpenChange={setOpen} footer={
        <>
          <p className="mr-auto self-center text-xs text-muted-foreground">Also see the <a className="underline" href={TERMS_URL} target="_blank" rel="noreferrer">Terms of Service</a> and <a className="underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
          <Button variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
          <Button onClick={accept} disabled={busy}>{busy ? "Saving…" : "I agree"}</Button>
        </>
      } />
    </div>
  );
}

type Accepted = { version_id: string; version: string; content: string; content_hash: string; effective_date: string | null; accepted_at: string; method: string };

/** Spaces Account Settings → Legal & Agreements. */
export function SpacesAccountLegal() {
  const [current, setCurrent] = useState<AgreementVersion | null | undefined>(undefined);
  const [mine, setMine] = useState<Accepted[]>([]);
  const [view, setView] = useState<{ title: string; version: string; content: string; effective_date: string | null; content_hash?: string } | null>(null);
  useEffect(() => {
    fetchCurrentAgreement().then(setCurrent).catch(() => setCurrent(null));
    supabase.rpc("legal_my_acceptances", { _slug: SPACES_AGREEMENT }).then(({ data }) => setMine((data as Accepted[]) ?? []));
  }, []);
  const title = "Loumilab Spaces Hosting & Acceptable Use Agreement";
  return (
    <section className="max-w-3xl">
      <h1 className="font-hero text-3xl font-semibold text-foreground">Account settings<span className="text-foreground">.</span></h1>
      <h2 className="mt-8 font-hero text-xl font-semibold text-foreground">Legal &amp; Agreements</h2>
      <div className="mt-4 rounded-3xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">Current agreement</p>
        {current === undefined ? <p className="mt-2 text-sm text-muted-foreground">Loading…</p> : current ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{title} · Version {current.version} · Effective {current.effective_date}</span>
            <Button size="sm" variant="outline" onClick={() => setView(current)}><FileText size={14} /> Read</Button>
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">No Spaces agreement is in effect yet.</p>}
        <p className="mt-4 text-sm text-muted-foreground">Also: <a className="underline" href={TERMS_URL}>Terms of Service</a> · <a className="underline" href={PRIVACY_URL}>Privacy Policy</a></p>
      </div>
      <div className="mt-4 rounded-3xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">Versions you accepted</p>
        {mine.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">None yet.</p> : (
          <ul className="mt-2 divide-y divide-border">
            {mine.map((a) => (
              <li key={a.version_id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="text-foreground">Version {a.version}</span>
                <span className="text-muted-foreground">Accepted {new Date(a.accepted_at).toLocaleString()} · {a.method === "signup_checkbox" ? "at sign-up" : "in Spaces"}</span>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setView({ title, version: a.version, content: a.content, effective_date: a.effective_date, content_hash: a.content_hash })}>Read</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AgreementViewer doc={view} open={!!view} onOpenChange={(o) => !o && setView(null)} />
    </section>
  );
}
