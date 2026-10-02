import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { uploadMerchantImage } from "@/lib/orders/media";
import { LOCAL_CATEGORIES, useLocalProfile, useSaveLocalProfile, type LocalProfile } from "@/lib/orders/local";
import LocalBusinessCard from "./LocalBusinessCard";

/** Merchant control for Loumilab Local. Everything defaults from the existing store. */
const LocalProfileCard = ({ merchantId }: { merchantId: string }) => {
  const { data: profile, isLoading } = useLocalProfile(merchantId);
  const save = useSaveLocalProfile();
  const { data: store } = useQuery({
    queryKey: ["local-store-source", merchantId],
    queryFn: async () => {
      const [{ data: s }, { data: m }] = await Promise.all([
        supabase.from("merchant_storefronts").select("name,slug,logo_url,hero_image_url,description,location,pickup_enabled,delivery_enabled,is_published,status").eq("merchant_id", merchantId).maybeSingle(),
        supabase.from("merchants").select("city,region,postal_code,accepting_orders").eq("id", merchantId).maybeSingle(),
      ]);
      return { s, m };
    },
  });

  const [form, setForm] = useState<LocalProfile>({
    merchant_id: merchantId, is_listed: false, category: null, cuisines: [], tagline: "", service_area_label: "", featured_image_url: null, postal_code: "",
  });
  const [cuisineText, setCuisineText] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ ...profile, tagline: profile.tagline ?? "", service_area_label: profile.service_area_label ?? "", postal_code: profile.postal_code ?? "" });
      setCuisineText((profile.cuisines ?? []).join(", "));
    } else if (store?.m?.postal_code) {
      setForm((f) => ({ ...f, postal_code: f.postal_code || (store.m!.postal_code ?? "").slice(0, 5) }));
    }
  }, [profile, store?.m?.postal_code]);

  const s = store?.s;
  const m = store?.m;
  const set = <K extends keyof LocalProfile>(k: K, v: LocalProfile[K]) => setForm((f) => ({ ...f, [k]: v }));

  const persist = async (next: LocalProfile) => {
    const zip = (next.postal_code ?? "").trim();
    if (zip && !/^\d{5}$/.test(zip)) {
      toast({ title: "Use a 5-digit ZIP code", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync({
        ...next,
        cuisines: cuisineText.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 6),
        tagline: next.tagline?.trim() || null,
        service_area_label: next.service_area_label?.trim() || null,
        postal_code: zip || null,
      });
      toast({ title: next.is_listed ? "Your Loumilab Local listing is saved" : "Saved — you're hidden from Loumilab Local" });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    }
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadMerchantImage(merchantId, "hero", file);
      set("featured_image_url", url);
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !s) return null;

  const fallbackArea = [m?.city, m?.region].filter(Boolean).join(", ") || s.location;
  const preview = {
    slug: s.slug, name: s.name, logo_url: s.logo_url,
    image_url: form.featured_image_url || s.hero_image_url,
    description: form.tagline || s.description,
    category: form.category,
    cuisines: cuisineText.split(",").map((c) => c.trim()).filter(Boolean),
    area: form.service_area_label || fallbackArea,
    pickup: s.pickup_enabled, delivery: s.delivery_enabled,
    accepting: !!m?.accepting_orders && s.status === "published",
    is_featured: false, distance_miles: null,
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold">Appear on Loumilab Local</h3>
          <p className="mt-1 text-sm text-muted-foreground">Allow customers to discover your business through Loumilab Local.</p>
        </div>
        <Switch
          checked={form.is_listed}
          aria-label="Appear on Loumilab Local"
          onCheckedChange={(v) => { const next = { ...form, is_listed: v }; setForm(next); persist(next); }}
        />
      </div>
      {form.is_listed && !s.is_published && (
        <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">You'll appear once your store is published.</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
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
            <Label htmlFor="local-tagline">Short description <span className="text-muted-foreground">(optional — defaults to your store description)</span></Label>
            <Textarea id="local-tagline" maxLength={160} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder={s.description ?? ""} />
            <p className="text-xs text-muted-foreground">{(form.tagline ?? "").length}/160</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="local-area">Service area shown</Label>
              <Input id="local-area" maxLength={80} value={form.service_area_label ?? ""} onChange={(e) => set("service_area_label", e.target.value)} placeholder={fallbackArea ?? "e.g. Serving East Baltimore"} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="local-zip">ZIP code for distance</Label>
              <Input id="local-zip" inputMode="numeric" maxLength={5} value={form.postal_code ?? ""} onChange={(e) => set("postal_code", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your street address is never shown. Distance is measured from the centre of your ZIP code. Pickup details stay private until checkout.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="local-image">Featured image <span className="text-muted-foreground">(optional — defaults to your store banner)</span></Label>
            <Input id="local-image" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(e) => onImage(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-muted-foreground">
            Pickup and delivery come from your store settings. <Link to="/orders/local" className="underline underline-offset-4">See Loumilab Local</Link>
          </p>
          <div>
            <Button className="rounded-full" onClick={() => persist(form)} disabled={save.isPending || uploading}>
              {save.isPending ? "Saving…" : "Save Local listing"}
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
          <LocalBusinessCard business={preview} preview />
        </div>
      </div>
    </div>
  );
};

export default LocalProfileCard;
