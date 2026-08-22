import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminHeroProducts, uploadHeroMedia, heroSlugify, type HeroProduct } from "@/lib/hero/queries";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Star, Trash2, Upload } from "lucide-react";

const treatments = [
  { value: "orders-devices", label: "Phone + dashboard (commerce)" },
  { value: "vurtti-dashboard", label: "Laptop dashboard" },
  { value: "browser-stack", label: "Stacked website frames" },
  { value: "app-panels", label: "Floating app panels" },
];

const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <label className="block space-y-1.5">
    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    {children}
    {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
  </label>
);

const Editor = ({
  product,
  onSaved,
  onClose,
}: {
  product: HeroProduct;
  onSaved: () => void;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<HeroProduct>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);

  useEffect(() => setForm(product), [product]);

  const set = <K extends keyof HeroProduct>(key: K, value: HeroProduct[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await supabase
      .from("hero_products")
      .update({ ...rest, slug: heroSlugify(rest.slug || rest.name) })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Showcase product saved" });
    onSaved();
  };

  const upload = async (file: File, target: "desktop" | "mobile") => {
    setUploading(target);
    try {
      const url = await uploadHeroMedia(file);
      set(target === "desktop" ? "desktop_image_url" : "mobile_image_url", url);
      toast({ title: "Image uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Product name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Navigation label" hint="Shown in the hero product switcher.">
          <Input value={form.nav_label} onChange={(e) => set("nav_label", e.target.value)} />
        </Field>
        <Field label="Eyebrow">
          <Input value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
        </Field>
        <Field label="Attribution" hint='e.g. "Built by Loumilab"'>
          <Input value={form.attribution ?? ""} onChange={(e) => set("attribution", e.target.value || null)} />
        </Field>
        <Field label="Headline">
          <Input value={form.headline} onChange={(e) => set("headline", e.target.value)} />
        </Field>
        <Field label="Category">
          <Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value || null)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
        <Field label="Primary CTA label">
          <Input value={form.cta_primary_label ?? ""} onChange={(e) => set("cta_primary_label", e.target.value || null)} />
        </Field>
        <Field label="Primary CTA link">
          <Input value={form.cta_primary_href ?? ""} onChange={(e) => set("cta_primary_href", e.target.value || null)} />
        </Field>
        <Field label="Secondary CTA label">
          <Input value={form.cta_secondary_label ?? ""} onChange={(e) => set("cta_secondary_label", e.target.value || null)} />
        </Field>
        <Field label="Secondary CTA link">
          <Input value={form.cta_secondary_href ?? ""} onChange={(e) => set("cta_secondary_href", e.target.value || null)} />
        </Field>
        <Field label="Accent color (HSL)" hint="Example: 217 91% 50%">
          <Input value={form.accent_hsl} onChange={(e) => set("accent_hsl", e.target.value)} />
        </Field>
        <Field label="Background / mockup treatment">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.treatment}
            onChange={(e) => set("treatment", e.target.value)}
          >
            {treatments.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Layout">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.layout}
            onChange={(e) => set("layout", e.target.value)}
          >
            <option value="split">Copy left · showcase right</option>
            <option value="centered">Centered, large product</option>
          </select>
        </Field>
        <Field label="Optional video URL">
          <Input value={form.media_video_url ?? ""} onChange={(e) => set("media_video_url", e.target.value || null)} />
        </Field>

        {(["desktop", "mobile"] as const).map((target) => {
          const key = target === "desktop" ? "desktop_image_url" : "mobile_image_url";
          return (
            <Field
              key={target}
              label={`${target === "desktop" ? "Desktop" : "Mobile"} screenshot`}
              hint="Leave empty to use the built-in animated mockup."
            >
              <div className="flex items-center gap-2">
                <Input
                  value={(form[key] as string | null) ?? ""}
                  onChange={(e) => set(key, (e.target.value || null) as never)}
                  placeholder="Image URL"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload size={15} /> {uploading === target ? "…" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(file, target);
                      }}
                    />
                  </label>
                </Button>
              </div>
            </Field>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save product"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

const AdminHeroShowcase = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useAdminHeroProducts();
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(() => products.find((p) => p.id === editingId) ?? null, [products, editingId]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["hero"] });

  const createProduct = async () => {
    const stamp = Date.now().toString(36);
    const { data, error } = await supabase
      .from("hero_products")
      .insert({
        slug: `new-product-${stamp}`,
        name: "New product",
        nav_label: "New",
        eyebrow: "NEW PRODUCT",
        headline: "Headline goes here.",
        description: "Describe the product in one or two lines.",
        display_order: products.length + 1,
        is_active: false,
        is_featured: false,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create product", description: error?.message, variant: "destructive" });
      return;
    }
    invalidate();
    setEditingId(data.id);
  };

  const patch = async (id: string, values: Partial<HeroProduct>) => {
    const { error } = await supabase.from("hero_products").update(values).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = products[index + direction];
    const current = products[index];
    if (!target || !current) return;
    await patch(current.id, { display_order: target.display_order });
    await patch(target.id, { display_order: current.display_order });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this product from the hero showcase?")) return;
    const { error } = await supabase.from("hero_products").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    if (editingId === id) setEditingId(null);
    invalidate();
    toast({ title: "Product removed" });
  };

  return (
    <AdminShell title="Hero Showcase" description="Products featured in the homepage showcase.">
      <SEOHead
        title="Loumilab | Technology Studio for Digital Products"
        description="Loumilab designs, builds, launches, and secures digital products and technology businesses. Websites, software, AI automation, and cybersecurity."
        path="/admin/hero"
        noindex
      />
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-xl text-sm text-muted-foreground">
            Active + featured products appear publicly on the homepage hero, in this order.
          </p>
          <Button onClick={createProduct}>
            <Plus size={16} /> Add product
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
          {products.map((p, i) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span
                className="h-8 w-8 shrink-0 rounded-lg border border-border"
                style={{ background: `hsl(${p.accent_hsl} / 0.2)` }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold">{p.name}</p>
                <p className="truncate text-sm text-muted-foreground">{p.headline}</p>
              </div>
              <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
              <Badge variant={p.is_featured ? "default" : "outline"}>
                {p.is_featured ? "Featured" : "Not featured"}
              </Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move down"
                  disabled={i === products.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={p.is_active ? "Deactivate" : "Activate"}
                  onClick={() => patch(p.id, { is_active: !p.is_active })}
                >
                  {p.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={p.is_featured ? "Unfeature" : "Feature"}
                  onClick={() => patch(p.id, { is_featured: !p.is_featured })}
                >
                  <Star size={16} className={p.is_featured ? "fill-current" : undefined} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingId(p.id === editingId ? null : p.id)}>
                  {p.id === editingId ? "Hide" : "Edit"}
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(p.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {editing ? (
          <div className="mt-8">
            <Editor product={editing} onSaved={invalidate} onClose={() => setEditingId(null)} />
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
};

export default AdminHeroShowcase;
