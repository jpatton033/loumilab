// Pure calculation module for the Food Pricing Calculator.
// Kept UI-free so saved calculations / merchant product pricing can reuse it later.

export type UnitKind = "weight" | "volume" | "count";

export interface UnitDef {
  id: string;
  label: string;
  kind: UnitKind;
  /** Factor to the base unit (grams, millilitres, each) */
  toBase: number;
}

export const UNITS: UnitDef[] = [
  { id: "lb", label: "Pounds (lb)", kind: "weight", toBase: 453.59237 },
  { id: "oz", label: "Ounces (oz)", kind: "weight", toBase: 28.349523125 },
  { id: "kg", label: "Kilograms (kg)", kind: "weight", toBase: 1000 },
  { id: "g", label: "Grams (g)", kind: "weight", toBase: 1 },
  { id: "gal", label: "Gallons (gal)", kind: "volume", toBase: 3785.411784 },
  { id: "qt", label: "Quarts (qt)", kind: "volume", toBase: 946.352946 },
  { id: "pt", label: "Pints (pt)", kind: "volume", toBase: 473.176473 },
  { id: "floz", label: "Fluid ounces (fl oz)", kind: "volume", toBase: 29.5735295625 },
  { id: "cup", label: "Cups", kind: "volume", toBase: 236.5882365 },
  { id: "tbsp", label: "Tablespoons (tbsp)", kind: "volume", toBase: 14.78676478125 },
  { id: "tsp", label: "Teaspoons (tsp)", kind: "volume", toBase: 4.92892159375 },
  { id: "each", label: "Each / units", kind: "count", toBase: 1 },
];

export const unitById = (id: string) => UNITS.find((u) => u.id === id);

/** Convert amount between units. Returns null if the units measure different things. */
export function convert(amount: number, from: string, to: string): number | null {
  const a = unitById(from);
  const b = unitById(to);
  if (!a || !b || a.kind !== b.kind) return null;
  return (amount * a.toBase) / b.toBase;
}

export type PricingType = "meal" | "item" | "batch" | "tray" | "baked" | "other";

export const PRICING_TYPES: { id: PricingType; label: string; unit: string; units: string; yieldQ: string }[] = [
  { id: "meal", label: "Meal / Plate", unit: "plate", units: "plates", yieldQ: "How many plates does this recipe make?" },
  { id: "item", label: "Individual Item", unit: "item", units: "items", yieldQ: "How many sellable items does this make?" },
  { id: "batch", label: "Recipe / Batch", unit: "serving", units: "servings", yieldQ: "How many sellable servings does this batch make?" },
  { id: "tray", label: "Catering Tray", unit: "tray", units: "trays", yieldQ: "How many trays does this recipe produce?" },
  { id: "baked", label: "Baked Goods", unit: "item", units: "items", yieldQ: "How many sellable items does this batch make?" },
  { id: "other", label: "Other", unit: "unit", units: "units", yieldQ: "How many sellable units does this make?" },
];

export const typeInfo = (t: PricingType) => PRICING_TYPES.find((p) => p.id === t) ?? PRICING_TYPES[5];

export interface Ingredient {
  id: string;
  name: string;
  packagePrice: string;
  packageQty: string;
  packageUnit: string;
  usedQty: string;
  usedUnit: string;
}

export interface CostLine {
  id: string;
  name: string;
  amount: string;
  /** "batch" = total for the whole batch, "item" = per sellable unit */
  basis: "batch" | "item";
}

export interface PricingState {
  type: PricingType;
  ingredients: Ingredient[];
  yieldQty: string;
  packaging: CostLine[];
  additional: CostLine[];
  bufferOn: boolean;
  bufferPct: string;
  mode: "suggest" | "check";
  marginPct: string;
  price: string;
}

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export type IngredientResult =
  | { status: "ok"; cost: number }
  | { status: "incomplete" }
  | { status: "mismatch"; from: UnitKind; to: UnitKind };

export function ingredientCost(i: Ingredient): IngredientResult {
  const price = num(i.packagePrice);
  const pkg = num(i.packageQty);
  const used = num(i.usedQty);
  if (!price || !pkg || !used) return { status: "incomplete" };
  const usedInPkgUnits = convert(used, i.usedUnit, i.packageUnit);
  if (usedInPkgUnits === null) {
    return { status: "mismatch", from: unitById(i.packageUnit)!.kind, to: unitById(i.usedUnit)!.kind };
  }
  return { status: "ok", cost: (price / pkg) * usedInPkgUnits };
}

const lineBatchTotal = (lines: CostLine[], yieldQty: number) =>
  lines.reduce((s, l) => s + (l.basis === "item" ? num(l.amount) * yieldQty : num(l.amount)), 0);

export interface PricingResult {
  yieldQty: number;
  ingredients: number;
  packaging: number;
  additional: number;
  subtotal: number;
  buffer: number;
  total: number;
  perItem: number;
  mismatches: number;
  suggestedPrice: number | null;
  price: number | null;
  profitPerItem: number | null;
  margin: number | null;
  markup: number | null;
  batchProfit: number | null;
  marginInvalid: boolean;
}

export function calculate(s: PricingState): PricingResult {
  const yieldQty = num(s.yieldQty);
  let ingredients = 0;
  let mismatches = 0;
  for (const i of s.ingredients) {
    const r = ingredientCost(i);
    if (r.status === "ok") ingredients += r.cost;
    if (r.status === "mismatch") mismatches++;
  }
  const packaging = lineBatchTotal(s.packaging, yieldQty);
  const additional = lineBatchTotal(s.additional, yieldQty);
  const subtotal = ingredients + packaging + additional;
  const buffer = s.bufferOn ? subtotal * (num(s.bufferPct) / 100) : 0;
  const total = subtotal + buffer;
  const perItem = yieldQty > 0 ? total / yieldQty : 0;

  const marginPct = num(s.marginPct);
  const marginInvalid = s.mode === "suggest" && marginPct >= 100;
  const suggestedPrice =
    s.mode === "suggest" && yieldQty > 0 && !marginInvalid && s.marginPct !== "" ? perItem / (1 - marginPct / 100) : null;

  const entered = s.mode === "check" && s.price !== "" ? num(s.price) : null;
  const price = s.mode === "suggest" ? suggestedPrice : entered;

  let profitPerItem: number | null = null;
  let margin: number | null = null;
  let markup: number | null = null;
  let batchProfit: number | null = null;
  if (price !== null && yieldQty > 0) {
    profitPerItem = price - perItem;
    margin = price > 0 ? (profitPerItem / price) * 100 : null;
    markup = perItem > 0 ? (profitPerItem / perItem) * 100 : null;
    batchProfit = profitPerItem * yieldQty;
  }

  return {
    yieldQty, ingredients, packaging, additional, subtotal, buffer, total, perItem, mismatches,
    suggestedPrice, price, profitPerItem, margin, markup, batchProfit, marginInvalid,
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const newIngredient = (): Ingredient => ({
  id: uid(), name: "", packagePrice: "", packageQty: "", packageUnit: "lb", usedQty: "", usedUnit: "oz",
});

export const newLine = (basis: "batch" | "item" = "batch"): CostLine => ({ id: uid(), name: "", amount: "", basis });

export const initialState = (): PricingState => ({
  type: "meal",
  ingredients: [newIngredient()],
  yieldQty: "",
  packaging: [],
  additional: [],
  bufferOn: false,
  bufferPct: "",
  mode: "suggest",
  marginPct: "",
  price: "",
});

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pct = (n: number) => `${n.toFixed(1)}%`;
