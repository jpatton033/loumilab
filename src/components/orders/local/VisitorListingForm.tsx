import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Heart, Store, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { LOCAL_CATEGORIES } from "@/lib/orders/local";

export type Relationship = "owner" | "manager" | "recommend";

const OPTIONS = [
  { id: "owner", icon: Store, title: "I own this business", text: "Create or claim your free business listing." },
  { id: "manager", icon: Users, title: "I help manage this business", text: "I'm a manager, team member, or authorized representative." },
  { id: "recommend", icon: Heart, title: "I'd like to recommend this business", text: "Help others discover a local food business." },
] as const;

export const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
    <ArrowLeft size={14} /> Back
  </button>
);

const cardCls = "max-w-xl rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8";
const choiceCls = "flex w-full items-start gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** "What's your connection to this business?" — owner / authorized manager / recommend. */
export const RelationshipStep = ({ onDone, bare }: { onDone: (r: Relationship) => void; bare?: boolean }) => {
  const [askAuth, setAskAuth] = useState(false);
  const body = askAuth ? (
    <div className="grid gap-4">
      <BackLink onClick={() => setAskAuth(false)} />
      <h2 className="font-display text-xl font-semibold">Are you authorized to manage this business's listing?</h2>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="rounded-full" onClick={() => onDone("manager")}>Yes</Button>
        <Button size="lg" variant="outline" className="rounded-full" onClick={() => { toast({ title: "No problem — you can still recommend it." }); onDone("recommend"); }}>No</Button>
      </div>
    </div>
  ) : (
    <div className="grid gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">What's your connection to this business?</h2>
        <p className="mt-1 text-sm text-muted-foreground">This helps us guide you to the right next step.</p>
      </div>
      {OPTIONS.map(({ id, icon: Icon, title, text }) => (
        <button key={id} type="button" className={choiceCls} onClick={() => (id === "manager" ? setAskAuth(true) : onDone(id))}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-accent"><Icon size={18} /></span>
          <span><span className="block font-semibold">{title}</span><span className="mt-0.5 block text-sm text-muted-foreground">{text}</span></span>
        </button>
      ))}
    </div>
  );
  return bare ? body : <div className={cardCls}>{body}</div>;
};

const submit = (p: Record<string, unknown>) => supabase.rpc("submit_local_listing" as never, {
  _affiliation_note: null, _cuisines: [], _city: null, _region: null, _postal_code: null, _service_area: null,
  _description: null, _social_links: {}, _offers_pickup: null, _offers_delivery: null, _public_phone: null, _public_email: null, _trap: "", ...p,
} as never);

