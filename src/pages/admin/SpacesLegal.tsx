import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AgreementViewer } from "@/components/legal/AgreementViewer";
import { SPACES_AGREEMENT, agreementSections } from "@/lib/legal/agreements";
import v1Source from "@/content/legal/spaces-hosting-v1.0.md?raw";

type V = { id: string; version: string; status: string; content: string; content_hash: string; effective_date: string | null; published_at: string | null; requires_reacceptance: boolean; approval_note: string | null; created_at: string; acceptances: number };
type Overview = { versions: V[]; customers: number; pending: { user_id: string; email: string }[] };
const TITLE = "Loumilab Spaces Hosting & Acceptable Use Agreement";

export default function SpacesLegal() {
  const [data, setData] = useState<Overview | null>(null);
  const [view, setView] = useState<V | null>(null);
  const [pub, setPub] = useState<V | null>(null);
  const [form, setForm] = useState({ date: "", note: "", confirm: false });
  const [draft, setDraft] = useState<{ version: string; content: string; reaccept: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data: d, error } = await supabase.rpc("legal_admin_overview", { _slug: SPACES_AGREEMENT });
    if (error) { toast.error(error.message); return; }
    setData(d as unknown as Overview);
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (p: PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await p;
    if (error) return toast.error(error.message);
    toast.success(ok); setPub(null); setDraft(null); load();
  };
  const hasV1 = data?.versions.some((v) => v.version === "1.0");

  return (
    <AdminShell title="Spaces · Legal agreements" description="Review, version and publish the Spaces Hosting & Acceptable Use Agreement. Drafts are never shown to customers or enforced. Only super admins can publish; published versions are locked.">
      <SEOHead title="Legal agreements | Loumilab Admin" description="Spaces agreement versions." path="/admin/spaces-legal" noindex />
      {data && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Spaces customers" value={data.customers} />
          <Stat label="Need to accept current version" value={data.pending.length} />
          <Stat label="Total acceptances" value={data.versions.reduce((n, v) => n + Number(v.acceptances), 0)} />
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {data && !hasV1 && <Button onClick={() => call(supabase.rpc("legal_create_draft", { _slug: SPACES_AGREEMENT, _version: "1.0", _content: v1Source, _reaccept: true }), "Version 1.0 saved as draft")}>Load Version 1.0 draft</Button>}
        {data && hasV1 && <Button variant="outline" onClick={() => setDraft({ version: "", content: data.versions[0]?.content ?? "", reaccept: true })}>New version</Button>}
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border">
        {data === null && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {data?.versions.length === 0 && <p className="p-4 text-sm text-muted-foreground">No versions yet.</p>}
        {data?.versions.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-[220px] flex-1">
              <p className="font-medium text-foreground">Version {v.version} · <span className="capitalize">{v.status}</span></p>
              <p className="text-xs text-muted-foreground">{agreementSections(v.content).length} sections · fingerprint {v.content_hash.slice(0, 16)}… · {v.effective_date ? `effective ${v.effective_date}` : "no effective date"} · {v.acceptances} acceptances{v.requires_reacceptance ? " · requires acceptance" : ""}</p>
              {v.approval_note && <p className="text-xs text-muted-foreground">Approval: {v.approval_note}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setView(v)}>Read</Button>
            {v.status === "draft" && <Button size="sm" onClick={() => { setPub(v); setForm({ date: "", note: "", confirm: false }); }}>Approve &amp; publish</Button>}
          </div>
        ))}
      </div>
      {data && data.pending.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-medium text-foreground">Customers who need to accept</h2>
          <ul className="max-h-64 overflow-y-auto rounded-2xl border border-border p-3 text-sm text-muted-foreground">{data.pending.map((p) => <li key={p.user_id}>{p.email}</li>)}</ul>
        </div>
      )}
      <AgreementViewer doc={view ? { title: TITLE, version: view.version, content: view.content, effective_date: view.effective_date, content_hash: view.content_hash } : null} open={!!view} onOpenChange={(o) => !o && setView(null)} />
      <Dialog open={!!pub} onOpenChange={(o) => !o && setPub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Publish version {pub?.version}</DialogTitle><DialogDescription>Once published it is locked. On the effective date, new Spaces sign-ups must accept it and existing customers are asked once before deploying.</DialogDescription></DialogHeader>
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Before publishing, verify every operational statement (infrastructure, security, retention, exports, hosting) and the Effective Date line inside the text.</p>
          <div className="space-y-3">
            <div><Label htmlFor="eff">Effective date</Label><Input id="eff" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label htmlFor="note">Approval note</Label><Input id="note" placeholder="Who approved and how" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            <label className="flex items-start gap-2 text-sm"><Checkbox checked={form.confirm} onCheckedChange={(c) => setForm({ ...form, confirm: c === true })} /> I reviewed this exact text (fingerprint {pub?.content_hash.slice(0, 16)}…) and it is approved.</label>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPub(null)}>Cancel</Button>
            <Button disabled={!form.date || !form.confirm || !form.note.trim()} onClick={() => pub && call(supabase.rpc("legal_publish_version", { _version: pub.id, _effective: form.date, _hash: pub.content_hash, _note: form.note }), "Published")}>Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New draft version</DialogTitle></DialogHeader>
          {draft && <div className="space-y-3">
            <div><Label htmlFor="ver">Version number</Label><Input id="ver" placeholder="1.1" value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} /></div>
            <Textarea className="h-80 font-mono text-xs" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.reaccept} onCheckedChange={(c) => setDraft({ ...draft, reaccept: c === true })} /> Material change — customers must accept again</label>
          </div>}
          <DialogFooter><Button disabled={!draft?.version.trim()} onClick={() => draft && call(supabase.rpc("legal_create_draft", { _slug: SPACES_AGREEMENT, _version: draft.version, _content: draft.content, _reaccept: draft.reaccept }), "Draft saved")}>Save draft</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-hero text-2xl text-foreground">{value}</p></div>
);
