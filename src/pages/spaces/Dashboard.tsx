import { customerHost, customerHref, customerUrl } from "@/lib/siteAddress";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { fmtBytes, ROLE_RANK, slugify, spacesApi, useSessionUser, type Role } from "@/lib/spaces/client";
import { LIMITS } from "@/lib/spaces/spec";

type App = Tables<"spaces_apps">;
type Version = Tables<"spaces_versions">;
type Ws = Tables<"spaces_workspaces"> & { role: Role };
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground";
const BUILT = ["traditional", "ai-assisted", "hybrid", "open-source", "unspecified"];
const VIS: Record<string, string> = { private: "Private — admins and the creator", workspace: "Workspace — all members", link: "Anyone with the link" };

function useWorkspaces(uid?: string) {
  const [list, setList] = useState<Ws[] | null>(null);
  const [current, setCurrent] = useState<string | null>(() => localStorage.getItem("spaces.ws"));
  const load = useCallback(async () => {
    if (!uid) return;
    const { data: mem } = await supabase.from("spaces_members").select("workspace_id, role").eq("user_id", uid);
    const ids = (mem ?? []).map((m) => m.workspace_id);
    const { data: ws } = ids.length ? await supabase.from("spaces_workspaces").select("*").in("id", ids) : { data: [] };
    const out = (ws ?? []).map((w) => ({ ...w, role: mem!.find((m) => m.workspace_id === w.id)!.role as Role }));
    setList(out);
    setCurrent((c) => (c && out.some((w) => w.id === c) ? c : out[0]?.id ?? null));
  }, [uid]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (current) localStorage.setItem("spaces.ws", current); }, [current]);
  return { list, current: list?.find((w) => w.id === current) ?? null, setCurrent, reload: load };
}

