import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LOCAL_CATEGORIES } from "@/lib/orders/local";
import {
  CSV_COLUMNS, type Candidate, type CsvColumn, type ParsedRow, parseCsv, rowToCandidate, templateCsv,
  useCandidates, useClaimsAndRequests, useDecide, useImportRows, useImporterCounts, useImporterSettings,
  useJobs, useRunImporter, useDiscover, useJobAction, useMarkets, usePublishCandidates, usePublishedUnclaimed, useSaveSettings, useSaveSource,
  useSources, useSuppressProfile, useUpdateCandidate,
} from "@/lib/local/importer";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] ${className}`}>{children}</div>
);
const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/* ---------------- Overview ---------------- */
const Overview = () => {
  const { data: c, isLoading } = useImporterCounts();
  const { data: s } = useImporterSettings();
  if (isLoading || !c) return <Empty>Loading…</Empty>;
  const stats = [
    ["Candidates", c.total], ["Ready for review", c.drafts], ["Possible duplicates", c.duplicates],
    ["Waiting for website extraction", c.needsExtraction], ["Published unclaimed", c.published],
    ["Pending claims", c.claims], ["Pending requests", c.requests], ["Jobs pending", c.jobsPending], ["Jobs failed", c.jobsFailed],
  ] as const;
  return (
    <div className="space-y-6">
      {s?.kill_switch && <Card className="border-destructive/40"><p className="text-sm font-semibold text-destructive">Kill switch is on — no new extraction work will start.</p></Card>}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([l, v]) => <Card key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-hero text-3xl font-semibold">{v}</p></Card>)}
      </div>
      <Card>
        <p className="text-sm font-semibold">Website extraction</p>
        <p className="mt-1 text-sm text-muted-foreground">Not connected yet. CSV and manual entry work now; pasted websites are queued and wait until the crawler is set up. Provider usage will appear here once it's connected.</p>
      </Card>
    </div>
  );
};

/* ---------------- Add businesses ---------------- */
const blankManual = { business_name: "", category: "", city: "", region: "MD", postal_code: "", service_area: "", website_url: "", public_phone: "", source_url: "", description: "" };

const AddBusinesses = () => {
  const { toast } = useToast();
  const { data: markets = [] } = useMarkets();
  const { data: settings } = useImporterSettings();
  const importRows = useImportRows();
  const [marketId, setMarketId] = useState<string>("");
  const [sample, setSample] = useState(false);
  const [file, setFile] = useState<{ name: string; raw: string; header: string[]; body: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Record<CsvColumn, number>>({} as never);
  const [urls, setUrls] = useState("");
  const [manual, setManual] = useState(blankManual);
  const maxRows = settings?.csv_max_rows ?? 250;

  const onFile = async (f: File) => {
    const raw = await f.text();
    const rows = parseCsv(raw);
    if (rows.length < 2) return toast({ title: "That file has no data rows", variant: "destructive" });
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const m = {} as Record<CsvColumn, number>;
    CSV_COLUMNS.forEach((c) => { m[c] = header.indexOf(c); });
    setMapping(m); setFile({ name: f.name, raw, header: rows[0], body: rows.slice(1) });
  };

  const parsed: ParsedRow[] = useMemo(() => {
    if (!file) return [];
    return file.body.slice(0, maxRows).map((r, i) => {
      const rec: Partial<Record<CsvColumn, string>> = {};
      CSV_COLUMNS.forEach((c) => { if (mapping[c] >= 0) rec[c] = r[mapping[c]]; });
      return rowToCandidate(rec, i + 2);
    });
  }, [file, mapping, maxRows]);
  const seen = new Set<string>();
  const withDup = parsed.map((p) => { const dup = seen.has(p.key); seen.add(p.key); return { ...p, dupInFile: dup }; });
  const valid = withDup.filter((p) => p.errors.length === 0 && !p.dupInFile);

  const commit = async (kind: "csv" | "manual" | "urls", rows: Partial<Candidate>[], extra?: { filename?: string; raw?: string }) => {
    try {
      const r = await importRows.mutateAsync({ kind, rows, marketId: marketId || null, sample, ...extra });
      toast({ title: `${r.created} added`, description: r.skipped ? `${r.skipped} already existed and were skipped.` : "Find them in the Review Queue." });
      return true;
    } catch (e) { toast({ title: "Couldn't save", description: errMsg(e), variant: "destructive" }); return false; }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([templateCsv()], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "loumilab-local-template.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-end gap-4">
        <div className="min-w-48">
          <Label>Market</Label>
          <select value={marketId} onChange={(e) => setMarketId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">No market</option>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}, {m.state}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={sample} onCheckedChange={setSample} /> Sample records (never public)</label>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-semibold">Import a CSV</p><p className="text-sm text-muted-foreground">Up to {maxRows} rows. Nothing is saved until you confirm.</p></div>
          <Button variant="outline" onClick={download}>Download template</Button>
        </div>
        <Input type="file" accept=".csv,text/csv" className="mt-4" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {file && (
          <div className="mt-5 space-y-4">
            <details className="rounded-2xl border border-border p-4">
              <summary className="cursor-pointer text-sm font-medium">Column mapping</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {CSV_COLUMNS.map((c) => (
                  <label key={c} className="text-xs">{c}
                    <select value={mapping[c]} onChange={(e) => setMapping({ ...mapping, [c]: Number(e.target.value) })} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                      <option value={-1}>— not in file —</option>
                      {file.header.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </details>
            {file.body.length > maxRows && <p className="text-sm text-destructive">Only the first {maxRows} rows will be used.</p>}
            <p className="text-sm">{valid.length} ready · {withDup.length - valid.length} need fixing or are repeated in the file</p>
            <div className="max-h-80 overflow-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left text-xs"><tr><th className="p-2">Row</th><th className="p-2">Business</th><th className="p-2">City</th><th className="p-2">Website</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {withDup.map((p) => (
                    <tr key={p.index} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{p.index}</td>
                      <td className="p-2">{p.data.business_name ?? <em className="text-muted-foreground">from website</em>}</td>
                      <td className="p-2">{p.data.city ?? p.data.service_area ?? "—"}</td>
                      <td className="max-w-48 truncate p-2">{p.data.website_url ?? "—"}</td>
                      <td className="p-2 text-xs">{p.errors.length ? <span className="text-destructive">{p.errors.join("; ")}</span> : p.dupInFile ? "Repeated in file" : "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Matches with existing listings or the removal list are flagged after saving, in the Review Queue.</p>
            <div className="flex gap-2">
              <Button disabled={!valid.length || importRows.isPending} onClick={async () => { if (await commit("csv", valid.map((v) => v.data), { filename: file.name, raw: file.raw })) setFile(null); }}>
                Save {valid.length} as drafts
              </Button>
              <Button variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <p className="font-semibold">Paste website addresses</p>
        <p className="text-sm text-muted-foreground">One per line. They're queued for extraction, which needs the crawler connection before it can run.</p>
        <Textarea className="mt-3" rows={4} value={urls} onChange={(e) => setUrls(e.target.value)} placeholder="https://examplebakery.com" />
        <Button className="mt-3" disabled={!urls.trim() || importRows.isPending} onClick={async () => {
          const rows = urls.split(/\s+/).filter(Boolean).slice(0, settings?.max_domains_per_batch ?? 25).map((u, i) => rowToCandidate({ website: u, source_url: u, source_type: "official_website" }, i));
          const bad = rows.filter((r) => r.errors.length);
          if (bad.length) return toast({ title: `${bad.length} address(es) aren't valid`, variant: "destructive" });
          if (await commit("urls", rows.map((r) => r.data), { raw: urls })) setUrls("");
        }}>Queue websites</Button>
      </Card>

      <Card>
        <p className="font-semibold">Add one business</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([["business_name", "Business name *"], ["city", "City"], ["region", "State"], ["postal_code", "ZIP"], ["service_area", "Service area"], ["website_url", "Website"], ["public_phone", "Public business phone"], ["source_url", "Source reference (URL) *"]] as const).map(([k, l]) => (
            <label key={k} className="text-sm">{l}<Input className="mt-1" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} /></label>
          ))}
          <label className="text-sm">Category
            <select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">—</option>{LOCAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">Short neutral description (Loumilab-written)<Input className="mt-1" maxLength={220} value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} placeholder="Bakery serving Baltimore with cakes and pastries." /></label>
        </div>
        <Button className="mt-4" disabled={!manual.business_name.trim() || importRows.isPending} onClick={async () => {
          const r = rowToCandidate({ business_name: manual.business_name, category: manual.category, city: manual.city, state: manual.region, zip: manual.postal_code, service_area: manual.service_area, website: manual.website_url, public_business_phone: manual.public_phone, source_url: manual.source_url, source_type: "manual" }, 1);
          if (r.errors.length) return toast({ title: r.errors.join("; "), variant: "destructive" });
          if (await commit("manual", [{ ...r.data, description: manual.description.trim() || null }])) setManual(blankManual);
        }}>Save draft</Button>
      </Card>
    </div>
  );
};

/* ---------------- Review queue ---------------- */
const missingFor = (c: Candidate) => {
  const m: string[] = [];
  if (!c.business_name) m.push("name");
  if (!c.city && !c.service_area) m.push("city or service area");
  if (!c.source_url) m.push("source");
  return m;
};

const ReviewRow = ({ c, selected, onSelect }: { c: Candidate; selected: boolean; onSelect: (v: boolean) => void }) => {
  const { toast } = useToast();
  const update = useUpdateCandidate();
  const publish = usePublishCandidates();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(c);
  const [notes, setNotes] = useState("");
  const missing = missingFor(c);
  const save = async (patch: Partial<Candidate>, msg = "Saved") => {
    try { await update.mutateAsync({ id: c.id, patch: { ...patch, review_notes: notes || c.review_notes } }); toast({ title: msg }); }
    catch (e) { toast({ title: "Couldn't save", description: errMsg(e), variant: "destructive" }); }
  };
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} aria-label="Select" />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <p className="truncate font-semibold">{c.business_name ?? c.website_domain ?? "Untitled"}</p>
          <p className="truncate text-xs text-muted-foreground">{[c.city ?? c.service_area, c.category, c.website_domain].filter(Boolean).join(" · ")}</p>
        </button>
        {c.source_type === "visitor" && <Badge variant="secondary">{c.submitter_affiliation === "customer" ? "Suggested by visitor" : "Submitted by visitor"}</Badge>}
        {c.is_sample && <Badge variant="outline">Sample</Badge>}
        {c.match_kind && <Badge variant={c.match_kind === "exact" ? "destructive" : "secondary"}>{c.match_kind === "exact" ? "Duplicate" : c.match_kind === "probable" ? "Possible duplicate" : "Suppressed"}</Badge>}
        {c.dup_decision === "distinct" && <Badge variant="outline">Distinct branch</Badge>}
        {missing.length > 0 && <Badge variant="outline">Missing {missing.join(", ")}</Badge>}
      </div>
      {open && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="grid gap-3">
            {([["business_name", "Name"], ["city", "City"], ["region", "State"], ["postal_code", "ZIP"], ["service_area", "Service area"], ["website_url", "Website"], ["public_phone", "Public phone"], ["public_email", "Public email"], ["hours_text", "Hours"], ["description", "Description (Loumilab-written)"], ["source_url", "Source"]] as const).map(([k, l]) => (
              <label key={k} className="text-xs">{l}<Input className="mt-1" value={(edit[k] as string) ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value || null })} /></label>
            ))}
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</p>
              <p className="mt-2 break-all">Source: {c.source_url ? <a className="underline" href={c.source_url} target="_blank" rel="noopener noreferrer nofollow">{c.source_url}</a> : <span className="text-destructive">none</span>}</p>
              {c.source_type === "visitor" && <p>Submitted by {c.submitter_name} ({c.submitter_email}) · Connection: {c.submitter_affiliation}{c.affiliation_note ? ` — ${c.affiliation_note}` : ""}</p>}
              <p>Type: {c.source_type ?? "—"} · Observed: {c.observed_at ? new Date(c.observed_at).toLocaleDateString() : "—"}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Public preview</p>
              <p className="mt-2 font-semibold">{edit.business_name}</p>
              <p className="text-muted-foreground">{edit.service_area || [edit.city, edit.region].filter(Boolean).join(", ")}</p>
              {edit.description && <p className="mt-1">{edit.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">Shown as Unclaimed with the public-sources notice. No photos, no ordering.</p>
            </div>
            {c.match_kind === "probable" || c.match_kind === "exact" ? (
              <div className="rounded-2xl border border-border p-4">
                <p>This may be the same business as {c.match_profile_id ? "an existing listing" : "another draft"}.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => save({ dup_decision: "distinct" }, "Marked as a distinct branch")}>Keep as distinct branch</Button>
                  <Button size="sm" variant="outline" onClick={() => save({ dup_decision: "link", status: "merged" }, "Linked to the existing record")}>Link / merge into existing</Button>
                </div>
              </div>
            ) : null}
            <Textarea rows={2} placeholder="Reason / review notes (saved with the decision)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={publish.isPending} onClick={async () => {
                const { id: _i, created_at: _c, website_domain: _w, match_kind: _m, ...patch } = edit;
                await update.mutateAsync({ id: c.id, patch });
                const [r] = await publish.mutateAsync({ ids: [c.id], notes });
                toast(r.ok ? { title: "Published as an unclaimed listing" } : { title: "Not published", description: r.error, variant: "destructive" });
              }}>Approve & publish</Button>
              <Button size="sm" variant="outline" onClick={() => { const { id: _i, created_at: _c, website_domain: _w, match_kind: _m, ...patch } = edit; save(patch, "Draft saved"); }}>Save draft</Button>
              <Button size="sm" variant="ghost" onClick={() => save({ status: "rejected" }, "Rejected")}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewQueue = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState("draft");
  const [filter, setFilter] = useState("");
  const { data = [], isLoading } = useCandidates(status);
  const publish = usePublishCandidates();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const rows = data.filter((c) => !filter || [c.business_name, c.city, c.category, c.website_domain].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const selected = rows.filter((r) => sel.has(r.id));
  const allValid = selected.every((c) => missingFor(c).length === 0 && !c.is_sample && (!c.match_kind || c.dup_decision === "distinct"));
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setSel(new Set()); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {[["draft", "Ready for review"], ["needs_extraction", "Waiting for extraction"], ["suppressed", "Suppressed"], ["rejected", "Rejected"], ["merged", "Merged"], ["published", "Published"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <Input className="max-w-xs" placeholder="Filter by name, city, category…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        {status === "draft" && (
          <Button className="ml-auto" disabled={!selected.length || !allValid || publish.isPending} onClick={async () => {
            if (!confirm(`Publish ${selected.length} selected listing(s)?`)) return;
            const res = await publish.mutateAsync({ ids: selected.map((s) => s.id) });
            const bad = res.filter((r) => !r.ok);
            toast({ title: `${res.length - bad.length} published`, description: bad.length ? `${bad.length} held back: ${bad[0].error}` : undefined, variant: bad.length ? "destructive" : undefined });
            setSel(new Set());
          }}>Publish selected ({selected.length})</Button>
        )}
      </div>
      {status === "draft" && selected.length > 0 && !allValid && <p className="mt-2 text-xs text-destructive">Some selected records are missing facts, are samples, or have unresolved duplicates.</p>}
      <div className="mt-4 space-y-3">
        {isLoading ? <Empty>Loading…</Empty> : rows.length === 0 ? <Empty>Nothing here.</Empty> : rows.map((c) => (
          <ReviewRow key={c.id} c={c} selected={sel.has(c.id)} onSelect={(v) => { const n = new Set(sel); v ? n.add(c.id) : n.delete(c.id); setSel(n); }} />
        ))}
      </div>
    </Card>
  );
};

/* ---------------- Published ---------------- */
const Published = () => {
  const { toast } = useToast();
  const { data = [], isLoading } = usePublishedUnclaimed();
  const suppress = useSuppressProfile();
  return (
    <Card>
      {isLoading ? <Empty>Loading…</Empty> : data.length === 0 ? <Empty>No imported listings yet.</Empty> : (
        <div className="space-y-2">
          {data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.display_name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.service_area_label || [p.city, p.region].filter(Boolean).join(", ")} · checked {p.last_checked_at ? new Date(p.last_checked_at).toLocaleDateString() : "—"} · {p.source_kind}</p>
              </div>
              <Badge variant={p.ownership_status === "claimed" ? "default" : "outline"}>{p.ownership_status === "claimed" ? "Claimed" : "Unclaimed"}</Badge>
              {!p.is_listed && <Badge variant="secondary">Hidden</Badge>}
              {p.is_listed && <Button asChild size="sm" variant="ghost"><Link to={`/orders/local/${p.slug}`} target="_blank">View</Link></Button>}
              {p.is_listed && <Button size="sm" variant="outline" onClick={async () => {
                const reason = prompt("Reason for removing and suppressing this listing?"); if (reason === null) return;
                try { await suppress.mutateAsync({ id: p.id, reason }); toast({ title: "Unpublished and suppressed" }); } catch (e) { toast({ title: "Failed", description: errMsg(e), variant: "destructive" }); }
              }}>Unpublish & suppress</Button>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/* ---------------- Claims & requests ---------------- */
const Claims = () => {
  const { toast } = useToast();
  const { data, isLoading } = useClaimsAndRequests();
  const decide = useDecide();
  const act = async (type: "claim" | "request", id: string, approve: boolean) => {
    const notes = prompt(approve ? "Approval notes (what evidence you checked)" : "Reason for rejecting"); if (notes === null) return;
    try { await decide.mutateAsync({ type, id, approve, notes }); toast({ title: approve ? "Approved" : "Rejected" }); }
    catch (e) { toast({ title: "Failed", description: errMsg(e), variant: "destructive" }); }
  };
  if (isLoading || !data) return <Empty>Loading…</Empty>;
  return (
    <div className="space-y-6">
      <Card>
        <p className="font-semibold">Ownership claims</p>
        <p className="text-xs text-muted-foreground">An email address alone doesn't prove ownership. Check a business-domain email, a verified public business channel, or the evidence provided.</p>
        <div className="mt-4 space-y-3">
          {data.claims.length === 0 ? <Empty>No claims yet.</Empty> : data.claims.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 font-semibold">{c.profile?.display_name} <span className="font-normal text-muted-foreground">— {c.contact_name}{c.role ? `, ${c.role}` : ""} ({c.user_email})</span></p>
                <Badge variant="outline">{c.status}</Badge>
              </div>
              {c.evidence && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{c.evidence}</p>}
              {c.profile?.website_url && <p className="mt-1 text-xs">Listing website: {c.profile.website_url}</p>}
              {c.status === "pending" && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => act("claim", c.id, true)}>Approve claim</Button><Button size="sm" variant="ghost" onClick={() => act("claim", c.id, false)}>Reject</Button></div>}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p className="font-semibold">Corrections & removal requests</p>
        <div className="mt-4 space-y-3">
          {data.requests.length === 0 ? <Empty>No requests yet.</Empty> : data.requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 font-semibold">{r.kind === "removal" ? "Removal" : "Correction"} · {r.profile_slug} <span className="font-normal text-muted-foreground">— {r.name ?? "Anonymous"} ({r.email})</span></p>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{r.message}</p>
              {r.status === "pending" && <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => act("request", r.id, true)}>{r.kind === "removal" ? "Approve removal" : "Mark handled"}</Button>
                <Button size="sm" variant="ghost" onClick={() => act("request", r.id, false)}>Reject</Button>
              </div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ---------------- Sources + jobs ---------------- */
const Sources = () => {
  const { toast } = useToast();
  const { data = [] } = useSources();
  const { data: jobs = [] } = useJobs();
  const save = useSaveSource();
  const run = useRunImporter(); const disc = useDiscover(); const jobAct = useJobAction();
  const { data: st } = useImporterSettings(); const { data: mkts = [] } = useMarkets();
  const [mkt, setMkt] = useState(""); const [cat, setCat] = useState("");
  const [domain, setDomain] = useState(""); const [notes, setNotes] = useState("");
  const runNow = async () => {
    try {
      const r = await run.mutateAsync();
      const parts = Object.entries(r.results ?? {}).map(([k, n]) => `${n} ${({ done: "read", awaiting_source: "waiting for domain approval", cooldown: "skipped (checked recently)", error: "will retry", failed: "failed", blocked: "blocked", budget: "stopped at daily limit" } as Record<string, string>)[k] ?? k}`);
      toast({ title: r.processed ? `Processed ${r.processed} website${r.processed === 1 ? "" : "s"}` : "Nothing queued", description: `${parts.join(" · ")}${parts.length ? " · " : ""}${r.credits_used_week}/${r.weekly_credit_limit} credits used this week · ${r.queued_left} left` });
    } catch (e) { toast({ title: "Couldn't run", description: errMsg(e), variant: "destructive" }); }
  };
  const discoverNow = async () => {
    try { const r = await disc.mutateAsync({ market_id: mkt, category: cat }); toast({ title: `${r.leads} new lead${r.leads === 1 ? "" : "s"}`, description: `${r.skipped} skipped (blocked or already known). Approve their domains below, then run.` }); }
    catch (e) { toast({ title: "Couldn't search", description: errMsg(e), variant: "destructive" }); }
  };
  const STATE: Record<string, string> = { queued: "Queued", running: "Reading…", done: "Done", failed: "Failed", cancelled: "Cancelled", paused: "Paused", waiting_config: "Queued" };
  const submit = async (d: string, status: string, n?: string) => {
    try { await save.mutateAsync({ domain: d, status, notes: n }); toast({ title: `${d} → ${status}` }); } catch (e) { toast({ title: "Couldn't save", description: errMsg(e), variant: "destructive" }); }
  };
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold">Read business websites</p>
            <p className="text-xs text-muted-foreground">Reads up to {st?.max_pages_per_domain ?? 4} pages (home, about, contact, hours) on approved domains only. Results go to the Review queue — nothing is published. {st ? `${st.credits_used_week ?? 0}/${st.weekly_credit_limit ?? 250} credits used this week${(st.credits_used_week ?? 0) >= (st.weekly_credit_limit ?? 250) - 2 ? " — Weekly limit reached" : ""}.` : ""}</p>
          </div>
          <Button onClick={runNow} disabled={run.isPending || st?.kill_switch || st?.dispatch_paused}>{run.isPending ? "Reading websites…" : "Run queued jobs"}</Button>
        </div>
        {(st?.kill_switch || st?.dispatch_paused) && <p className="mt-2 text-xs text-destructive">{st?.kill_switch ? "Kill switch is on." : "Dispatch is paused (daily limit or manual)."} Change it in Settings.</p>}
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium">Find leads</p>
          <p className="text-xs text-muted-foreground">Uses 1 page. Search results are leads only — each domain needs your approval before it's read.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={mkt} onChange={(e) => setMkt(e.target.value)}>
              <option value="">Market…</option>{mkts.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Category…</option>{LOCAL_CATEGORIES.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <Button variant="outline" disabled={!mkt || !cat || disc.isPending || st?.kill_switch} onClick={discoverNow}>{disc.isPending ? "Searching…" : "Search"}</Button>
          </div>
        </div>
      </Card>
      <Card>
        <p className="font-semibold">Add or review a domain</p>
        <p className="text-xs text-muted-foreground">Only approved domains can ever reach paid extraction. Record why the source is permitted.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="examplebakery.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <Input className="max-w-md flex-1" placeholder="Review notes (e.g. official business website, confirmed)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button disabled={!domain || !notes} onClick={() => { submit(domain, "approved", notes); setDomain(""); setNotes(""); }}>Approve</Button>
          <Button variant="outline" disabled={!domain} onClick={() => { submit(domain, "blocked", notes); setDomain(""); }}>Block</Button>
        </div>
      </Card>
      <Card>
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3 text-sm">
              <p className="flex-1 font-medium">{s.domain} <span className="text-xs font-normal text-muted-foreground">{s.source_type} · {s.notes}</span></p>
              <Badge variant={s.status === "approved" ? "default" : s.status === "blocked" ? "destructive" : "outline"}>{s.status}</Badge>
              {s.status === "pending" && <Button size="sm" onClick={() => submit(s.domain, "approved", s.notes ?? "Reviewed: official business website")}>Approve</Button>}
              {s.status === "pending" && <Button size="sm" variant="outline" onClick={() => submit(s.domain, "blocked", s.notes)}>Block</Button>}
              {s.status !== "paused" && s.status !== "blocked" && <Button size="sm" variant="ghost" onClick={() => submit(s.domain, "paused", s.notes)}>Pause</Button>}
              {s.status === "paused" && <Button size="sm" variant="ghost" onClick={() => submit(s.domain, "approved", s.notes)}>Resume</Button>}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p className="font-semibold">Jobs</p>
        {jobs.length === 0 ? <Empty>No jobs yet.</Empty> : (
          <div className="mt-3 space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3 text-sm">
                <p className="min-w-0 flex-1 truncate">{j.candidate?.website_url ?? j.candidate?.business_name ?? j.id}</p>
                <span className="text-xs text-muted-foreground">{j.kind} · attempts {j.attempts} · up to {j.max_pages} pages</span>
                <Badge variant={j.state === "failed" ? "destructive" : j.state === "done" ? "default" : "outline"}>{STATE[j.state] ?? j.state}</Badge>
                {j.last_error && <p className="basis-full text-xs text-muted-foreground">{j.last_error}</p>}
                {["failed", "cancelled", "paused", "done"].includes(j.state) && <Button size="sm" variant="ghost" onClick={() => jobAct.mutate({ id: j.id, action: "retry" })}>Retry</Button>}
                {["queued", "paused"].includes(j.state) && <Button size="sm" variant="ghost" onClick={() => jobAct.mutate({ id: j.id, action: "cancel" })}>Cancel</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ---------------- Settings ---------------- */
const NUM_FIELDS = [
  ["max_domains_per_batch", "Domains per batch"], ["max_pages_per_domain", "Pages per domain"], ["min_delay_seconds", "Seconds between requests"],
  ["weekly_credit_limit", "Weekly credit limit"], ["daily_page_limit", "Page fetches per day"], ["recrawl_cooldown_days", "Re-crawl cooldown (days)"], ["evidence_retention_days", "Evidence retention (days)"],
  ["provider_retention_days", "Provider output retention (days)"], ["freshness_days", "Freshness review (days)"], ["csv_max_rows", "CSV max rows"],
] as const;

const Settings = () => {
  const { toast } = useToast();
  const { data: s } = useImporterSettings();
  const { data: markets = [] } = useMarkets();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const v = draft ?? s;
  if (!v) return <Empty>Loading…</Empty>;
  const set = (k: string, val: unknown) => setDraft({ ...v, [k]: val });
  const commit = async (patch: Record<string, unknown>) => {
    try { await save.mutateAsync(patch); setDraft(null); toast({ title: "Settings saved" }); } catch (e) { toast({ title: "Couldn't save", description: errMsg(e), variant: "destructive" }); }
  };
  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={v.kill_switch} onCheckedChange={(x) => commit({ kill_switch: x })} /> Kill switch (stop all new work)</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={v.dispatch_paused} onCheckedChange={(x) => commit({ dispatch_paused: x })} /> Pause dispatch</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={v.freshness_enabled} onCheckedChange={(x) => commit({ freshness_enabled: x })} /> Scheduled freshness reviews</label>
        <p className="text-xs text-muted-foreground">Credits used this week: {v.credits_used_week ?? 0} / {v.weekly_credit_limit ?? 250} · Pages used today: {v.pages_used_today} / {v.daily_page_limit}</p>
      </Card>
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {NUM_FIELDS.map(([k, l]) => <label key={k} className="text-sm">{l}<Input type="number" min={0} className="mt-1" value={v[k]} onChange={(e) => set(k, Math.max(0, Number(e.target.value)))} /></label>)}
        </div>
        <Button className="mt-4" disabled={!draft} onClick={() => { const p: Record<string, unknown> = {}; NUM_FIELDS.forEach(([k]) => (p[k] = v[k])); commit(p); }}>Save limits</Button>
      </Card>
      <Card>
        <p className="font-semibold">Markets</p>
        <p className="mt-2 text-sm text-muted-foreground">{markets.map((m) => `${m.name}, ${m.state}`).join(" · ")}</p>
        <p className="mt-1 text-xs text-muted-foreground">Provider status: website extraction not connected.</p>
      </Card>
    </div>
  );
};

const LocalImporter = () => (
  <AdminShell title="Local Importer" description="Stage, review and publish unclaimed Loumilab Local listings. Nothing goes live without approval.">
    <SEOHead title="Local Importer | Loumilab Admin" description="Loumilab Local importer." path="/admin/local-importer" noindex />
    <Tabs defaultValue="overview">
      <TabsList className="flex h-auto flex-wrap justify-start">
        {[["overview", "Overview"], ["add", "Add businesses"], ["review", "Review queue"], ["published", "Published"], ["claims", "Claims & requests"], ["sources", "Sources & jobs"], ["settings", "Settings"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="overview" className="mt-6"><Overview /></TabsContent>
      <TabsContent value="add" className="mt-6"><AddBusinesses /></TabsContent>
      <TabsContent value="review" className="mt-6"><ReviewQueue /></TabsContent>
      <TabsContent value="published" className="mt-6"><Published /></TabsContent>
      <TabsContent value="claims" className="mt-6"><Claims /></TabsContent>
      <TabsContent value="sources" className="mt-6"><Sources /></TabsContent>
      <TabsContent value="settings" className="mt-6"><Settings /></TabsContent>
    </Tabs>
  </AdminShell>
);

export default LocalImporter;
