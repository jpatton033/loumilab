import { SCHEMA_VERSION, validateDesign, newSectionId, type Design, type HeroLayout, type Section, type SectionStyle, type SectionType, type Theme } from "./schema";
import { findTemplate, templateForIndustry } from "./templates";
import cake from "@/assets/orders/bake-cake.jpg";
import cupcakes from "@/assets/orders/bake-cupcakes.jpg";
import cookies from "@/assets/orders/bake-cookies.jpg";
import bakeryCounter from "@/assets/orders/showcase/bakery-counter.jpg";
import streetHero from "@/assets/orders/showcase/streetwear-hoodie-model.jpg";
import tee from "@/assets/orders/showcase/streetwear-tee.jpg";
import printHoodie from "@/assets/orders/showcase/streetwear-print-hoodie.jpg";
import cap from "@/assets/orders/showcase/streetwear-cap.jpg";
import buffet from "@/assets/orders/showcase/catering-buffet.jpg";
import wings from "@/assets/orders/dish-wings.jpg";
import mac from "@/assets/orders/dish-mac.jpg";
import alfredo from "@/assets/orders/dish-alfredo.jpg";
import salonHero from "@/assets/orders/showcase/salon-stylist.jpg";
import braids from "@/assets/orders/svc-salon-braids.jpg";
import silk from "@/assets/orders/svc-salon-silk.jpg";
import cut from "@/assets/orders/svc-salon-cut.jpg";
import cleanHero from "@/assets/orders/showcase/cleaning-living-room.jpg";
import cleanStandard from "@/assets/orders/svc-clean-standard.jpg";
import cleanDeep from "@/assets/orders/svc-clean-deep.jpg";
import cleanMove from "@/assets/orders/svc-clean-move.jpg";
import installation from "@/assets/orders/showcase/studio-installation.jpg";
import flower from "@/assets/orders/flower-arrangement.jpg";
import bouquet from "@/assets/orders/flower-bouquet.jpg";
import flowerGift from "@/assets/orders/flower-gift.jpg";

/**
 * One design system for the public preview, the showcase and the merchant builder.
 * Everything here returns plain Design/Theme data that the builder edits and the
 * live store renders, so a look made before sign-up can be published unchanged.
 */

export interface StylePreset { key: "editorial" | "bold" | "minimal"; name: string; summary: string; theme: Theme; hero: HeroLayout }

export const STYLE_PRESETS: StylePreset[] = [
  { key: "editorial", name: "Editorial", summary: "Warm neutrals, elegant serif, generous space.", hero: "split",
    theme: { background: "#f7f1e8", surface: "#ede2d2", text: "#2c241c", muted: "#7d6e5e", accent: "#8a4b2a", accentText: "#ffffff", headingFont: "Cormorant Garamond", bodyFont: "DM Sans", radius: "soft", headingScale: "lg", buttonStyle: "solid", contentWidth: "normal" } },
  { key: "bold", name: "Bold", summary: "Deep black, strong type, high contrast.", hero: "full",
    theme: { background: "#0e0e0e", surface: "#1c1c1c", text: "#f5f5f2", muted: "#a5a5a0", accent: "#f2f2ee", accentText: "#0e0e0e", headingFont: "Syne", bodyFont: "Space Grotesk", radius: "none", headingScale: "lg", buttonStyle: "solid", contentWidth: "wide" } },
  { key: "minimal", name: "Minimal", summary: "Light, restrained and simple.", hero: "centered",
    theme: { background: "#ffffff", surface: "#f2f2f0", text: "#151515", muted: "#6c6c68", accent: "#151515", accentText: "#ffffff", headingFont: "Manrope", bodyFont: "Manrope", radius: "soft", headingScale: "md", buttonStyle: "pill", contentWidth: "narrow" } },
];

export interface Palette { key: string; name: string; colors: Pick<Theme, "background" | "surface" | "text" | "muted" | "accent" | "accentText"> }

