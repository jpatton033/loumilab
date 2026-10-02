import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { uploadMerchantImage } from "@/lib/orders/media";
import {
  LOCAL_CATEGORIES, SOCIAL_KEYS, SOCIAL_LABELS, useLocalProfile, useSaveLocalProfile, type LocalProfile,
} from "@/lib/orders/local";
import LocalBusinessCard from "./LocalBusinessCard";

const blank = (merchantId: string): LocalProfile => ({
  merchant_id: merchantId, is_listed: false, category: null, cuisines: [], tagline: "", service_area_label: "",
  featured_image_url: null, postal_code: "", display_name: "", logo_url: null, gallery_urls: [],
  offers_pickup: null, offers_delivery: null, website_url: "", social_links: {}, public_phone: "", public_email: "",
  city: "", region: "",
});

const urlOk = (u?: string | null) => !u || /^https?:\/\/\S+\.\S+/i.test(u.trim());
const withScheme = (u?: string | null) => {
  const t = (u ?? "").trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

/**
 * One listing form for every merchant. Orders merchants get defaults from their
 * store; Local-only merchants fill everything in here. No payments required.
 */
const LocalProfileCard = ({ merchantId, standalone }: { merchantId: string; standalone?: boolean }) => {
  const { data: profile, isLoading } = useLocalProfile(merchantId);
  const save = useSaveLocalProfile();
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["local-store-source", merchantId],
    queryFn: async () => {
      const [{ data: s }, { data: m }] = await Promise.all([
        supabase.from("merchant_storefronts").select("name,slug,logo_url,hero_image_url,description,location,pickup_enabled,delivery_enabled,is_published,status").eq("merchant_id", merchantId).maybeSingle(),
        supabase.from("merchants").select("business_name,contact_email,phone,city,region,postal_code,accepting_orders").eq("id", merchantId).maybeSingle(),
      ]);
      return { s, m };
    },
  });

  const [form, setForm] = useState<LocalProfile>(blank(merchantId));
  const [cuisineText, setCuisineText] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const m = store?.m;
    if (profile) {
      setForm({
        ...blank(merchantId), ...profile,
        tagline: profile.tagline ?? "", service_area_label: profile.service_area_label ?? "", postal_code: profile.postal_code ?? "",
        display_name: profile.display_name ?? "", website_url: profile.website_url ?? "", public_phone: profile.public_phone ?? "",
        public_email: profile.public_email ?? "", city: profile.city ?? "", region: profile.region ?? "",
        social_links: profile.social_links ?? {}, gallery_urls: profile.gallery_urls ?? [],
      });
      setCuisineText((profile.cuisines ?? []).join(", "));
    } else if (m) {
      setForm((f) => ({
        ...f,
        postal_code: f.postal_code || (m.postal_code ?? "").slice(0, 5),
        city: f.city || (m.city ?? ""),
        region: f.region || (m.region ?? ""),
      }));
    }
  }, [profile, store?.m, merchantId]);

  const s = store?.s;
  const m = store?.m;
  const hasStore = !!s;
  const set = <K extends keyof LocalProfile>(k: K, v: LocalProfile[K]) => setForm((f) => ({ ...f, [k]: v }));

  const persist = async (next: LocalProfile) => {
    const zip = (next.postal_code ?? "").trim();
    if (zip && !/^\d{5}$/.test(zip)) return toast({ title: "Use a 5-digit ZIP code", variant: "destructive" });
    if (next.is_listed && !hasStore && !zip && !(next.city ?? "").trim() && !(next.service_area_label ?? "").trim())
      return toast({ title: "Add your city, ZIP or service area so customers can find you", variant: "destructive" });
    if (next.is_listed && !next.category) return toast({ title: "Pick a category", variant: "destructive" });
    const website = withScheme(next.website_url);
    const socials = Object.fromEntries(
      SOCIAL_KEYS.map((k) => [k, withScheme(next.social_links?.[k])]).filter(([, v]) => v),
    );
    if (!urlOk(website) || !Object.values(socials).every((v) => urlOk(v as string)))
      return toast({ title: "Check your website and social links", variant: "destructive" });
    const email = (next.public_email ?? "").trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast({ title: "Check the public email", variant: "destructive" });
    try {
      await save.mutateAsync({
        ...next,
        cuisines: cuisineText.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 6),
        tagline: next.tagline?.trim() || null,
        service_area_label: next.service_area_label?.trim() || null,
        postal_code: zip || null,
        display_name: next.display_name?.trim() || null,
        website_url: website,
        social_links: socials,
        public_phone: next.public_phone?.trim() || null,
        public_email: email || null,
        city: next.city?.trim() || null,
        region: next.region?.trim() || null,
        gallery_urls: (next.gallery_urls ?? []).slice(0, 6),
      });
      toast({ title: next.is_listed ? "Your Loumilab Local listing is live" : "Saved — your listing is hidden" });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    }
  };

  const upload = async (key: "logo" | "hero" | "gallery", file?: File) => {
    if (!file) return;
    setUploading(key);
    try {
      const { url } = await uploadMerchantImage(merchantId, key === "gallery" ? "item" : key, file);
      if (key === "logo") set("logo_url", url);
      else if (key === "hero") set("featured_image_url", url);
      else setForm((f) => ({ ...f, gallery_urls: [...(f.gallery_urls ?? []), url].slice(0, 6) }));
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  if (isLoading || storeLoading || !m) return null;

  const fallbackArea = [form.city || m.city, form.region || m.region].filter(Boolean).join(", ") || s?.location || null;
  const pickup = form.offers_pickup ?? s?.pickup_enabled ?? false;
  const delivery = form.offers_delivery ?? s?.delivery_enabled ?? false;
  const preview = {
    slug: profile?.slug ?? "preview", store_slug: s?.is_published ? s.slug : null,
    name: form.display_name || s?.name || m.business_name,
    logo_url: form.logo_url || s?.logo_url || null,
    image_url: form.featured_image_url || form.gallery_urls?.[0] || s?.hero_image_url || null,
    description: form.tagline || s?.description || null,
    category: form.category,
    cuisines: cuisineText.split(",").map((c) => c.trim()).filter(Boolean),
    area: form.service_area_label || fallbackArea,
    pickup, delivery,
    accepting: !!m.accepting_orders && s?.status === "published",
    is_featured: false, distance_miles: null,
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Loumilab Local · Free</p>
          <h3 className="mt-1 font-display text-xl font-semibold">List my business on Loumilab Local</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Let customers nearby discover your business.{hasStore && " We've filled this in from your store — adjust anything for Local."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Switch
            checked={form.is_listed}
            aria-label="Show my listing on Loumilab Local"
            onCheckedChange={(v) => { const next = { ...form, is_listed: v }; setForm(next); persist(next); }}
          />
          <span className="text-xs text-muted-foreground">{form.is_listed ? "Listed" : "Hidden"}</span>
        </div>
      </div>
      {form.is_listed && hasStore && !s!.is_published && (
        <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">You'll appear once your store is published.</p>
      )}
      {form.is_listed && profile?.slug && (!hasStore || s!.is_published) && (
        <p className="mt-4 text-sm">
          <Link to={`/orders/local/${profile.slug}`} className="font-medium underline underline-offset-4">View your Local listing</Link>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="local-name">Business name</Label>
            <Input id="local-name" maxLength={80} value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} placeholder={s?.name || m.business_name} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {LOCAL_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => set("category", form.category === c.id ? null : c.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${form.category === c.id ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="local-cuisines">Cuisines or food types</Label>
            <Input id="local-cuisines" value={cuisineText} onChange={(e) => setCuisineText(e.target.value)} placeholder="Soul food, Seafood, Desserts" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="local-tagline">Short description</Label>
            <Textarea id="local-tagline" maxLength={160} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder={s?.description ?? "What you make and what makes it special"} />
            <p className="text-xs text-muted-foreground">{(form.tagline ?? "").length}/160</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="local-city">City</Label>
              <Input id="local-city" maxLength={80} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local-region">State</Label>
              <Input id="local-region" maxLength={40} value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="MD" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local-zip">ZIP</Label>
              <Input id="local-zip" inputMode="numeric" maxLength={5} value={form.postal_code ?? ""} onChange={(e) => set("postal_code", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="local-area">Service area shown <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="local-area" maxLength={80} value={form.service_area_label ?? ""} onChange={(e) => set("service_area_label", e.target.value)} placeholder="e.g. Serving East Baltimore" />
            <p className="text-xs text-muted-foreground">Your street address is never shown. Distance is measured from the centre of your ZIP code.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={pickup} onCheckedChange={(v) => set("offers_pickup", v)} /> Pickup</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={delivery} onCheckedChange={(v) => set("offers_delivery", v)} /> Delivery</label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="local-logo">Logo</Label>
              <Input id="local-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploading} onChange={(e) => upload("logo", e.target.files?.[0])} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local-image">Main image</Label>
              <Input id="local-image" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploading} onChange={(e) => upload("hero", e.target.files?.[0])} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="local-gallery">Food photos <span className="text-muted-foreground">(up to 6)</span></Label>
            {(form.gallery_urls ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.gallery_urls!.map((u) => (
                  <div key={u} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
                    <img src={u} alt="" className="h-full w-full object-cover" />
                    <button type="button" aria-label="Remove photo" onClick={() => set("gallery_urls", form.gallery_urls!.filter((x) => x !== u))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {(form.gallery_urls ?? []).length < 6 && (
              <Input id="local-gallery" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploading} onChange={(e) => { upload("gallery", e.target.files?.[0]); e.target.value = ""; }} />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="local-web">Website <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="local-web" value={form.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)} placeholder="yourbusiness.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_KEYS.map((k) => (
              <div key={k} className="grid gap-2">
                <Label htmlFor={`local-${k}`}>{SOCIAL_LABELS[k]}</Label>
                <Input id={`local-${k}`} value={form.social_links?.[k] ?? ""} onChange={(e) => set("social_links", { ...form.social_links, [k]: e.target.value })} placeholder={`${k === "x" ? "x" : k}.com/yourbusiness`} />
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="local-phone">Public phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="local-phone" type="tel" maxLength={30} value={form.public_phone ?? ""} onChange={(e) => set("public_phone", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local-email">Public email <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="local-email" type="email" maxLength={160} value={form.public_email ?? ""} onChange={(e) => set("public_email", e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Only the contact details you enter here are shown publicly.</p>

          <div className="flex flex-wrap gap-3">
            <Button className="rounded-full" onClick={() => persist({ ...form, is_listed: standalone && !profile ? true : form.is_listed })} disabled={save.isPending || !!uploading}>
              {save.isPending ? "Saving…" : standalone && !profile ? "Publish my listing" : "Save Local listing"}
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
          <LocalBusinessCard business={preview} preview />
        </div>
      </div>

      {!hasStore && profile && (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-secondary p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Want customers to order directly from your Local listing?</p>
            <p className="mt-1 text-sm text-muted-foreground">Set up Loumilab Orders to accept and manage online orders. We'll reuse what you've entered here.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/orders/get-started">Set Up Online Ordering <ArrowRight size={15} /></Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocalProfileCard;