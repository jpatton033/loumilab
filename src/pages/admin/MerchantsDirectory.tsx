import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, ExternalLink, Send } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { directoryCsv, relationshipLabel, STAGES, useMerchantDirectory, type DirectoryRow } from "@/lib/admin/directory";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
const ALL = "all";

const copy = (text: string) => {
  void navigator.clipboard.writeText(text);
  toast({ title: "Copied", description: text });
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value || "—"}</span>
  </div>
);

const Detail = ({ r }: { r: DirectoryRow }) => {
  const address = [r.address_line1, r.address_line2, [r.city, r.region, r.postal_code].filter(Boolean).join(" "), r.country].filter(Boolean).join("\n");
  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-3 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Account contact</h3>
          <Badge variant="outline">Private — admins only</Badge>
        </div>
        <Field label="Name" value={r.name} />
        <Field label="Login email" value={r.account_email} />
        <Field label="Registration email" value={r.contact_email} />
        <Field label="Phone" value={r.phone} />
        <Field label="Relationship" value={relationshipLabel(r.relationship)} />
        <div className="grid gap-0.5">
          <span className="text-xs text-muted-foreground">Mailing address</span>
          <span className="whitespace-pre-line text-sm">{address || "—"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signed up" value={fmt(r.signup_at)} />
          <Field label="Last sign-in" value={fmt(r.last_sign_in_at)} />
          <Field label="Email verified" value={r.email_confirmed_at ? fmt(r.email_confirmed_at) : "Not verified"} />
          <Field label="Marketing email" value={r.marketing} />
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Public business contact</h3>
          <Badge variant="secondary">Shown on listing</Badge>
        </div>
        <Field label="Business" value={r.business_name ?? "Business not added"} />
        <Field label="Public phone" value={r.public_phone} />
        <Field label="Public email" value={r.public_email} />
        <Field label="Website" value={r.website_url} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Local listing" value={r.listingStatus} />
          <Field label="Orders store" value={r.storeStatus} />
          <Field label="Plan" value={r.plan_slug} />
          <Field label="Onboarding" value={r.stage} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {r.account_email && (
          <>
            <Button size="sm" variant="outline" onClick={() => copy(r.account_email!)}><Copy className="h-4 w-4" /> Copy email</Button>
            <Button size="sm" variant="outline" asChild><Link to={`/admin/mail?to=${encodeURIComponent(r.account_email)}`}><Send className="h-4 w-4" /> Email in Loumilab Mail</Link></Button>
          </>
        )}
        {r.listing_slug && <Button size="sm" variant="outline" asChild><a href={`/orders/local/${r.listing_slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Local listing</a></Button>}
        {r.store_slug && <Button size="sm" variant="outline" asChild><a href={`/orders/store/${r.store_slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Storefront</a></Button>}
        {r.merchant_id && <Button size="sm" variant="ghost" asChild><Link to="/admin/orders">Edit contact details</Link></Button>}
      </div>
    </div>
  );
};

const AdminMerchantsDirectory = () => {
  const { data: rows = [], isLoading, error } = useMerchantDirectory();
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [verified, setVerified] = useState(ALL);
  const [sort, setSort] = useState<"signup" | "signin">("signup");
  const [open, setOpen] = useState<DirectoryRow | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter((r) => !s || [r.name, r.business_name, r.account_email, r.contact_email, r.phone, r.place].some((v) => v?.toLowerCase().includes(s)))
      .filter((r) => product === ALL || r.product === product)
      .filter((r) => stage === ALL || r.stage === stage)
      .filter((r) => verified === ALL || (verified === "yes") === !!r.email_confirmed_at)
      .sort((a, b) => {
        const k = sort === "signup" ? "signup_at" : "last_sign_in_at";
        return (b[k] ?? "").localeCompare(a[k] ?? "");
      });
  }, [rows, q, product, stage, verified, sort]);

  const exportCsv = () => {
    const blob = new Blob([directoryCsv(filtered)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `loumilab-merchants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminShell
      title="Merchants & Contacts"
      description="Everyone who signed up for Loumilab Local or Orders, including people who haven't added a business yet."
      actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>}
    >
      <SEOHead title="Merchants & Contacts — Admin" description="Admin merchant directory" path="/admin/merchants" noindex />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search name, business, email, phone or city" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All products</SelectItem>
            {["Local", "Orders", "Both", "None yet"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All stages</SelectItem>
            {STAGES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={verified} onValueChange={setVerified}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any email</SelectItem>
            <SelectItem value="yes">Verified</SelectItem>
            <SelectItem value="no">Not verified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as "signup" | "signin")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="signup">Newest sign-ups</SelectItem>
            <SelectItem value="signin">Recent sign-ins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} of {rows.length} people</p>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead><TableHead>Business</TableHead><TableHead>Phone</TableHead>
              <TableHead>City/state</TableHead><TableHead>Product</TableHead><TableHead>Relationship</TableHead>
              <TableHead>Signed up</TableHead><TableHead>Verified</TableHead><TableHead>Onboarding</TableHead>
              <TableHead>Local</TableHead><TableHead>Store</TableHead><TableHead>Marketing</TableHead><TableHead>Last sign-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={13} className="text-muted-foreground">Loading…</TableCell></TableRow>}
            {error && <TableRow><TableCell colSpan={13} className="text-destructive">{(error as Error).message}</TableCell></TableRow>}
            {!isLoading && !error && filtered.length === 0 && <TableRow><TableCell colSpan={13} className="text-muted-foreground">No one matches these filters.</TableCell></TableRow>}
            {filtered.map((r) => (
              <TableRow key={r.user_id} className="cursor-pointer" onClick={() => setOpen(r)}>
                <TableCell><div className="font-medium">{r.name ?? "—"}</div><div className="text-xs text-muted-foreground">{r.account_email}</div></TableCell>
                <TableCell>{r.business_name ?? <span className="text-muted-foreground">Business not added</span>}</TableCell>
                <TableCell>{r.phone ?? "—"}</TableCell>
                <TableCell>{r.place ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{r.product}</Badge></TableCell>
                <TableCell>{relationshipLabel(r.relationship)}</TableCell>
                <TableCell className="whitespace-nowrap">{fmt(r.signup_at)}</TableCell>
                <TableCell>{r.email_confirmed_at ? "Yes" : <span className="text-destructive">No</span>}</TableCell>
                <TableCell className="whitespace-nowrap">{r.stage}</TableCell>
                <TableCell>{r.listingStatus}</TableCell>
                <TableCell className="capitalize">{r.storeStatus}</TableCell>
                <TableCell className="whitespace-nowrap">{r.marketing}</TableCell>
                <TableCell className="whitespace-nowrap">{fmt(r.last_sign_in_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{open?.name ?? open?.account_email}</SheetTitle></SheetHeader>
          {open && <Detail r={open} />}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
};

export default AdminMerchantsDirectory;