export const PALETTES: Palette[] = [
  { key: "cream", name: "Cream & cocoa", colors: { background: "#f7f1e8", surface: "#ede2d2", text: "#2c241c", muted: "#7d6e5e", accent: "#8a4b2a", accentText: "#ffffff" } },
  { key: "blush", name: "Blush", colors: { background: "#fbf6f1", surface: "#f4e6e1", text: "#3b2a2a", muted: "#8a6f6b", accent: "#c76b80", accentText: "#ffffff" } },
  { key: "forest", name: "Forest", colors: { background: "#f5f7f2", surface: "#e3eadb", text: "#17251a", muted: "#5c6b5e", accent: "#2f6b3a", accentText: "#ffffff" } },
  { key: "night", name: "Night", colors: { background: "#0e0e0e", surface: "#1c1c1c", text: "#f5f5f2", muted: "#a5a5a0", accent: "#e0913d", accentText: "#0e0e0e" } },
  { key: "ocean", name: "Harbor", colors: { background: "#f3f6f8", surface: "#dfe8ee", text: "#13232f", muted: "#5a6b78", accent: "#1f5e8a", accentText: "#ffffff" } },
  { key: "mono", name: "Monochrome", colors: { background: "#ffffff", surface: "#f2f2f0", text: "#151515", muted: "#6c6c68", accent: "#151515", accentText: "#ffffff" } },
];

export interface FontPair { key: string; name: string; heading: Theme["headingFont"]; body: Theme["bodyFont"] }

export const FONT_PAIRS: FontPair[] = [
  { key: "modern", name: "Modern Sans", heading: "Manrope", body: "DM Sans" },
  { key: "editorial", name: "Editorial Serif", heading: "Cormorant Garamond", body: "Work Sans" },
  { key: "bold", name: "Bold Contemporary", heading: "Syne", body: "Space Grotesk" },
  { key: "classic", name: "Classic", heading: "Playfair Display", body: "Outfit" },
];

export const HERO_LAYOUT_LABELS: Record<HeroLayout, string> = { split: "Split image & text", full: "Full-width image", centered: "Centered editorial" };

export const ARRANGEMENTS = [
  { key: "shop", name: "Shop first", order: ["hero", "featured", "products", "about", "services", "gallery", "testimonials", "faq", "hours", "contact"] },
  { key: "story", name: "Story first", order: ["hero", "about", "gallery", "featured", "products", "services", "testimonials", "faq", "hours", "contact"] },
  { key: "service", name: "Services first", order: ["hero", "services", "testimonials", "products", "featured", "about", "faq", "hours", "contact", "gallery"] },
] as const satisfies readonly { key: string; name: string; order: readonly SectionType[] }[];

export const applyStyle = (d: Design, p: StylePreset): Design => ({ ...d, theme: { ...p.theme }, sections: setHeroLayout(d, p.hero).sections });
export const applyPalette = (d: Design, p: Palette): Design => ({ ...d, theme: { ...d.theme, ...p.colors } });
export const applyFontPair = (d: Design, f: FontPair): Design => ({ ...d, theme: { ...d.theme, headingFont: f.heading, bodyFont: f.body } });
export const setHeroLayout = (d: Design, layout: HeroLayout): Design => ({
  ...d, sections: d.sections.map((s) => (s.type === "hero" ? { ...s, props: { ...s.props, layout } } : s)),
});
export const heroLayoutOf = (d: Design): HeroLayout => d.sections.find((s) => s.type === "hero")?.props.layout ?? "split";

/** Reorders sections by type; header stays first, footer last, unknown types keep their place at the end. */
export const arrange = (d: Design, order: readonly SectionType[]): Design => {
  const rank = (s: Section) => (s.type === "header" ? -1 : s.type === "footer" ? 999 : (order.indexOf(s.type) + 1 || 500));
  return { ...d, sections: [...d.sections].map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i).map((x) => x.s) };
};

/** Sets an accent color, choosing readable text on top of it. */
export const readableOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
};

// ---------- Showcase: six distinct websites, all plain designs ----------

const st = (s: Partial<SectionStyle> = {}): SectionStyle => ({ background: "base", align: "left", spacing: "normal", ...s });
const sec = (type: SectionType, props: Section["props"] = {}, style: Partial<SectionStyle> = {}): Section => ({ id: newSectionId(type), type, props, style: st(style) });

export interface ShowcaseSite { key: string; label: string; storeName: string; template: string; design: () => Design; products: SampleProduct[] }
export interface SampleProduct { id: string; name: string; price: string; image?: string }

const p = (name: string, price: string, image?: string): SampleProduct => ({ id: name, name, price, image });

