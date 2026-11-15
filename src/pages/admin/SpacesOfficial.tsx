import { useCallback, useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isReservedName } from "@/lib/spaces/reserved";

type Row = { app_id: string; name: string; slug: string; workspace_name: string | null; owner_email: string | null; created_at: string; official: boolean; product_name: string | null; ownership_ref: string | null; responsible: string | null; verified_at: string | null; revoked_at: string | null; reserved_name_ok: boolean };
type Ev = { id: string; app_id: string; action: string; note: string | null; created_at: string };
type Verifier = { user_id: string; email: string; created_at: string };

export default function SpacesOfficial() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [isSuper, setIsSuper] = useState(false);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [grant, setGrant] = useState<Row | null>(null);
  const [revoke, setRevoke] = useState<Row | null>(null);
  const [form, setForm] = useState({ product: "", ref: "", responsible: "", note: "" });
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const [{ data: p, error }, { data: e }, { data: s }] = await Promise.all([
      supabase.rpc("spaces_admin_projects"),
      supabase.from("spaces_designation_events").select("id,app_id,action,note,created_at").order("created_at", { ascending: false }).limit(100),
      uid ? supabase.rpc("has_admin_role", { _user_id: uid, _role: "super_admin" }) : Promise.resolve({ data: false }),
    ]);
    if (error) toast.error(error.message);
    setRows((p as Row[]) ?? []); setEvents((e as Ev[]) ?? []); setIsSuper(s === true);
    if (s === true) { const { data: v } = await supabase.rpc("spaces_list_verifiers"); setVerifiers((v as Verifier[]) ?? []); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    if (error) return toast.error(error.message);
    toast.success(ok); setGrant(null); setRevoke(null); setForm({ product: "", ref: "", responsible: "", note: "" }); load();
  };
  const names = Object.fromEntries((rows ?? []).map((r) => [r.app_id, r.name]));
  const list = (rows ?? []).filter((r) => !q || `${r.name} ${r.slug} ${r.workspace_name} ${r.owner_email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell title="Spaces · Official projects" description="Verify which Spaces apps are official Loumilab products. Hosting on Spaces never makes an app official. Every change is recorded in the audit log.">
      <SEOHead title="Official projects | Loumilab Admin" description="Spaces official project verification." path="/admin/spaces-official" noindex />
      <Input placeholder="Search apps, workspaces or owners" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <div className="rounded-2xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>App</TableHead><TableHead>Owner</TableHead><TableHead>Designation</TableHead><TableHead>Address</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows === null && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Loading…</TableCell></TableRow>}
            {rows?.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground">No apps, or you don't have permission to verify projects.</TableCell></TableRow>}
            {list.map((r) => (
              <TableRow key={r.app_id}>
                <TableCell><div className="font-medium text-foreground">{r.name}</div><div className="text-xs text-muted-foreground">{r.slug}.loumilab.com</div></TableCell>
                <TableCell><div>{r.workspace_name ?? "—"}</div><div className="text-xs text-muted-foreground">{r.owner_email ?? "—"}</div></TableCell>
                <TableCell>{r.official
                  ? <div><span className="inline-flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-dot" />Official · {r.product_name}</span><div className="text-xs text-muted-foreground">Ref {r.ownership_ref} · {r.responsible} · {r.verified_at && new Date(r.verified_at).toLocaleDateString()}</div></div>
                  : <span className="text-muted-foreground">Independent{r.revoked_at ? " (revoked)" : ""}</span>}</TableCell>
                <TableCell className="text-sm">{isReservedName(r.slug) ? (r.reserved_name_ok ? "Reserved name · approved" : "Reserved name · not approved") : "Standard"}</TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {r.official
                    ? <Button size="sm" variant="outline" onClick={() => setRevoke(r)}>Revoke</Button>
                    : <Button size="sm" onClick={() => setGrant(r)}>Verify</Button>}
                  {isSuper && r.official && isReservedName(r.slug) && !r.reserved_name_ok &&
                    <Button size="sm" variant="outline" onClick={() => run(() => supabase.rpc("spaces_approve_reserved_name", { _slug: r.slug, _app_id: r.app_id }), "Name approved.")}>Approve name</Button>}
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>
      </div>

      <h2 className="mt-10 font-hero text-xl font-semibold text-foreground">Verification history.</h2>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border text-sm">
        {events.length === 0 && <li className="p-4 text-muted-foreground">No verification changes yet.</li>}
        {events.map((e) => <li key={e.id} className="p-4"><span className="font-medium text-foreground">{e.action.replace("_", " ")}</span> · {names[e.app_id] ?? e.app_id.slice(0, 8)} · <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}{e.note ? ` — ${e.note}` : ""}</span></li>)}
      </ul>

      {isSuper && <>
        <h2 className="mt-10 font-hero text-xl font-semibold text-foreground">Who can verify.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Super admins can always verify. Add other staff here to let them verify and revoke too.</p>
        <div className="mt-3 flex max-w-md gap-2"><Input type="email" placeholder="staff@loumilab.com" value={email} onChange={(e) => setEmail(e.target.value)} /><Button disabled={!email} onClick={() => run(() => supabase.rpc("spaces_set_verifier", { _user_email: email, _allow: true }), "Permission given.").then(() => setEmail(""))}>Allow</Button></div>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border text-sm">
          {verifiers.length === 0 && <li className="p-4 text-muted-foreground">Only super admins right now.</li>}
          {verifiers.map((v) => <li key={v.user_id} className="flex items-center justify-between p-4"><span>{v.email}</span><Button size="sm" variant="outline" onClick={() => run(() => supabase.rpc("spaces_set_verifier", { _user_email: v.email, _allow: false }), "Permission removed.")}>Remove</Button></li>)}
        </ul>
      </>}

      <Dialog open={!!grant} onOpenChange={(o) => !o && setGrant(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify {grant?.name} as an Official Loumilab Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {([["product", "Loumilab product", "e.g. Loumilab Orders"], ["ref", "Internal ownership record", "e.g. contract, repo or asset ID"], ["responsible", "Responsible person", "Name at Loumilab"]] as const).map(([k, l, ph]) => (
              <div key={k}><Label>{l}</Label><Input placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>))}
            <div><Label>Note (required)</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          </div>
          <DialogFooter><Button disabled={!form.product || !form.ref || !form.responsible || !form.note}
            onClick={() => grant && run(() => supabase.rpc("spaces_grant_official", { _app_id: grant.app_id, _product: form.product, _ownership_ref: form.ref, _responsible: form.responsible, _note: form.note }), "Verified.")}>Verify</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!revoke} onOpenChange={(o) => !o && setRevoke(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoke official status for {revoke?.name}?</DialogTitle></DialogHeader>
          <div><Label>Reason (required)</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <DialogFooter><Button variant="destructive" disabled={!form.note} onClick={() => revoke && run(() => supabase.rpc("spaces_revoke_official", { _app_id: revoke.app_id, _note: form.note }), "Revoked.")}>Revoke</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