export default function SpacesDashboard() {
  const user = useSessionUser();
  const ws = useWorkspaces(user?.id);
  if (user === null) return <Navigate to="/sign-in?next=/spaces/app" replace />;
  if (user === undefined || ws.list === null) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Dashboard | Loumilab Spaces" description="Manage your Spaces apps." path="/spaces/app" noindex />
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/spaces" className="font-hero text-lg font-semibold text-foreground">Spaces<span className="text-dot">.</span></Link>
          {ws.list.length > 0 && (
            <select aria-label="Workspace" className={sel} value={ws.current?.id} onChange={(e) => ws.setCurrent(e.target.value)}>
              {ws.list.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground" to="/spaces/app">Library</Link>
            {ws.current && <Link className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground" to="/spaces/app/workspace">Members</Link>}
            <Link className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground" to="/spaces/specification">Docs</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!ws.current ? <CreateWorkspace onDone={async (id) => { ws.setCurrent(id); await ws.reload(); }} first /> : (
          <Routes>
            <Route index element={<Library ws={ws.current} uid={user.id} />} />
            <Route path="workspace" element={<Members ws={ws.current} uid={user.id} onNew={async (id) => { ws.setCurrent(id); await ws.reload(); }} />} />
            <Route path="apps/:id" element={<AppDetail ws={ws.current} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function CreateWorkspace({ onDone, first }: { onDone: (id: string) => void; first?: boolean }) {
  const [name, setName] = useState("");
  const go = async () => {
    const { data, error } = await supabase.rpc("spaces_create_workspace", { _name: name || "My workspace" });
    if (error) return toast.error(error.message);
    onDone(data as string);
  };
  return (
    <div className={first ? "mx-auto max-w-lg py-16 text-center" : ""}>
      {first && <><h1 className="font-hero text-4xl font-semibold text-foreground">Create your first workspace.</h1><p className="mt-3 text-muted-foreground">A workspace holds your apps and the people who work on them.</p></>}
      <div className="mt-8 flex gap-2"><Input placeholder="Workspace name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /><Button onClick={go}>Create</Button></div>
    </div>
  );
}

/* ---------------- Library ---------------- */
function Library({ ws, uid }: { ws: Ws; uid: string }) {
  const [apps, setApps] = useState<App[] | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(""); const [folder, setFolder] = useState(""); const [view, setView] = useState<"active" | "archived" | "favorites">("active");
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    const [{ data }, { data: f }] = await Promise.all([
      supabase.from("spaces_apps").select("*").eq("workspace_id", ws.id).order("updated_at", { ascending: false }),
      supabase.from("spaces_favorites").select("app_id").eq("user_id", uid),
    ]);
    setApps(data ?? []); setFavs(new Set((f ?? []).map((x) => x.app_id)));
  }, [ws.id, uid]);
  useEffect(() => { load(); }, [load]);
  const folders = useMemo(() => [...new Set((apps ?? []).map((a) => a.folder).filter(Boolean))] as string[], [apps]);
  const shown = (apps ?? []).filter((a) =>
    (view === "favorites" ? favs.has(a.id) : a.status === view) && (!folder || a.folder === folder) &&
    (!q || [a.name, a.description, a.slug, ...a.tags].join(" ").toLowerCase().includes(q.toLowerCase())));
  const toggleFav = async (id: string) => {
    if (favs.has(id)) await supabase.from("spaces_favorites").delete().eq("user_id", uid).eq("app_id", id);
    else await supabase.from("spaces_favorites").insert({ user_id: uid, app_id: id });
    load();
  };
  const canCreate = ROLE_RANK[ws.role] >= 2;
  const live = (apps ?? []).filter((a) => a.current_version_id && a.status === "active").length;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Library · {ws.role}</p><h1 className="mt-2 font-hero text-4xl font-semibold text-foreground">{ws.name}.</h1></div>
        {canCreate && <Button onClick={() => setOpen(true)}>New app</Button>}
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm">
        {[["Apps", apps?.length ?? 0], ["Live", live], ["Archived", (apps ?? []).filter((a) => a.status === "archived").length]].map(([k, v]) => (
          <div key={k as string} className="bg-background p-5"><dt className="text-muted-foreground">{k}</dt><dd className="mt-1 font-hero text-2xl font-semibold text-foreground">{v}</dd></div>))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search apps, tags…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="View" className={sel} value={view} onChange={(e) => setView(e.target.value as typeof view)}><option value="active">Active</option><option value="favorites">Favorites</option><option value="archived">Archived</option></select>
        {folders.length > 0 && <select aria-label="Folder" className={sel} value={folder} onChange={(e) => setFolder(e.target.value)}><option value="">All folders</option>{folders.map((f) => <option key={f}>{f}</option>)}</select>}
      </div>
      {apps === null ? <p className="mt-10 text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">{apps.length ? "No apps match." : canCreate ? "No apps yet. Create one, then upload a ZIP of your build." : "No apps you can open yet."}</div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <li key={a.id} className="glow-hover relative rounded-3xl border border-border bg-card p-6">
              <button aria-label={favs.has(a.id) ? "Remove favorite" : "Add favorite"} onClick={() => toggleFav(a.id)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center text-lg text-muted-foreground hover:text-foreground">{favs.has(a.id) ? "★" : "☆"}</button>
              <Link to={`/spaces/app/apps/${a.id}`} className="block">
                <p className="pr-10 font-hero text-xl font-semibold text-foreground">{a.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.current_version_id ? "Live" : "Not deployed"} · {a.visibility}{a.folder ? ` · ${a.folder}` : ""}</p>
                {a.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                {a.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{a.tags.map((t) => <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{t}</span>)}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NewApp ws={ws} uid={uid} open={open} onOpenChange={setOpen} />
    </>
  );
}

function NewApp({ ws, uid, open, onOpenChange }: { ws: Ws; uid: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate();
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [built, setBuilt] = useState("unspecified"); const [vis, setVis] = useState("private");
  const save = async () => {
    const s = slug || slugify(name);
    if (!/^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])$/.test(s)) return toast.error("Address must be 3–48 lowercase letters, numbers or dashes.");
    const { data, error } = await supabase.from("spaces_apps").insert({ workspace_id: ws.id, name, slug: s, built_with: built, visibility: vis, created_by: uid }).select("id").single();
    if (error) return toast.error(error.code === "23505" ? "That address is taken." : error.message);
    onOpenChange(false); nav(`/spaces/app/apps/${data.id}`);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New app</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm">Name<Input className="mt-1" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} /></label>
          <label className="block text-sm">Address<div className="mt-1 flex items-center gap-1 text-muted-foreground"><Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /><span className="text-xs">.loumilab.com</span></div></label>
          <label className="block text-sm">How it was built<select className={`${sel} mt-1 w-full`} value={built} onChange={(e) => setBuilt(e.target.value)}>{BUILT.map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="block text-sm">Who can open it<select className={`${sel} mt-1 w-full`} value={vis} onChange={(e) => setVis(e.target.value)}>{Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <DialogFooter><Button onClick={save} disabled={!name.trim()}>Create app</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- App detail ---------------- */
type Ev = Tables<"spaces_passport_events">;
const EV: Record<string, string> = { created: "Created", deployed: "Deployed", deploy_failed: "Deploy failed", rolled_back: "Rolled back", exported: "Exported", imported: "Imported", updated: "Updated" };

function AppDetail({ ws }: { ws: Ws }) {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [app, setApp] = useState<App | null | undefined>(undefined);
  const [versions, setVersions] = useState<Version[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [canManage, setCanManage] = useState(false);
  const load = useCallback(async () => {
    const { data: a } = await supabase.from("spaces_apps").select("*").eq("id", id).maybeSingle();
    setApp(a);
    if (!a) return;
    const [{ data: v }, { data: e }, { data: m }] = await Promise.all([
      supabase.from("spaces_versions").select("*").eq("app_id", id).order("number", { ascending: false }),
      supabase.from("spaces_passport_events").select("*").eq("app_id", id).order("created_at", { ascending: false }).limit(200),
      supabase.rpc("spaces_can_manage_app", { _app: id, _uid: (await supabase.auth.getUser()).data.user!.id }),
    ]);
    setVersions(v ?? []); setEvents(e ?? []); setCanManage(m === true);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  if (app === undefined) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (app === null) return <p className="text-muted-foreground">This app doesn't exist or you don't have access. <Link className="underline" to="/spaces/app">Back to Library</Link></p>;
  const live = versions.find((v) => v.id === app.current_version_id);
  const storage = versions.filter((v) => v.status === "ready").reduce((s, v) => s + Number(v.total_bytes), 0);
  const exportZip = async () => {
    try { const r = await spacesApi<{ url: string }>({ action: "export", app_id: app.id }); window.location.href = r.url; load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const passport = async () => {
    try {
      const r = await spacesApi({ action: "passport", app_id: app.id });
      const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }));
      Object.assign(document.createElement("a"), { href: url, download: `${app.slug}-passport.json` }).click();
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <>
      <Link to="/spaces/app" className="text-sm text-muted-foreground hover:text-foreground">← Library</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-hero text-4xl font-semibold text-foreground">{app.name}.</h1><p className="mt-2 text-sm text-muted-foreground">{customerHost(app.slug)} · {app.built_with} · {app.status}</p></div>
        <div className="flex flex-wrap gap-2">
          {live && app.status === "active" && <Button asChild><a href={customerHref("space", app.slug)} target="_blank" rel="noreferrer">Open app</a></Button>}
          {canManage && live && <Button variant="outline" onClick={exportZip}>Export</Button>}
        </div>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm sm:grid-cols-4">
        {[["Status", live ? "Live" : "Not deployed"], ["Live version", live ? `#${live.number}${(live.manifest as { version?: string } | null)?.version ? ` · ${(live.manifest as { version: string }).version}` : ""}` : "—"], ["Storage", fmtBytes(storage)], ["Last deploy", versions[0] ? new Date(versions[0].created_at).toLocaleString() : "—"]].map(([k, v]) => (
          <div key={k} className="bg-background p-5"><dt className="text-muted-foreground">{k}</dt><dd className="mt-1 font-medium text-foreground">{v}</dd></div>))}
      </dl>
      <Tabs defaultValue={canManage ? "deploy" : "passport"} className="mt-10">
        <TabsList>{canManage && <TabsTrigger value="deploy">Deploy</TabsTrigger>}<TabsTrigger value="versions">Versions</TabsTrigger><TabsTrigger value="passport">Passport</TabsTrigger>{canManage && <TabsTrigger value="settings">Settings</TabsTrigger>}</TabsList>
        {canManage && <TabsContent value="deploy"><Deploy app={app} onDone={load} /></TabsContent>}
        <TabsContent value="versions">
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {versions.length === 0 && <li className="p-5 text-sm text-muted-foreground">No versions yet.</li>}
            {versions.map((v) => {
              const val = v.validation as { errors?: string[]; warnings?: string[] };
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-4 p-5 text-sm">
                  <span className="font-medium text-foreground">#{v.number}</span>
                  <span className={v.status === "ready" ? "text-foreground" : "text-destructive"}>{v.id === app.current_version_id ? "Live" : v.status === "ready" ? "Ready" : "Failed"}</span>
                  <span className="text-muted-foreground">{v.file_count} files · {fmtBytes(Number(v.total_bytes))} · {new Date(v.created_at).toLocaleString()}</span>
                  {val?.errors?.length ? <span className="w-full text-xs text-destructive">{val.errors.slice(0, 3).join(" · ")}</span> : null}
                  {canManage && v.status === "ready" && v.id !== app.current_version_id && (
                    <Button size="sm" variant="outline" className="ml-auto" onClick={async () => { try { await spacesApi({ action: "rollback", app_id: app.id, version_id: v.id }); toast.success(`Version #${v.number} is live.`); load(); } catch (e) { toast.error((e as Error).message); } }}>Make live</Button>)}
                </li>);
            })}
          </ul>
        </TabsContent>
        <TabsContent value="passport">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Permanent ID <span className="font-mono text-foreground">{app.id}</span> · created {new Date(app.created_at).toLocaleDateString()}</p><Button variant="outline" size="sm" onClick={passport}>Download passport.json</Button></div>
          <ol className="mt-6 border-l border-border pl-6">
            {events.map((e) => (
              <li key={e.id} className="relative pb-6"><span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-foreground" />
                <p className="text-sm font-medium text-foreground">{EV[e.kind] ?? e.kind}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()} {summary(e.detail)}</p></li>))}
          </ol>
        </TabsContent>
        {canManage && <TabsContent value="settings"><Settings app={app} ws={ws} onSaved={load} onDeleted={() => nav("/spaces/app")} /></TabsContent>}
      </Tabs>
    </>
  );
}
const summary = (d: unknown) => {
  const o = (d ?? {}) as Record<string, unknown>;
  return Object.entries(o).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object").map(([k, v]) => `· ${k}: ${v}`).join(" ");
};

function Deploy({ app, onDone }: { app: App; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [notes, setNotes] = useState(""); const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; errors?: string[]; warnings?: string[] } | null>(null);
  const go = async () => {
    if (!file) return;
    if (file.size > LIMITS.maxZipBytes) return toast.error("The ZIP is over 50 MB.");
    setBusy(true); setResult(null);
    const path = `uploads/${app.id}/${crypto.randomUUID()}.zip`;
    const { error } = await supabase.storage.from("spaces-artifacts").upload(path, file, { contentType: "application/zip" });
    if (error) { setBusy(false); return toast.error(error.message); }
    try { const r = await spacesApi<{ ok: boolean; errors?: string[]; warnings?: string[] }>({ action: "deploy", app_id: app.id, upload_path: path, notes: notes || undefined }); setResult(r); if (r.ok) toast.success("Deployed."); }
    catch (e) { setResult({ ok: false, errors: [(e as Error).message] }); }
    setBusy(false); onDone();
  };
  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-muted-foreground">Upload a ZIP of your <strong className="text-foreground">built</strong> app (the folder with index.html, often dist/). A Spaces export ZIP works too — that's how you import. Use relative paths and hash routing. <Link to="/spaces/specification" className="underline">Read the rules</Link>.</p>
      <Input type="file" accept=".zip,application/zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Textarea placeholder="Release notes (optional)" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button onClick={go} disabled={!file || busy}>{busy ? "Checking and publishing…" : "Validate & deploy"}</Button>
      {result && (
        <div className={`rounded-2xl border p-5 text-sm ${result.ok ? "border-border" : "border-destructive/50"}`}>
          <p className="font-medium text-foreground">{result.ok ? "Live." : "Not deployed."}</p>
          {result.errors?.map((e) => <p key={e} className="mt-2 text-destructive">{e}</p>)}
          {result.warnings?.map((w) => <p key={w} className="mt-2 text-muted-foreground">Note: {w}</p>)}
        </div>
      )}
    </div>
  );
}

function Settings({ app, ws, onSaved, onDeleted }: { app: App; ws: Ws; onSaved: () => void; onDeleted: () => void }) {
  const [f, setF] = useState({ name: app.name, description: app.description ?? "", tags: app.tags.join(", "), folder: app.folder ?? "", visibility: app.visibility });
  const [confirm, setConfirm] = useState(""); const [del, setDel] = useState(false);
  const save = async (patch: Partial<App>) => {
    const { error } = await supabase.from("spaces_apps").update(patch).eq("id", app.id);
    if (error) toast.error(error.message); else { toast.success("Saved."); onSaved(); }
  };
  return (
    <div className="max-w-2xl space-y-4">
      <label className="block text-sm">Name<Input className="mt-1" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="block text-sm">Description<Textarea className="mt-1" value={f.description} maxLength={500} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <label className="block text-sm">Tags (comma separated)<Input className="mt-1" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></label>
      <label className="block text-sm">Folder<Input className="mt-1" value={f.folder} maxLength={60} onChange={(e) => setF({ ...f, folder: e.target.value })} /></label>
      <label className="block text-sm">Who can open it<select className={`${sel} mt-1 w-full`} value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value })}>{Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <Button onClick={() => save({ name: f.name.trim(), description: f.description || null, folder: f.folder.trim() || null, visibility: f.visibility, tags: f.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12) })}>Save</Button>
      <div className="mt-10 space-y-3 border-t border-border pt-8">
        <Button variant="outline" onClick={() => save({ status: app.status === "active" ? "archived" : "active" })}>{app.status === "active" ? "Archive app" : "Restore app"}</Button>
        {ROLE_RANK[ws.role] >= 3 && <Button variant="destructive" className="ml-2" onClick={() => setDel(true)}>Delete app</Button>}
      </div>
      <AlertDialog open={del} onOpenChange={setDel}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {app.name}?</AlertDialogTitle><AlertDialogDescription>This removes the app, its versions and its Passport for everyone. Export it first if you may need it. Type <strong>{app.slug}</strong> to confirm.</AlertDialogDescription></AlertDialogHeader>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={confirm !== app.slug} onClick={async () => { const { error } = await supabase.from("spaces_apps").delete().eq("id", app.id); if (error) toast.error(error.message); else onDeleted(); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Members ---------------- */
function Members({ ws, uid, onNew }: { ws: Ws; uid: string; onNew: (id: string) => void }) {
  const [members, setMembers] = useState<Tables<"spaces_members">[]>([]);
  const [email, setEmail] = useState(""); const [role, setRole] = useState("developer"); const [link, setLink] = useState<string | null>(null);
  const admin = ROLE_RANK[ws.role] >= 3;
  const load = useCallback(async () => { const { data } = await supabase.from("spaces_members").select("*").eq("workspace_id", ws.id).order("created_at"); setMembers(data ?? []); }, [ws.id]);
  useEffect(() => { load(); }, [load]);
  const invite = async () => {
    const { data, error } = await supabase.rpc("spaces_create_invite", { _ws: ws.id, _email: email, _role: role });
    if (error) return toast.error(error.message);
    setLink(`${window.location.origin}/spaces/invite/${data}`); setEmail("");
  };
  return (
    <div className="max-w-3xl">
      <h1 className="font-hero text-4xl font-semibold text-foreground">Members.</h1>
      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="text-foreground">{m.email ?? "Member"}{m.user_id === uid ? " (you)" : ""}</span>
            {admin && m.role !== "owner" && m.user_id !== uid ? (
              <select aria-label="Role" className={`${sel} ml-auto`} value={m.role} onChange={async (e) => { const { error } = await supabase.from("spaces_members").update({ role: e.target.value }).eq("workspace_id", ws.id).eq("user_id", m.user_id); if (error) toast.error("You can't assign that role."); load(); }}>
                {(ws.role === "owner" ? ["admin", "developer", "viewer"] : ["developer", "viewer"]).map((r) => <option key={r}>{r}</option>)}
              </select>) : <span className="ml-auto text-muted-foreground">{m.role}</span>}
            {m.role !== "owner" && (admin || m.user_id === uid) && <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm(m.user_id === uid ? "Leave this workspace?" : "Remove this member?")) return; await supabase.from("spaces_members").delete().eq("workspace_id", ws.id).eq("user_id", m.user_id); load(); }}>{m.user_id === uid ? "Leave" : "Remove"}</Button>}
          </li>))}
      </ul>
      {admin && (
        <div className="mt-10">
          <h2 className="font-hero text-2xl font-semibold text-foreground">Invite someone.</h2>
          <div className="mt-4 flex flex-wrap gap-2"><Input className="max-w-xs" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select aria-label="Invite role" className={sel} value={role} onChange={(e) => setRole(e.target.value)}>{(ws.role === "owner" ? ["admin", "developer", "viewer"] : ["developer", "viewer"]).map((r) => <option key={r}>{r}</option>)}</select>
            <Button onClick={invite} disabled={!email}>Create invite</Button></div>
          {link && <div className="mt-4 rounded-2xl border border-border p-4 text-sm"><p className="text-muted-foreground">Send this link to them. It works once, for that email, for 7 days.</p><div className="mt-2 flex gap-2"><Input readOnly value={link} /><Button variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied."); }}>Copy</Button></div></div>}
        </div>
      )}
      <div className="mt-14 border-t border-border pt-8"><h2 className="font-hero text-2xl font-semibold text-foreground">New workspace.</h2><CreateWorkspace onDone={onNew} /></div>
    </div>
  );
}
