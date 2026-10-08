import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Copy, Info, Plus, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PRICING_TYPES, UNITS, calculate, ingredientCost, initialState, money, newIngredient, newLine, pct, typeInfo, uid,
  type CostLine, type Ingredient, type PricingState,
} from "@/lib/tools/foodPricing";

const STORAGE_KEY = "loumilab-food-pricing-v1";

const loadState = (): PricingState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return initialState();
};

const selectCls =
  "h-12 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const inputCls = "h-12 rounded-xl text-base";

const Tip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex text-muted-foreground hover:text-foreground" aria-label="More info">
        <Info size={14} />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-sm">{text}</TooltipContent>
  </Tooltip>
);

const Section = ({ step, title, hint, children }: { step: string; title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{step}</p>
    <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{title}</h2>
    {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    <div className="mt-5">{children}</div>
  </section>
);

const Money = (props: React.ComponentProps<typeof Input>) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
    <Input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className={`${inputCls} pl-7`} {...props} />
  </div>
);

const UnitSelect = ({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) => (
  <select id={id} className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
    {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
  </select>
);

const kindLabel = { weight: "a weight", volume: "a volume", count: "a count" } as const;

const IngredientCard = ({
  ing, index, onChange, onDuplicate, onRemove, canRemove,
}: {
  ing: Ingredient; index: number; onChange: (i: Ingredient) => void; onDuplicate: () => void; onRemove: () => void; canRemove: boolean;
}) => {
  const r = ingredientCost(ing);
  const set = (k: keyof Ingredient) => (v: string) => onChange({ ...ing, [k]: v });
  const p = `ing-${ing.id}`;
  return (
    <div className="rounded-2xl border border-border bg-background p-4 sm:p-5" data-ingredient={ing.id}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Ingredient {index + 1}</span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onDuplicate} aria-label="Duplicate ingredient"><Copy size={16} /></Button>
          {canRemove && <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove ingredient"><Trash2 size={16} /></Button>}
        </div>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-name`}>Name</Label>
          <Input id={`${p}-name`} className={`${inputCls} mt-1.5`} placeholder="e.g. Chicken wings" value={ing.name} onChange={(e) => set("name")(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-price`}>Package price</Label>
          <div className="mt-1.5"><Money id={`${p}-price`} value={ing.packagePrice} onChange={(e) => set("packagePrice")(e.target.value)} /></div>
        </div>
        <div>
          <Label htmlFor={`${p}-pq`}>Package size</Label>
          <Input id={`${p}-pq`} type="number" inputMode="decimal" min="0" className={`${inputCls} mt-1.5`} placeholder="5" value={ing.packageQty} onChange={(e) => set("packageQty")(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${p}-pu`}>Package unit</Label>
          <div className="mt-1.5"><UnitSelect id={`${p}-pu`} value={ing.packageUnit} onChange={set("packageUnit")} /></div>
        </div>
        <div>
          <Label htmlFor={`${p}-uq`}>Amount used</Label>
          <Input id={`${p}-uq`} type="number" inputMode="decimal" min="0" className={`${inputCls} mt-1.5`} placeholder="8" value={ing.usedQty} onChange={(e) => set("usedQty")(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${p}-uu`}>Unit used</Label>
          <div className="mt-1.5"><UnitSelect id={`${p}-uu`} value={ing.usedUnit} onChange={set("usedUnit")} /></div>
        </div>
      </div>
      <div className="mt-4 text-sm">
        {r.status === "ok" && (
          <p className="text-muted-foreground">Cost of the amount used: <span className="font-semibold text-foreground">{money(r.cost)}</span></p>
        )}
        {r.status === "mismatch" && (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            You bought this by {kindLabel[r.from]} but used {kindLabel[r.to]}, so we can't convert it. Pick matching units — this ingredient is left out until then.
          </p>
        )}
        {r.status === "incomplete" && <p className="text-muted-foreground">Fill in the price, package size and amount used to see its cost.</p>}
      </div>
    </div>
  );
};

const LinesEditor = ({
  lines, onChange, unit, placeholder, suggestions,
}: { lines: CostLine[]; onChange: (l: CostLine[]) => void; unit: string; placeholder: string; suggestions: string[] }) => {
  const update = (id: string, patch: Partial<CostLine>) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-3">
      {lines.map((l) => (
        <div key={l.id} className="rounded-2xl border border-border bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <Input aria-label="Name" className={inputCls} placeholder={placeholder} value={l.name} onChange={(e) => update(l.id, { name: e.target.value })} />
            <Money aria-label="Cost" value={l.amount} onChange={(e) => update(l.id, { amount: e.target.value })} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-full border border-border p-1 text-sm" role="radiogroup" aria-label="Cost applies to">
              {(["item", "batch"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={l.basis === b}
                  onClick={() => update(l.id, { basis: b })}
                  className={`rounded-full px-3 py-1.5 transition-colors ${l.basis === b ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {b === "item" ? `Per ${unit}` : "Whole batch"}
                </button>
              ))}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(lines.filter((x) => x.id !== l.id))} aria-label="Remove"><Trash2 size={16} /></Button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => onChange([...lines, { ...newLine(), name: s }])}
            className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground">
            + {s}
          </button>
        ))}
        <button type="button" onClick={() => onChange([...lines, newLine()])}
          className="rounded-full border border-dashed border-border px-3 py-2 text-sm font-medium hover:border-foreground">
          + Other
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value, tip, strong }: { label: string; value: string; tip?: string; strong?: boolean }) => (
  <div className={`flex items-center justify-between gap-3 py-2 ${strong ? "font-semibold" : ""}`}>
    <span className="flex items-center gap-1.5 text-sm">{label}{tip && <Tip text={tip} />}</span>
    <span className={strong ? "text-base" : "text-sm"}>{value}</span>
  </div>
);

const FoodPricingCalculator = () => {
  const [s, setS] = useState<PricingState>(loadState);
  const [bufferHelp, setBufferHelp] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const focusId = useRef<string | null>(null);
  const r = useMemo(() => calculate(s), [s]);
  const t = typeInfo(s.type);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s]);

  useEffect(() => {
    if (!focusId.current) return;
    const el = document.querySelector<HTMLInputElement>(`#ing-${focusId.current}-name`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
    focusId.current = null;
  }, [s.ingredients.length]);

  const patch = (p: Partial<PricingState>) => setS((prev) => ({ ...prev, ...p }));
  const setIng = (list: Ingredient[]) => patch({ ingredients: list });
  const addIngredient = () => { const n = newIngredient(); focusId.current = n.id; setIng([...s.ingredients, n]); };

  const hasYield = r.yieldQty > 0;
  const priceLabel = s.mode === "suggest" ? "Suggested selling price" : "Your selling price";

  const results = (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your results</p>
      <div className="mt-4 rounded-2xl bg-secondary p-4">
        <p className="text-sm text-muted-foreground">Cost per {t.unit}</p>
        <p className="font-display text-3xl font-semibold">{hasYield ? money(r.perItem) : "—"}</p>
        {r.price !== null && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">{priceLabel}</p>
            <p className="font-display text-3xl font-semibold text-accent">{money(r.price)}</p>
          </>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold">Cost breakdown (whole batch)</h3>
      <div className="mt-1 divide-y divide-border">
        <Row label="Ingredients" value={money(r.ingredients)} />
        <Row label="Packaging" value={money(r.packaging)} />
        <Row label="Additional costs" value={money(r.additional)} />
        {s.bufferOn && <Row label={`Cost buffer (${s.bufferPct || 0}%)`} value={money(r.buffer)} />}
        <Row label="Total batch cost" value={money(r.total)} strong />
        <Row label={`Cost per ${t.unit}`} value={hasYield ? money(r.perItem) : `Add how many ${t.units}`} strong />
      </div>

      {r.price !== null && hasYield && (
        <>
          <h3 className="mt-6 text-sm font-semibold">Pricing</h3>
          <div className="mt-1 divide-y divide-border">
            <Row label={priceLabel} value={money(r.price)} />
            <Row label={`Profit per ${t.unit}`} value={money(r.profitPerItem ?? 0)} tip="What's left from each sale after your estimated costs." />
            <Row label="Profit margin" value={r.margin !== null ? pct(r.margin) : "—"} tip="The share of the selling price you keep as profit. $10 price with $4 profit = 40% margin." />
            <Row label="Markup" value={r.markup !== null ? pct(r.markup) : "—"} tip="How much you add on top of cost, as a % of cost. $6 cost sold at $10 = 66.7% markup. Not the same as margin." />
            <Row label={`Profit for all ${r.yieldQty} ${t.units}`} value={money(r.batchProfit ?? 0)} strong />
          </div>
          {(r.profitPerItem ?? 0) < 0 && (
            <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">At this price you'd lose money on each {t.unit}.</p>
          )}
        </>
      )}

      <button type="button" onClick={() => setHowOpen((v) => !v)} aria-expanded={howOpen}
        className="mt-6 flex w-full items-center justify-between text-sm font-semibold">
        How was this calculated?
        <ChevronDown size={16} className={`transition-transform ${howOpen ? "rotate-180" : ""}`} />
      </button>
      {howOpen && (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Each ingredient: package price ÷ package size × amount used (after converting to the same unit).</li>
          <li>Packaging and extra costs marked "per {t.unit}" are multiplied by {hasYield ? r.yieldQty : "your yield"}; "whole batch" costs are added once.</li>
          {s.bufferOn && <li>Cost buffer: {money(r.subtotal)} × {s.bufferPct || 0}% = {money(r.buffer)}.</li>}
          <li>Cost per {t.unit}: {money(r.total)} ÷ {hasYield ? r.yieldQty : "yield"} = {hasYield ? money(r.perItem) : "—"}.</li>
          {s.mode === "suggest" ? (
            <li>Suggested price: cost ÷ (1 − margin). {r.suggestedPrice !== null ? `${money(r.perItem)} ÷ (1 − ${s.marginPct}%) = ${money(r.suggestedPrice)}.` : ""} This way your margin is truly a share of the price, not just added to cost.</li>
          ) : (
            <li>Profit = your price − cost per {t.unit}. Margin = profit ÷ price.</li>
          )}
        </ol>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        These are estimates. Actual costs, taxes, fees, labor, ingredient prices and other expenses can vary. You decide what to charge.
      </p>
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Free Food Pricing Calculator for Small Food Businesses | Loumilab Orders"
        description="Price plates, trays, baked goods and meal prep with confidence. Free food cost calculator with unit conversion, packaging, buffers and profit margin. No sign-up."
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Loumilab Orders", path: "/orders" }, { name: "Business Tools", path: "/orders/tools" }, { name: "Food Pricing Calculator", path: "/orders/tools/food-pricing-calculator" }]}
        path="/orders/tools/food-pricing-calculator"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Food Pricing Calculator",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any",
            url: "https://loumilab.com/orders/tools/food-pricing-calculator",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: "Loumilab" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Loumilab Orders", item: "https://loumilab.com/orders" },
              { "@type": "ListItem", position: 2, name: "Business Tools", item: "https://loumilab.com/orders/tools" },
              { "@type": "ListItem", position: 3, name: "Food Pricing Calculator", item: "https://loumilab.com/orders/tools/food-pricing-calculator" },
            ],
          },
        ]}
      />

      <div className="section-container pb-32 pt-6 lg:pb-24 lg:pt-8">
        <Link to="/orders/tools" className="text-sm font-medium text-muted-foreground hover:text-foreground">Business Tools</Link>
        <Eyebrow className="mt-8 block">Free tool</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Food Pricing Calculator</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">Find out what it really costs to make what you sell — and what to charge for it.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setS(initialState())}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Start over
          </Button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="space-y-6">
            <Section step="Step 1" title="What are you pricing?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRICING_TYPES.map((p) => (
                  <button key={p.id} type="button" onClick={() => patch({ type: p.id })} aria-pressed={s.type === p.id}
                    className={`min-h-12 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${s.type === p.id ? "border-accent bg-accent/10 text-foreground" : "border-border hover:border-foreground"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section step="Step 2" title="Ingredients" hint="Enter what you paid for each package and how much of it goes into this recipe. We'll convert units for you when they match.">
              <div className="space-y-3">
                {s.ingredients.map((ing, i) => (
                  <IngredientCard key={ing.id} ing={ing} index={i}
                    canRemove={s.ingredients.length > 1}
                    onChange={(n) => setIng(s.ingredients.map((x) => (x.id === ing.id ? n : x)))}
                    onDuplicate={() => { const c = { ...ing, id: uid() }; const list = [...s.ingredients]; list.splice(i + 1, 0, c); setIng(list); }}
                    onRemove={() => setIng(s.ingredients.filter((x) => x.id !== ing.id))}
                  />
                ))}
              </div>
              <Button type="button" variant="outline" size="lg" className="mt-4 w-full" onClick={addIngredient}>
                <Plus className="mr-1.5 h-4 w-4" /> Add ingredient
              </Button>
            </Section>

            <Section step="Step 3" title="Yield">
              <Label htmlFor="yield">{t.yieldQ}</Label>
              <Input id="yield" type="number" inputMode="numeric" min="0" className={`${inputCls} mt-1.5 max-w-xs`} placeholder="12" value={s.yieldQty} onChange={(e) => patch({ yieldQty: e.target.value })} />
            </Section>

            <Section step="Optional" title="Packaging" hint={`Containers, labels, bags and so on. Choose whether a cost is per ${t.unit} or for the whole batch.`}>
              <LinesEditor lines={s.packaging} onChange={(l) => patch({ packaging: l })} unit={t.unit} placeholder="e.g. Containers"
                suggestions={["Containers", "Labels", "Bags", "Boxes", "Utensils", "Cups"]} />
            </Section>

            <Section step="Optional" title="Additional costs" hint="Things that aren't ingredients but still cost you money to make this — they give you a more realistic picture of your true cost.">
              <LinesEditor lines={s.additional} onChange={(l) => patch({ additional: l })} unit={t.unit} placeholder="e.g. Labor"
                suggestions={["Labor", "Kitchen rental", "Utilities", "Prep supplies"]} />
            </Section>

            <Section step="Optional" title="Cost buffer">
              <div className="flex items-center gap-3">
                <Switch id="buffer" checked={s.bufferOn} onCheckedChange={(v) => patch({ bufferOn: v })} />
                <Label htmlFor="buffer" className="text-base">Add a cost buffer</Label>
                <button type="button" onClick={() => setBufferHelp((v) => !v)} className="text-sm text-accent underline-offset-4 hover:underline" aria-expanded={bufferHelp}>
                  What is this?
                </button>
              </div>
              {bufferHelp && (
                <p className="mt-3 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                  A cost buffer adds a percentage on top of your estimated costs to cover things like ingredient price changes, waste, spills or unexpected expenses. You choose the percentage — there's no one right number.
                </p>
              )}
              {s.bufferOn && (
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <div>
                    <Label htmlFor="buffer-pct">Buffer percentage</Label>
                    <div className="relative mt-1.5 w-36">
                      <Input id="buffer-pct" type="number" inputMode="decimal" min="0" className={`${inputCls} pr-8`} placeholder="0" value={s.bufferPct} onChange={(e) => patch({ bufferPct: e.target.value })} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="pb-3 text-sm text-muted-foreground">Adds <span className="font-semibold text-foreground">{money(r.buffer)}</span> to your batch cost.</p>
                </div>
              )}
            </Section>

            <Section step="Step 4" title="Pricing">
              <div className="inline-flex w-full rounded-full border border-border p-1 sm:w-auto" role="tablist">
                {([["suggest", "Suggest a price"], ["check", "Check my price"]] as const).map(([m, label]) => (
                  <button key={m} type="button" role="tab" aria-selected={s.mode === m} onClick={() => patch({ mode: m })}
                    className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none ${s.mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {s.mode === "suggest" ? (
                <div className="mt-5">
                  <Label htmlFor="margin" className="flex items-center gap-1.5">Desired profit margin <Tip text="The share of your selling price you want to keep as profit." /></Label>
                  <div className="relative mt-1.5 w-36">
                    <Input id="margin" type="number" inputMode="decimal" min="0" max="99" className={`${inputCls} pr-8`} placeholder="0" value={s.marginPct} onChange={(e) => patch({ marginPct: e.target.value })} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  {r.marginInvalid && <p className="mt-2 text-sm text-destructive">Margin must be below 100%.</p>}
                </div>
              ) : (
                <div className="mt-5 max-w-xs">
                  <Label htmlFor="price">Price you charge (or are considering) per {t.unit}</Label>
                  <div className="mt-1.5"><Money id="price" value={s.price} onChange={(e) => patch({ price: e.target.value })} /></div>
                </div>
              )}
            </Section>

            <div className="lg:hidden">{results}</div>

            <section className="rounded-3xl border border-border bg-secondary p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold">Know what to charge. Now start taking orders.</h2>
              <p className="mt-2 text-muted-foreground">Turn your products into an online ordering experience with Loumilab Orders.</p>
              <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg"><Link to="/orders/get-started">Create Your Store</Link></Button>
                <Link to="/orders" className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Learn about Loumilab Orders</Link>
              </div>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">{results}</aside>
        </div>
      </div>

      {/* Mobile pinned summary */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="section-container flex items-center justify-between gap-4 py-3 pr-20">
          <div>
            <p className="text-xs text-muted-foreground">Cost per {t.unit}</p>
            <p className="font-display text-lg font-semibold">{hasYield ? money(r.perItem) : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{s.mode === "suggest" ? "Suggested price" : "Profit per " + t.unit}</p>
            <p className="font-display text-lg font-semibold text-accent">
              {s.mode === "suggest" ? (r.suggestedPrice !== null ? money(r.suggestedPrice) : "—") : r.profitPerItem !== null ? money(r.profitPerItem) : "—"}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FoodPricingCalculator;
