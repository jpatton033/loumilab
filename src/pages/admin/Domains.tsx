import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Ev = { id: string; created_at: string; op: string; ok: boolean; http_status: number | null; error: string | null; surface: string | null; result_count: number | null };

export default function AdminDomains() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [conn, setConn] = useState<{ connected: boolean; error: string | null } | null>(null);
  const [s, setS] = useState({ searches_per_hour: 20, checks_per_hour: 40, enabled: true });
  const load = useCallback(async () => {
    const since = new Date(Date.now() - 864e5).toISOString();
    const [{ data: e }, { data: st }] = await Promise.all([
      supabase.from("domain_provider_events").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
      supabase.from("domain_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setEvents((e as Ev[]) ?? []); if (st) setS(st);
  }, []);
  useEffect(() => { load(); }, [load]);
  const test = async () => { const { data, error } = await supabase.functions.invoke("domain-search", { body: { op: "status" } }); setConn(error ? { connected: false, error: error.message } : data); load(); };
  const save = async () => { const { error } = await supabase.from("domain_settings").update({ ...s, updated_at: new Date().toISOString() }).eq("id", 1); error ? toast.error(error.message) : toast.success("Saved"); };
  const lastOk = events.find((e) => e.ok);
  const errors = events.filter((e) => !e.ok).slice(0, 10);
  const count = (op: string) => events.filter((e) => e.op === op).length;
  const stat = (k: string, v: React.ReactNode) => <div className="rounded-3xl border border-border p-5"><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 font-medium text-foreground">{v}</p></div>;
  return (
    <AdminShell title="Domains" description="Cloudflare Registrar domain search used by Business Email and Spaces. Search and live checks only — registration automation is off.">
      <SEOHead title="Domains | Admin" description="Domain search settings" path="/admin/domains" noindex />
      <div className="grid gap-4 sm:grid-cols-3">
        {stat("Provider", "Cloudflare Registrar (beta)")}
        {stat("Connection", conn ? (conn.connected ? "Connected" : `Error: ${conn.error}`) : <Button size="sm" variant="outline" onClick={test}>Test connection</Button>)}
        {stat("Last successful request", lastOk ? new Date(lastOk.created_at).toLocaleString() : "None in 24h")}
        {stat("Searches (24h)", count("search"))}
        {stat("Live checks (24h)", count("check"))}
        {stat("Registration automation", "Off")}
      </div>
      <div className="mt-8 rounded-3xl border border-border p-6">
        <h2 className="font-display text-lg font-semibold">Limits per visitor, per hour</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-sm">Searches<Input type="number" min={1} max={500} value={s.searches_per_hour} onChange={(e) => setS({ ...s, searches_per_hour: +e.target.value })} className="mt-1 w-28" /></label>
          <label className="text-sm">Live checks<Input type="number" min={1} max={500} value={s.checks_per_hour} onChange={(e) => setS({ ...s, checks_per_hour: +e.target.value })} className="mt-1 w-28" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Search enabled</label>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">Recent errors</h2>
        {errors.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No errors in the last 24 hours.</p> : (
          <ul className="mt-3 divide-y divide-border rounded-3xl border border-border text-sm">{errors.map((e) => <li key={e.id} className="px-5 py-3">{new Date(e.created_at).toLocaleString()} · {e.op} · {e.http_status ?? "—"} · {e.error}</li>)}</ul>)}
      </div>
    </AdminShell>
  );
}