/** Lightweight recommendation — goes to the review queue. */
export const SuggestBusinessForm = ({ onBack }: { onBack: () => void }) => {
  const [f, setF] = useState({ business: "", area: "", link: "", category: "", note: "", name: "", email: "", trap: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const link = f.link.trim() && !/^https?:\/\//i.test(f.link.trim()) ? `https://${f.link.trim()}` : f.link.trim();
    const { error } = await submit({
      _affiliation: "customer", _affiliation_note: f.note || null, _submitter_name: f.name || "Visitor", _submitter_email: f.email,
      _business_name: f.business, _category: f.category || null, _service_area: f.area, _website_url: link || null, _trap: f.trap,
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
    setDone(true);
  };
  if (done) return (
    <div className={cardCls}>
      <CheckCircle2 className="text-accent" />
      <h2 className="mt-4 font-display text-xl font-semibold">Thanks for the recommendation!</h2>
      <p className="mt-2 text-sm text-muted-foreground">We'll take a look and add it to Loumilab Local if it's a fit.</p>
      <Button variant="ghost" className="mt-4 rounded-full" onClick={() => { setDone(false); setF({ ...f, business: "", area: "", link: "", category: "", note: "" }); }}>Suggest another</Button>
    </div>
  );
  return (
    <form onSubmit={go} className={`grid gap-5 ${cardCls}`}>
      <BackLink onClick={onBack} />
      <h2 className="font-display text-xl font-semibold">Suggest a Business</h2>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.trap} onChange={set("trap")} />
      <div className="grid gap-2"><Label htmlFor="s-bn">Business name</Label><Input id="s-bn" required maxLength={120} value={f.business} onChange={set("business")} /></div>
      <div className="grid gap-2"><Label htmlFor="s-ar">City/state or service area</Label><Input id="s-ar" required maxLength={80} placeholder="e.g. Baltimore, MD" value={f.area} onChange={set("area")} /></div>
      <div className="grid gap-2"><Label htmlFor="s-ln">Website or public social profile</Label><Input id="s-ln" maxLength={300} placeholder="https://" value={f.link} onChange={set("link")} /></div>
      <div className="grid gap-2">
        <Label htmlFor="s-cat">Category <span className="text-muted-foreground">(if known)</span></Label>
        <select id="s-cat" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.category} onChange={set("category")}>
          <option value="">Not sure</option>
          {LOCAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="grid gap-2"><Label htmlFor="s-nt">Note <span className="text-muted-foreground">(optional)</span></Label><Textarea id="s-nt" rows={3} maxLength={200} value={f.note} onChange={set("note")} /></div>
      <div className="grid gap-2"><Label htmlFor="s-em">Your email <span className="text-muted-foreground">(private — for Loumilab only)</span></Label><Input id="s-em" type="email" required maxLength={160} value={f.email} onChange={set("email")} /></div>
      <Button type="submit" size="lg" className="rounded-full" disabled={busy}>{busy ? "Sending…" : "Send suggestion"}</Button>
    </form>
  );
};

const empty = { name: "", email: "", business: "", category: "", cuisines: "", city: "", region: "", zip: "", area: "", description: "", website: "", instagram: "", facebook: "", phone: "", publicEmail: "", trap: "" };

/** Owner / authorized manager submission without an account — lands in the review queue. */
const VisitorListingForm = ({ affiliation, onBack }: { affiliation: "owner" | "manager"; onBack: () => void }) => {
  const [f, setF] = useState(empty);
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    const social: Record<string, string> = {};
    if (f.instagram.trim()) social.instagram = f.instagram.trim();
    if (f.facebook.trim()) social.facebook = f.facebook.trim();
    setBusy(true);
    const { error } = await submit({
      _affiliation: affiliation, _submitter_name: f.name, _submitter_email: f.email,
      _business_name: f.business, _category: f.category || null,
      _cuisines: f.cuisines.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 6),
      _city: f.city || null, _region: f.region || null, _postal_code: f.zip || null, _service_area: f.area || null,
      _description: f.description || null, _website_url: f.website || null, _social_links: social,
      _offers_pickup: pickup, _offers_delivery: delivery, _public_phone: f.phone || null, _public_email: f.publicEmail || null, _trap: f.trap,
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
    setDone(true);
  };

  if (done) return (
    <div className={cardCls}>
      <CheckCircle2 className="text-accent" />
      <h2 className="mt-4 font-display text-xl font-semibold">Thanks. We'll review it and publish it soon.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Want to manage this listing? Sign in to claim it. It's free.</p>
      <Button asChild className="mt-6 rounded-full"><Link to="/sign-in?next=/orders/local/join">Sign in to claim</Link></Button>
    </div>
  );

  return (
    <form onSubmit={go} className={`grid gap-5 ${cardCls}`}>
      <BackLink onClick={onBack} />
      <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
        Want to add photos and edit your listing anytime? <Link className="font-medium text-foreground underline" to="/sign-in?next=/orders/local/join">Sign in</Link>. Or keep going without an account.
      </p>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.trap} onChange={set("trap")} />
      <h2 className="font-display text-xl font-semibold">About the business</h2>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="v-ph">Public phone <span className="text-muted-foreground">(optional)</span></Label><Input id="v-ph" maxLength={30} value={f.phone} onChange={set("phone")} /></div>
        <div className="grid gap-2"><Label htmlFor="v-pe">Public email <span className="text-muted-foreground">(optional)</span></Label><Input id="v-pe" type="email" maxLength={160} value={f.publicEmail} onChange={set("publicEmail")} /></div>
      </div>
      <h2 className="mt-2 font-display text-xl font-semibold">About you</h2>
      <div className="grid gap-2"><Label htmlFor="v-nm">Your name</Label><Input id="v-nm" required maxLength={120} value={f.name} onChange={set("name")} /></div>
      <div className="grid gap-2"><Label htmlFor="v-em">Your email <span className="text-muted-foreground">(private — for Loumilab only)</span></Label><Input id="v-em" type="email" required maxLength={160} value={f.email} onChange={set("email")} /></div>
      <Button type="submit" size="lg" className="rounded-full" disabled={busy}>{busy ? "Sending…" : "Submit for review"}</Button>
      <p className="text-xs text-muted-foreground">We review every listing before it appears on Loumilab Local.</p>
    </form>
  );
};

export default VisitorListingForm;
