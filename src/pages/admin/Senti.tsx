import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type U = { id: string; kind: string; title: string; body: string; version: string | null; published: boolean; published_at: string | null };

export default function AdminSenti() {
  const [rows, setRows] = useState<U[]>([]);
  const [s, setS] = useState({ live_enabled: true, demo_enabled: true });
  const [stats, setStats] = useState({ sessions: 0, events: 0, errors: [] as { created_at: string; op: string; detail: string | null }[] });
  const [d, setD] = useState({ kind: "update", title: "", body: "", version: "" });
  const load = useCallback(async () => {
    const [u, st, ss, ev, er] = await Promise.all([
      supabase.from("senti_updates").select("*").order("created_at", { ascending: false }),
      supabase.from("senti_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("senti_sessions").select("id", { count: "exact", head: true }),
      supabase.from("senti_events").select("id", { count: "exact", head: true }),
      supabase.from("senti_audit").select("created_at,op,detail").eq("ok", false).order("created_at", { ascending: false }).limit(10),
    ]);
    setRows((u.data as U[]) ?? []); if (st.data) setS(st.data);
    setStats({ sessions: ss.count ?? 0, events: ev.count ?? 0, errors: er.data ?? [] });
  }, []);
  useEffect(() => { load(); }, [load]);
  const [researchers, setResearchers] = useState<{ user_id: string; email: string; created_at: string }[]>([]);
  const [email, setEmail] = useState("");
  const loadR = useCallback(async () => { const { data } = await supabase.rpc("senti_researcher_list"); setResearchers((data as any) ?? []); }, []);
  useEffect(() => { loadR(); }, [loadR]);
  const setR = async (em: string, grant: boolean) => {
    const { data, error } = await supabase.rpc("senti_set_researcher", { _email: em, _grant: grant });
    if (error) return toast.error(error.message); if (!data) return toast.error("No account with that email");
    setEmail(""); loadR(); toast.success(grant ? "Researcher access granted" : "Access removed");
  };
  const saveSettings = async (next: typeof s) => { setS(next); const { error } = await supabase.from("senti_settings").update({ ...next, updated_at: new Date().toISOString() }).eq("id", 1); if (error) toast.error(error.message); };
  const add = async () => {
    if (d.title.trim().length < 3) return toast.error("Add a title");
    const { error } = await supabase.from("senti_updates").insert({ kind: d.kind, title: d.title.trim(), body: d.body.trim(), version: d.version.trim() || null });
    if (error) return toast.error(error.message); setD({ kind: "update", title: "", body: "", version: "" }); load();
  };
  const toggle = async (r: U) => { await supabase.from("senti_updates").update({ published: !r.published, published_at: !r.published ? new Date().toISOString() : r.published_at }).eq("id", r.id); load(); };
  const del = async (r: U) => { if (!confirm(`Delete “${r.title}”?`)) return; await supabase.from("senti_updates").delete().eq("id", r.id); load(); };
  return (
    <AdminShell title="Senti" description="Publish research updates and documents, switch Lab modes, and review engine activity.">
      <SEOHead title="Senti | Admin" description="Senti research administration" path="/admin/senti" noindex />
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Sessions", stats.sessions], ["Observations", stats.events], ["Recent errors", stats.errors.length]].map(([k, v]) => <div key={k} className="rounded-3xl border border-border p-5"><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}
        <div className="space-y-2 rounded-3xl border border-border p-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.live_enabled} onChange={(e) => saveSettings({ ...s, live_enabled: e.target.checked })} /> Live research mode</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.demo_enabled} onChange={(e) => saveSettings({ ...s, demo_enabled: e.target.checked })} /> Guided demo</label>
        </div>
      </div>
      {stats.errors.length > 0 && <ul className="mt-6 divide-y divide-border rounded-3xl border border-border text-sm">{stats.errors.map((e, i) => <li key={i} className="px-5 py-3">{new Date(e.created_at).toLocaleString()} · {e.op} · {e.detail}</li>)}</ul>}
      <div className="mt-8 space-y-3 rounded-3xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Research Studio access</h2><Button asChild variant="outline" size="sm"><Link to="/senti/studio">Open Research Studio</Link></Button></div>
        <p className="text-sm text-muted-foreground">Full admins always have access. Grant other signed-up accounts researcher access here.</p>
        <div className="flex flex-wrap gap-2"><Input placeholder="account email" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" /><Button onClick={() => setR(email, true)} disabled={!email.includes("@")}>Grant access</Button></div>
        {researchers.length > 0 && <ul className="divide-y divide-border text-sm">{researchers.map((r) => <li key={r.user_id} className="flex items-center justify-between py-2"><span>{r.email}</span><Button size="sm" variant="ghost" onClick={() => setR(r.email, false)}>Remove</Button></li>)}</ul>}
      </div>
      <div className="mt-8 space-y-3 rounded-3xl border border-border p-6">
        <h2 className="font-display text-lg font-semibold">New entry</h2>
        <div className="flex flex-wrap gap-3">
          <select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })} className="h-10 rounded-md border border-border bg-background px-3"><option value="update">Update</option><option value="document">Research document</option></select>
          <Input placeholder="Title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} className="max-w-md" maxLength={160} />
          <Input placeholder="Version (optional)" value={d.version} onChange={(e) => setD({ ...d, version: e.target.value })} className="w-44" maxLength={40} />
        </div>
        <Textarea rows={5} placeholder="Body" value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} maxLength={20000} />
        <Button onClick={add}>Save as draft</Button>
      </div>
      <ul className="mt-8 divide-y divide-border rounded-3xl border border-border">
        {rows.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.kind}{r.version && ` · ${r.version}`} · {r.published ? `Published ${r.published_at ? new Date(r.published_at).toLocaleDateString() : ""}` : "Draft"}</p></div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.published ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="ghost" onClick={() => del(r)}>Delete</Button></div></li>)}
      </ul>
    </AdminShell>
  );
}