export const SHOWCASE: ShowcaseSite[] = [
  { key: "bakery", label: "Modern bakery", storeName: "Mae's Bakehouse", template: "bakery",
    products: [p("Celebration cake", "$48", cake), p("Cupcakes, dozen", "$30", cupcakes), p("Cookie box", "$18", cookies)],
    design: () => ({ version: SCHEMA_VERSION, template: "bakery",
      theme: { background: "#f7f1e8", surface: "#ede2d2", text: "#2c241c", muted: "#7d6e5e", accent: "#8a4b2a", accentText: "#ffffff", headingFont: "Cormorant Garamond", bodyFont: "DM Sans", radius: "soft", headingScale: "lg", buttonStyle: "solid", contentWidth: "normal" },
      sections: [sec("header", {}, { align: "center" }), sec("hero", { heading: "Baked this morning, for you", body: "Custom cakes and small-batch treats for pickup.", cta: "Start your order", image: bakeryCounter, layout: "split" }, { spacing: "airy" }),
        sec("featured", { heading: "This week", count: 3 }, { background: "surface" }), sec("products", { heading: "Order online" }), sec("footer", {}, { background: "inverse" })] }) },
  { key: "streetwear", label: "Streetwear & apparel", storeName: "NORTHLINE", template: "retail",
    products: [p("Heavyweight tee", "$38", tee), p("Custom print hoodie", "$72", printHoodie), p("Logo cap", "$28", cap)],
    design: () => ({ version: SCHEMA_VERSION, template: "retail",
      theme: { background: "#0b0b0b", surface: "#191919", text: "#f4f4f0", muted: "#9d9d98", accent: "#f4f4f0", accentText: "#0b0b0b", headingFont: "Syne", bodyFont: "Space Grotesk", radius: "none", headingScale: "lg", buttonStyle: "solid", contentWidth: "wide" },
      sections: [sec("header"), sec("hero", { heading: "DROP 04 IS LIVE", body: "Custom prints, heavyweight blanks, made locally.", cta: "Shop the drop", image: streetHero, layout: "full" }),
        sec("promo", { body: "Free local pickup on every order." }, { background: "accent", align: "center", spacing: "compact" }), sec("products", { heading: "New arrivals" }), sec("footer", {}, { background: "surface" })] }) },
  { key: "catering", label: "Catering & food", storeName: "Ember Kitchen", template: "food",
    products: [p("Wings party tray", "$95", wings), p("Baked mac & cheese pan", "$64", mac), p("Chicken alfredo tray", "$78", alfredo)],
    design: () => ({ ...findTemplate("food").build(), sections: [sec("header"),
      sec("hero", { heading: "Catering that feeds a crowd", body: "Trays, meal prep and pop-up specials. Pickup or delivery.", cta: "See the menu", image: buffet, layout: "split" }, { spacing: "airy" }),
      sec("products", { heading: "Menu" }), sec("hours", { heading: "Pickup & delivery", body: "Order by Thursday for weekend events.\nDelivery within 15 miles." }, { background: "surface" }), sec("footer", {}, { background: "inverse" })] }) },
  { key: "beauty", label: "Beauty & personal care", storeName: "Crown Studio", template: "beauty",
    products: [p("Knotless braids", "$180", braids), p("Silk press", "$85", silk), p("Cut & style", "$55", cut)],
    design: () => ({ version: SCHEMA_VERSION, template: "beauty",
      theme: { background: "#f6f1ec", surface: "#ebe1d8", text: "#2f2622", muted: "#857468", accent: "#5c3d34", accentText: "#ffffff", headingFont: "Playfair Display", bodyFont: "Outfit", radius: "round", headingScale: "md", buttonStyle: "pill", contentWidth: "normal" },
      sections: [sec("header", {}, { align: "center" }), sec("hero", { heading: "Care that feels like you", body: "Braids, silk presses and styling by appointment.", cta: "Book a service", image: salonHero, layout: "centered" }, { align: "center", spacing: "airy" }),
        sec("products", { heading: "Services" }, { align: "center" }), sec("footer", {}, { background: "inverse", align: "center" })] }) },
  { key: "home", label: "Home services", storeName: "Brightside Cleaning", template: "home",
    products: [p("Standard clean", "from $120", cleanStandard), p("Deep clean", "from $220", cleanDeep), p("Move-out clean", "from $260", cleanMove)],
    design: () => ({ ...findTemplate("home").build(), sections: [sec("header"),
      sec("hero", { heading: "A cleaner home, on your schedule", body: "Insured, background-checked teams. Book in minutes.", cta: "Request a quote", image: cleanHero, layout: "split" }),
      sec("services", { heading: "Why neighbors choose us", items: [{ title: "Insured", text: "Fully insured and bonded." }, { title: "On time", text: "Two-hour arrival windows." }, { title: "Guaranteed", text: "We come back if it isn't right." }] }, { background: "surface" }),
      sec("products", { heading: "Services & pricing" }), sec("footer", {}, { background: "inverse" })] }) },
  { key: "creative", label: "Creative professional", storeName: "Ines Duarte Studio", template: "minimal",
    products: [p("Event centerpiece", "from $120", flower), p("Seasonal bouquet", "$85", bouquet), p("Gift arrangement", "$65", flowerGift)],
    design: () => ({ version: SCHEMA_VERSION, template: "minimal",
      theme: { background: "#f4f3f0", surface: "#e7e5e0", text: "#0f0f0f", muted: "#666560", accent: "#0f0f0f", accentText: "#f4f3f0", headingFont: "DM Serif Display", bodyFont: "Work Sans", radius: "none", headingScale: "lg", buttonStyle: "outline", contentWidth: "wide" },
      sections: [sec("header"), sec("hero", { heading: "Objects, flowers and quiet spaces", body: "Design studio taking commissions for 2027.", cta: "View work", image: installation, layout: "full" }),
        sec("products", { heading: "Commissions" }, { background: "surface" }), sec("footer", {}, { background: "inverse" })] }) },
];

