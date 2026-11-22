import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Eye, EyeOff, GripVertical, History, Lock, Monitor, Palette, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyMerchant } from "@/lib/orders/commerce";
import { usePublicPlans } from "@/lib/orders/plans";
import { resolveEntitlements } from "@/lib/orders/entitlements";
import { formatCents } from "@/lib/orders/storefront";
import { customerHref } from "@/lib/siteAddress";
import { builderCaps } from "@/lib/orders/builder/gating";
import { LOCKED_SECTIONS, SECTION_LABELS, SECTION_TYPES, validateDesign, type Design, type Section, type SectionType } from "@/lib/orders/builder/schema";
import { defaultSection, legacyToDesign } from "@/lib/orders/builder/templates";
import { applyStoreDetails, takePendingDesign } from "@/lib/orders/builder/presets";
import { clearPendingTemplate, getPendingTemplate, saveDraft, useDesignVersions, usePublishDesign, useRestoreDesign, useStorefrontDesign } from "@/lib/orders/builder/queries";
import SiteRenderer, { siteCardStyle } from "@/components/orders/builder/SiteRenderer";
import { SectionSettings, ThemeSettings } from "@/components/orders/builder/SettingsPanel";

/** Key-order-independent JSON, since the database reorders object keys. */
const stableJson = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(stableJson).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v as object).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

type Viewport = "desktop" | "tablet" | "mobile";
const WIDTH: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

interface BuilderStore {
  id: string; merchant_id: string; slug: string; name: string; description: string | null; logo_url: string | null;
  hero_image_url: string | null; hours: string | null; pickup_info: string | null; location: string | null; monogram: string | null;
}

const useBuilderStore = (merchantId?: string) =>
  useQuery({
    queryKey: ["orders", "builder-store", merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data: store, error } = await supabase.from("merchant_storefronts")
        .select("id, merchant_id, slug, name, description, logo_url, hero_image_url, hours, pickup_info, location, monogram")
        .eq("merchant_id", merchantId as string).order("created_at").limit(1).maybeSingle();
      if (error) throw error;
      if (!store) return null;
      const { data: products } = await supabase.from("merchant_products").select("id, name, description, price_cents, image_url")
        .eq("storefront_id", store.id).eq("is_active", true).order("display_order").limit(24);
      return { store: store as BuilderStore, products: products ?? [] };
    },
  });

