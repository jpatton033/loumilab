import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { LOCAL_CATEGORIES } from "@/lib/orders/local";

export const AFFILIATIONS = [
  { id: "owner", label: "Owner" },
  { id: "manager", label: "Manager or staff" },
  { id: "family", label: "Family member or partner of the owner" },
  { id: "customer", label: "Customer or fan, recommending it" },
  { id: "other", label: "Other" },
] as const;
export type Affiliation = (typeof AFFILIATIONS)[number]["id"];

export const AffiliationPicker = ({ value, onChange, only }: { value: string; onChange: (v: Affiliation) => void; only?: Affiliation[] }) => (
  <fieldset className="grid gap-2">
    <legend className="mb-2 text-sm font-medium">What's your connection to this business?</legend>
    {AFFILIATIONS.filter((a) => !only || only.includes(a.id)).map((a) => (
      <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${value === a.id ? "border-accent bg-accent/5" : "border-border"}`}>
        <input type="radio" name="affiliation" className="accent-[hsl(var(--accent))]" checked={value === a.id} onChange={() => onChange(a.id)} />
        {a.label}
      </label>
    ))}
  </fieldset>
);

const empty = { note: "", name: "", email: "", business: "", category: "", cuisines: "", city: "", region: "", zip: "", area: "", description: "", website: "", instagram: "", facebook: "", phone: "", publicEmail: "", trap: "" };

/** Anonymous submission — lands in the staff review queue, never published directly. */
const VisitorListingForm = ({ affiliation, onAffiliation }: { affiliation: Affiliation | ""; onAffiliation: (a: Affiliation) => void }) => {
  const [f, setF] = useState(empty);
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Affiliation | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const isOwner = affiliation === "owner" || affiliation === "manager";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliation) return toast({ title: "Choose your connection to the business", variant: "destructive" });
    const social: Record<string, string> = {};
    if (f.instagram.trim()) social.instagram = f.instagram.trim();
    if (f.facebook.trim()) social.facebook = f.facebook.trim();
    setBusy(true);
    const { error } = await supabase.rpc("submit_local_listing" as never, {
      _affiliation: affiliation, _affiliation_note: f.note || null, _submitter_name: f.name, _submitter_email: f.email,
      _business_name: f.business, _category: f.category || null,
      _cuisines: f.cuisines.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 6),
      _city: f.city || null, _region: f.region || null, _postal_code: f.zip || null, _service_area: f.area || null,
      _description: f.description || null, _website_url: f.website || null, _social_links: social,
      _offers_pickup: pickup, _offers_delivery: delivery,
      _public_phone: isOwner ? f.phone || null : null, _public_email: isOwner ? f.publicEmail || null : null, _trap: f.trap,
    } as never);
    setBusy(false);
    if (error) return toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
    setDone(affiliation);
  };

  if (done) return (
    <div className="max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
      <CheckCircle2 className="text-accent" />
      <h2 className="mt-4 font-display text-xl font-semibold">Thanks. We'll review it and publish it soon.</h2>
      {(done === "owner" || done === "manager") && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">Want to manage this listing? Sign in to claim it. It's free.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/sign-in?next=/orders/local/join">Sign in to claim</Link></Button>
        </>
      )}
      <Button variant="ghost" className="mt-2 rounded-full" onClick={() => { setDone(null); setF(empty); }}>Add another business</Button>
    </div>
  );

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
      <AffiliationPicker value={affiliation} onChange={onAffiliation} />
      {affiliation === "other" && <Input placeholder="Tell us briefly" maxLength={200} value={f.note} onChange={set("note")} />}
      {isOwner && (
        <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
          Want to add photos and edit your listing anytime? <Link className="font-medium text-foreground underline" to="/sign-in?next=/orders/local/join">Sign in</Link>. Or keep going without an account.
        </p>
      )}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.trap} onChange={set("trap")} />

      <h2 className="mt-2 font-display text-xl font-semibold">About the business</h2>
      <div className="grid gap-2"><Label htmlFor="v-bn">Business name</Label><Input id="v-bn" required maxLength={120} value={f.business} onChange={set("business")} /></div>
      <div className="grid gap-2">
        <Label htmlFor="v-cat">Category</Label>
        <select id="v-cat" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.category} onChange={set("category")}>
          <option value="">Choose…</option>
          {LOCAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="grid gap-2"><Label htmlFor="v-cu">Cuisine or food types <span className="text-muted-foreground">(comma separated)</span></Label><Input id="v-cu" maxLength={200} value={f.cuisines} onChange={set("cuisines")} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 grid gap-2 sm:col-span-1"><Label htmlFor="v-city">City</Label><Input id="v-city" maxLength={80} value={f.city} onChange={set("city")} /></div>
        <div className="grid gap-2"><Label htmlFor="v-st">State</Label><Input id="v-st" maxLength={40} value={f.region} onChange={set("region")} /></div>
        <div className="col-span-2 grid gap-2 sm:col-span-1"><Label htmlFor="v-zip">ZIP</Label><Input id="v-zip" inputMode="numeric" maxLength={5} value={f.zip} onChange={set("zip")} /></div>
      </div>
      <div className="grid gap-2"><Label htmlFor="v-area">Or service area <span className="text-muted-foreground">(e.g. "Serving East Baltimore")</span></Label><Input id="v-area" maxLength={80} value={f.area} onChange={set("area")} /></div>
      <div className="grid gap-2"><Label htmlFor="v-desc">Short description</Label><Textarea id="v-desc" rows={3} maxLength={220} value={f.description} onChange={set("description")} /></div>
      <div className="grid gap-2"><Label htmlFor="v-web">Website</Label><Input id="v-web" type="url" placeholder="https://" maxLength={300} value={f.website} onChange={set("website")} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="v-ig">Instagram link</Label><Input id="v-ig" type="url" placeholder="https://" maxLength={300} value={f.instagram} onChange={set("instagram")} /></div>
        <div className="grid gap-2"><Label htmlFor="v-fb">Facebook link</Label><Input id="v-fb" type="url" placeholder="https://" maxLength={300} value={f.facebook} onChange={set("facebook")} /></div>
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><Checkbox checked={pickup} onCheckedChange={(v) => setPickup(!!v)} /> Pickup</label>
        <label className="flex items-center gap-2"><Checkbox checked={delivery} onCheckedChange={(v) => setDelivery(!!v)} /> Delivery</label>
      </div>
      {isOwner && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="v-ph">Public phone <span className="text-muted-foreground">(optional)</span></Label><Input id="v-ph" maxLength={30} value={f.phone} onChange={set("phone")} /></div>
          <div className="grid gap-2"><Label htmlFor="v-pe">Public email <span className="text-muted-foreground">(optional)</span></Label><Input id="v-pe" type="email" maxLength={160} value={f.publicEmail} onChange={set("publicEmail")} /></div>
        </div>
      )}

      <h2 className="mt-2 font-display text-xl font-semibold">About you</h2>
      <div className="grid gap-2"><Label htmlFor="v-nm">Your name</Label><Input id="v-nm" required maxLength={120} value={f.name} onChange={set("name")} /></div>
      <div className="grid gap-2"><Label htmlFor="v-em">Your email <span className="text-muted-foreground">(private — for Loumilab only)</span></Label><Input id="v-em" type="email" required maxLength={160} value={f.email} onChange={set("email")} /></div>
      <Button type="submit" size="lg" className="rounded-full" disabled={busy}>{busy ? "Sending…" : "Submit for review"}</Button>
      <p className="text-xs text-muted-foreground">We review every listing before it appears on Loumilab Local.</p>
    </form>
  );
};

export default VisitorListingForm;