/** Starting point for the public "Make it yours" preview. */
export const PREVIEW_START = () => SHOWCASE[0].design();
export const PREVIEW_SITE = SHOWCASE[0];

// ---------- Carry a preview design into the builder ----------

export const PENDING_DESIGN_KEY = "orders.designDraft";
export const PENDING_DESIGN_TTL = 24 * 60 * 60 * 1000;

/** Saves a look from the public preview on this device only (no personal details). */
export const setPendingDesign = (d: Design) => {
  if (!validateDesign(d).success) return false;
  try {
    localStorage.setItem(PENDING_DESIGN_KEY, JSON.stringify({ design: d, savedAt: Date.now() }));
    localStorage.setItem("loumilab.orders.pendingTemplate", d.template); // same key TemplatePicker/builder read
    return true;
  } catch { return false; }
};

/** Reads a saved preview design; anything expired, malformed or unsafe is discarded. */
export const readPendingDesign = (now = Date.now()): Design | null => {
  try {
    const raw = localStorage.getItem(PENDING_DESIGN_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { design?: unknown; savedAt?: number };
    const parsed = validateDesign(v.design);
    if (!parsed.success || typeof v.savedAt !== "number" || now - v.savedAt > PENDING_DESIGN_TTL || v.savedAt > now + 60_000) {
      localStorage.removeItem(PENDING_DESIGN_KEY);
      return null;
    }
    return parsed.data;
  } catch { return null; }
};

export const takePendingDesign = () => {
  const d = readPendingDesign();
  try { localStorage.removeItem(PENDING_DESIGN_KEY); } catch { /* ignore */ }
  return d;
};

/** Keeps the preview's look and order; the store's own name, description and photo replace sample text. */
export const applyStoreDetails = (look: Design, base: Design): Design => {
  const baseHero = base.sections.find((s) => s.type === "hero");
  const baseAbout = base.sections.find((s) => s.type === "about");
  const tplImage = findTemplate(base.template).build().sections.find((s) => s.type === "hero")?.props.image;
  const ownPhoto = baseHero?.props.image && baseHero.props.image !== tplImage ? baseHero.props.image : undefined;
  return {
    ...look,
    sections: look.sections.map((s) => {
      if (s.type === "hero" && baseHero) return { ...s, id: newSectionId("hero"), props: { ...s.props, heading: baseHero.props.heading, body: baseHero.props.body, image: ownPhoto ?? s.props.image } };
      if (s.type === "about" && baseAbout?.props.body) return { ...s, props: { ...s.props, body: baseAbout.props.body } };
      return s;
    }),
  };
};

/** Starting look for store setup: a saved preview design, else the chosen or best-fit template. */
export const initialSetupDesign = (pendingTemplate: string | null, industrySlug?: string | null): Design =>
  readPendingDesign() ?? (pendingTemplate ? findTemplate(pendingTemplate) : templateForIndustry(industrySlug)).build();

/** Setup preview: the merchant's own name and description fill the hero; the look is untouched. */
export const withSetupDetails = (d: Design, details: { name: string; description: string }): Design => ({
  ...d,
  sections: d.sections.map((s) => (s.type === "hero"
    ? { ...s, props: { ...s.props, heading: details.name.trim() || s.props.heading, body: details.description.trim() || s.props.body } }
    : s)),
});

/** Merchant items as preview product cards. */
export const setupProducts = (items: { name: string; price: string }[]): SampleProduct[] =>
  items.filter((i) => i.name.trim()).map((i, idx) => ({ id: `${idx}-${i.name}`, name: i.name.trim(), price: Number(i.price) > 0 ? `$${Number(i.price).toFixed(2).replace(/\.00$/, "")}` : "Quote" }));