const SortRow = ({ s, selected, caps, onSelect, onToggle, onDelete }: { s: Section; selected: boolean; caps: { arrange: boolean }; onSelect: () => void; onToggle: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id, disabled: !caps.arrange });
  const locked = LOCKED_SECTIONS.includes(s.type);
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-xl border px-2 ${selected ? "border-foreground bg-secondary" : "border-border"} ${isDragging ? "z-10 shadow-lg" : ""}`}>
      {caps.arrange && <button type="button" aria-label={`Move ${SECTION_LABELS[s.type]}`} className="cursor-grab touch-none p-2 text-muted-foreground" {...attributes} {...listeners}><GripVertical size={16} /></button>}
      <button type="button" onClick={onSelect} className={`min-h-11 flex-1 text-left text-sm ${s.hidden ? "text-muted-foreground line-through" : ""}`}>{SECTION_LABELS[s.type]}</button>
      {locked ? <span className="p-2 text-muted-foreground" title="Customers order here, so this section always stays"><Lock size={14} /></span> : (
        <>
          <button type="button" aria-label={s.hidden ? "Show section" : "Hide section"} onClick={onToggle} className="p-2 text-muted-foreground hover:text-foreground">{s.hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          {caps.arrange && <button type="button" aria-label="Remove section" onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>}
        </>
      )}
    </li>
  );
};

const WebsiteBuilder = () => {
  const { data: merchant, isLoading: merchantLoading } = useMyMerchant();
  const { data: plans } = usePublicPlans();
  const plan = plans?.find((p) => p.slug === (merchant?.plan_slug ?? "launch")) ?? null;
  const caps = builderCaps(resolveEntitlements(plan)["customization.level"]);
  const { data: storeData, isLoading: storeLoading } = useBuilderStore(merchant?.id);
  const store = storeData?.store;
  const { data: row, isLoading: rowLoading, refetch } = useStorefrontDesign(store?.id);
  const { data: versions, refetch: refetchVersions } = useDesignVersions(store?.id);
  const publish = usePublishDesign(store?.id);
  const restore = useRestoreDesign(store?.id);

  const [design, setDesign] = useState<Design | null>(null);
  const [past, setPast] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [mobileTab, setMobileTab] = useState<"sections" | "edit" | "preview">("preview");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const exists = useRef(false);

  // Load the saved draft, or build a starting design from the store's current details.
  useEffect(() => {
    if (design || !store || rowLoading) return;
    exists.current = !!row;
    const parsed = row ? validateDesign(row.draft) : null;
    if (parsed?.success) { setDesign(parsed.data); return; }
    const pending = getPendingTemplate();
    const base = legacyToDesign({ ...store, industry_slug: merchant?.industry_slug }, pending);
    // A look built on the public preview carries over; the store's own name, text and photo fill in.
    const fromPreview = takePendingDesign();
    setDesign(fromPreview ? applyStoreDetails(fromPreview, base) : base);
    clearPendingTemplate();
    setSaveState("unsaved");
  }, [store, row, rowLoading, design, merchant?.industry_slug]);

  const commit = useCallback((next: Design) => {
    setDesign((cur) => { if (cur) setPast((p) => [...p.slice(-49), cur]); return next; });
    setFuture([]);
    setSaveState("unsaved");
  }, []);

  // Autosave the draft shortly after each change.
  useEffect(() => {
    if (!design || !store || saveState !== "unsaved") return;
    const t = window.setTimeout(async () => {
      const v = validateDesign(design);
      if (!v.success) { setSaveState("error"); return; }
      setSaveState("saving");
      try { await saveDraft(store.id, store.merchant_id, design, exists.current); exists.current = true; setSaveState("saved"); }
      catch { setSaveState("error"); }
    }, 1200);
    return () => window.clearTimeout(t);
  }, [design, store, saveState]);

  const undo = () => { if (!past.length || !design) return; setFuture((f) => [design, ...f]); setDesign(past[past.length - 1]); setPast((p) => p.slice(0, -1)); setSaveState("unsaved"); };
  const redo = () => { if (!future.length || !design) return; setPast((p) => [...p, design]); setDesign(future[0]); setFuture((f) => f.slice(1)); setSaveState("unsaved"); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select")) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!design || !e.over || e.active.id === e.over.id) return;
    const from = design.sections.findIndex((s) => s.id === e.active.id);
    const to = design.sections.findIndex((s) => s.id === e.over!.id);
    commit({ ...design, sections: arrayMove(design.sections, from, to) });
  };

  const updateSection = (s: Section) => design && commit({ ...design, sections: design.sections.map((x) => (x.id === s.id ? s : x)) });
  const addSection = (type: SectionType) => {
    if (!design) return;
    const s = defaultSection(type);
    const footerAt = design.sections.findIndex((x) => x.type === "footer");
    const sections = [...design.sections];
    sections.splice(footerAt === -1 ? sections.length : footerAt, 0, s);
    commit({ ...design, sections });
    setSelected(s.id);
    setMobileTab("edit");
  };

  const onPublish = async () => {
    if (!design) return;
    const v = validateDesign(design);
    if (!v.success) { toast.error(v.error.issues[0]?.message ?? "Something in your design needs attention."); return; }
    try {
      if (saveState !== "saved") { await saveDraft(store!.id, store!.merchant_id, design, exists.current); exists.current = true; setSaveState("saved"); }
      const n = await publish.mutateAsync();
      await Promise.all([refetch(), refetchVersions()]);
      toast.success(`Website published · version ${n}`, { description: "Customers now see your new design. Orders in progress weren't affected." });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't publish"); }
  };

  const onRestore = async (version: number) => {
    try {
      await restore.mutateAsync(version);
      const { data } = await refetch(); await refetchVersions();
      const parsed = validateDesign(data?.draft);
      if (parsed.success) { setDesign(parsed.data); setPast([]); setFuture([]); setSaveState("saved"); }
      toast.success(`Restored version ${version}`, { description: "It's live again." });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't restore"); }
  };

  const products = storeData?.products ?? [];
  const renderProducts = useCallback(({ featured }: { featured?: number }) => {
    const list = featured ? products.slice(0, featured) : products;
    if (!list.length) return <p className="text-sm opacity-60">Your products appear here. Add them from the dashboard.</p>;
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className="overflow-hidden" style={siteCardStyle}>
            {p.image_url && <img src={p.image_url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />}
            <div className="p-4"><p className="font-semibold">{p.name}</p><p className="mt-1 text-sm opacity-70">{formatCents(p.price_cents)}</p></div>
          </div>
        ))}
      </div>
    );
  }, [products]);

  const selectedSection = design?.sections.find((s) => s.id === selected) ?? null;
  const addable = useMemo(() => SECTION_TYPES.filter((t) => !LOCKED_SECTIONS.includes(t) && (!["header", "footer"].includes(t) || !design?.sections.some((s) => s.type === t))), [design]);

  if (merchantLoading || storeLoading || (store && !design)) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Opening your website…</div>;
  }
  if (!merchant || !store || !design) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <SEOHead title="Website Builder — Loumilab Orders" description="Design your Loumilab Orders website." path="/orders/dashboard/website" noindex />
        <h1 className="font-hero text-3xl font-semibold">{merchant ? "Create your store first." : "Sign in to design your website."}</h1>
        <p className="max-w-md text-muted-foreground">The website builder opens once you have a Loumilab Orders store.</p>
        <Button asChild className="rounded-full"><Link to={merchant ? "/orders/get-started" : "/orders/sign-in?next=/orders/dashboard/website"}>{merchant ? "Set up your store" : "Sign in"}</Link></Button>
      </div>
    );
  }

  const siteInfo = { name: store.name, logoUrl: store.logo_url, monogram: store.monogram ?? undefined, hours: store.hours ?? "", pickupInfo: store.pickup_info ?? "", location: store.location ?? "" };
  const statusText = { saved: row?.published_version ? "Draft saved" : "Draft saved · not live yet", saving: "Saving…", unsaved: "Unsaved changes", error: "Couldn't save — check highlighted fields" }[saveState];
  const draftDiffers = stableJson(row?.published ?? null) !== stableJson(design);

  const library = (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your sections</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={design.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {design.sections.map((s) => (
                <SortRow key={s.id} s={s} caps={caps} selected={selected === s.id}
                  onSelect={() => { setSelected(s.id); setMobileTab("edit"); }}
                  onToggle={() => updateSection({ ...s, hidden: !s.hidden })}
                  onDelete={() => { commit({ ...design, sections: design.sections.filter((x) => x.id !== s.id) }); if (selected === s.id) setSelected(null); }} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add a section</p>
        {caps.arrange ? (
          <div className="grid grid-cols-2 gap-2">
            {addable.map((t) => (
              <button key={t} type="button" onClick={() => addSection(t)} className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-left text-sm hover:border-foreground/50">
                <Plus size={14} className="shrink-0 text-muted-foreground" /> {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary p-4 text-sm">
            <p className="font-medium">Add, remove and reorder sections on Business.</p>
            <p className="mt-1 text-muted-foreground">On Starter you can edit every section, change colors and fonts, and show or hide sections.</p>
            <Button asChild size="sm" variant="outline" className="mt-3 rounded-full"><Link to="/orders/pricing">Compare plans</Link></Button>
          </div>
        )}
      </div>
    </div>
  );

  const settings = selectedSection
    ? <div className="space-y-4"><button type="button" onClick={() => setSelected(null)} className="text-xs font-medium text-muted-foreground hover:text-foreground">← Site style</button>
        <SectionSettings section={selectedSection} merchantId={store.merchant_id} caps={caps} onChange={updateSection} /></div>
    : <ThemeSettings design={design} caps={caps} onTheme={(theme) => commit({ ...design, theme })} onDesign={commit}
        onTemplate={(key) => { if (key === design.template) return; if (window.confirm("Switch starting design? Your section text resets to the new design. You can undo this.")) { commit(legacyToDesign({ ...store, industry_slug: merchant.industry_slug }, key)); setSelected(null); } }} />;

  const canvas = (
    <div className="mx-auto overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-[max-width] duration-300" style={{ maxWidth: WIDTH[viewport] }}>
      <SiteRenderer design={design} store={siteInfo} renderProducts={renderProducts} selectedId={selected} viewport={viewport}
        onSelect={(id) => { setSelected(id); setMobileTab("edit"); }} />
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <SEOHead title="Website Builder — Loumilab Orders" description="Design your Loumilab Orders website." path="/orders/dashboard/website" noindex />
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button asChild variant="ghost" size="sm" className="rounded-full"><Link to="/orders/dashboard"><ArrowLeft size={15} /> <span className="hidden sm:inline">Dashboard</span></Link></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{store.name} · Website</p>
          <p className={`text-xs ${saveState === "error" ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">{statusText}</p>
        </div>
        <div className="hidden items-center rounded-full border border-border p-1 md:flex" role="group" aria-label="Preview size">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([v, Icon]) => (
            <button key={v} type="button" aria-label={`${v} preview`} aria-pressed={viewport === v} onClick={() => setViewport(v)}
              className={`rounded-full p-2 ${viewport === v ? "bg-foreground text-background" : "text-muted-foreground"}`}><Icon size={15} /></button>
          ))}
        </div>
        <Button variant="ghost" size="icon" aria-label="Undo" disabled={!past.length} onClick={undo}><Undo2 size={16} /></Button>
        <Button variant="ghost" size="icon" aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 size={16} /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Version history"><History size={16} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Published versions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!versions?.length && <p className="px-2 py-2 text-sm text-muted-foreground">Nothing published yet.</p>}
            {versions?.map((v) => (
              <DropdownMenuItem key={v.version} disabled={v.version === row?.published_version} onSelect={() => onRestore(v.version)}>
                Version {v.version} · {new Date(v.created_at).toLocaleDateString()} {v.version === row?.published_version ? "(live)" : "— restore"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {row?.published_version ? <Button asChild variant="outline" size="sm" className="hidden rounded-full sm:inline-flex"><a href={customerHref("store", store.slug)} target="_blank" rel="noreferrer">View live</a></Button> : null}
        <Button size="sm" className="rounded-full" disabled={publish.isPending || (!draftDiffers && saveState === "saved")} onClick={onPublish}>
          {publish.isPending ? "Publishing…" : row?.published_version ? "Publish changes" : "Publish website"}
        </Button>
      </header>

      {/* Desktop workspace */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[280px_1fr_320px]">
        <aside className="overflow-y-auto border-r border-border p-4">{library}</aside>
        <main className="overflow-y-auto bg-secondary/60 p-6">{canvas}</main>
        <aside className="overflow-y-auto border-l border-border p-5">{settings}</aside>
      </div>

      {/* Phones and small tablets: one panel at a time */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {mobileTab === "sections" && library}
          {mobileTab === "edit" && settings}
          {mobileTab === "preview" && <div className="-mx-4 -my-4">{canvas}</div>}
        </div>
        <nav className="grid grid-cols-3 border-t border-border" aria-label="Editor panels">
          {([["sections", "Sections", Plus], ["edit", selectedSection ? "Edit section" : "Style", Palette], ["preview", "Preview", Eye]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setMobileTab(k)} aria-pressed={mobileTab === k}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${mobileTab === k ? "text-foreground" : "text-muted-foreground"}`}><Icon size={17} />{label}</button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
