import food from "@/assets/builder/tpl-food.jpg";
import bakery from "@/assets/builder/tpl-bakery.jpg";
import retail from "@/assets/builder/tpl-retail.jpg";
import beauty from "@/assets/builder/tpl-beauty.jpg";
import home from "@/assets/builder/tpl-home.jpg";
import minimal from "@/assets/builder/tpl-minimal.jpg";
import { isSafeImage, SCHEMA_VERSION, newSectionId, type Design, type Section, type SectionType, type Theme, type SectionStyle } from "./schema";

export interface TemplateInfo {
  key: string;
  name: string;
  summary: string;
  image: string;
  industries: string[];
  build: () => Design;
}

const st = (s: Partial<SectionStyle> = {}): SectionStyle => ({ background: "base", align: "left", spacing: "normal", ...s });
const sec = (type: SectionType, props: Section["props"] = {}, style: Partial<SectionStyle> = {}): Section => ({
  id: newSectionId(type), type, props, style: st(style),
});

const make = (template: string, theme: Theme, sections: Section[]): Design => ({ version: SCHEMA_VERSION, template, theme, sections });

/** Default content for a section added from the library. */
export const defaultSection = (type: SectionType): Section => {
  switch (type) {
    case "hero": return sec(type, { heading: "Made with care, ready for you", body: "Order online for pickup or delivery.", cta: "Order now" });
    case "about": return sec(type, { heading: "Our story", body: "Tell customers who you are, what you make and why it matters." });
    case "products": return sec(type, { heading: "Menu" });
    case "featured": return sec(type, { heading: "Customer favorites", count: 3 }, { background: "surface" });
    case "services": return sec(type, { heading: "What we offer", items: [{ title: "Service one", text: "A short description." }, { title: "Service two", text: "A short description." }] });
    case "gallery": return sec(type, { heading: "Gallery", images: [] });
    case "promo": return sec(type, { body: "Free delivery on orders over $40 this week." }, { background: "accent", align: "center", spacing: "compact" });
    case "testimonials": return sec(type, { heading: "Kind words", items: [{ title: "A happy customer", text: "Everything was perfect. We'll be ordering again." }] }, { background: "surface" });
    case "faq": return sec(type, { heading: "Questions", items: [{ title: "Do you deliver?", text: "Yes — see delivery options at checkout." }] });
    case "contact": return sec(type, { heading: "Get in touch", body: "We usually reply within a day." });
    case "hours": return sec(type, { heading: "Hours" });
    case "header": return sec(type, {});
    case "footer": return sec(type, {}, { background: "inverse" });
  }
};

export const TEMPLATES: TemplateInfo[] = [
  {
    key: "food", name: "Modern Food & Catering", image: food, industries: ["food", "catering", "meal", "restaurant", "chef"],
    summary: "Dark, rich and appetite-first, with a full-bleed hero.",
    build: () => make("food",
      { background: "#14110f", surface: "#1f1a16", text: "#f6efe6", muted: "#b9ab9a", accent: "#e0913d", accentText: "#14110f", headingFont: "Fraunces", bodyFont: "Manrope", radius: "soft", headingScale: "lg" },
      [sec("header"), sec("hero", { heading: "Big flavor, made fresh daily", body: "Catering trays, weekly meal prep and pop-up specials.", cta: "See the menu", image: food }, { spacing: "airy" }),
       sec("promo", { body: "Order by Thursday for weekend catering." }, { background: "accent", align: "center", spacing: "compact" }),
       sec("products", { heading: "Menu" }), sec("about", { heading: "From our kitchen", body: "Family recipes, local ingredients and plenty of care in every tray." }, { background: "surface" }),
       sec("testimonials", { heading: "What guests say", items: [{ title: "Dana R.", text: "Fed forty people and everyone asked who catered." }] }),
       sec("hours", { heading: "Pickup hours" }), sec("footer", {}, { background: "inverse" })]),
  },
  {
    key: "bakery", name: "Bakery & Desserts", image: bakery, industries: ["bak", "dessert", "cake", "sweet"],
    summary: "Soft cream and blush, elegant serif, centered layouts.",
    build: () => make("bakery",
      { background: "#fbf6f1", surface: "#f4e6e1", text: "#3b2a2a", muted: "#8a6f6b", accent: "#c76b80", accentText: "#ffffff", headingFont: "Cormorant Garamond", bodyFont: "DM Sans", radius: "round", headingScale: "lg" },
      [sec("header", {}, { align: "center" }), sec("hero", { heading: "Cakes for every celebration", body: "Custom cakes, cupcakes and macarons, baked to order.", cta: "Start your order", image: bakery }, { align: "center", spacing: "airy" }),
       sec("featured", { heading: "Bestsellers", count: 3 }, { align: "center", background: "surface" }), sec("products", { heading: "Order online" }, { align: "center" }),
       sec("faq", { heading: "Ordering custom cakes", items: [{ title: "How far ahead should I order?", text: "Two weeks for custom cakes, two days for everything else." }] }, { align: "center" }),
       sec("contact", { heading: "Say hello" }, { align: "center", background: "surface" }), sec("footer", {}, { background: "inverse", align: "center" })]),
  },
  {
    key: "retail", name: "Retail & Custom Products", image: retail, industries: ["retail", "product", "shop", "craft"],
    summary: "Sand tones and a clean product grid that lets items lead.",
    build: () => make("retail",
      { background: "#f3eee6", surface: "#e8e0d3", text: "#22201c", muted: "#6f685c", accent: "#22201c", accentText: "#f3eee6", headingFont: "DM Serif Display", bodyFont: "Work Sans", radius: "none", headingScale: "md" },
      [sec("header"), sec("hero", { heading: "Handmade goods for everyday living", body: "Small-batch pieces made in our studio.", cta: "Shop the collection", image: retail }),
       sec("products", { heading: "Shop" }), sec("gallery", { heading: "In the studio", images: [retail] }, { background: "surface" }),
       sec("about", { heading: "Made by hand", body: "Every piece is shaped, finished and packed by us." }), sec("footer", {}, { background: "inverse" })]),
  },
  {
    key: "beauty", name: "Beauty & Personal Services", image: beauty, industries: ["beauty", "hair", "salon", "personal", "nail", "spa"],
    summary: "Warm terracotta, generous spacing, services up front.",
    build: () => make("beauty",
      { background: "#fbf3ee", surface: "#f2dfd4", text: "#3a2621", muted: "#8b6a5f", accent: "#b65a3c", accentText: "#ffffff", headingFont: "Playfair Display", bodyFont: "Outfit", radius: "round", headingScale: "md" },
      [sec("header"), sec("hero", { heading: "Care that feels like you", body: "Natural hair, braids and styling by appointment.", cta: "Book a service", image: beauty }, { spacing: "airy" }),
       sec("services", { heading: "Services", items: [{ title: "Silk press", text: "Wash, treatment and a smooth finish." }, { title: "Braids", text: "Knotless, box and custom styles." }] }, { background: "surface" }),
       sec("products", { heading: "Book or buy" }), sec("testimonials", { heading: "Client love", items: [{ title: "Imani", text: "The most relaxing chair in town." }] }),
       sec("hours", { heading: "Studio hours" }, { background: "surface" }), sec("footer", {}, { background: "inverse" })]),
  },
  {
    key: "home", name: "Home Services", image: home, industries: ["home", "clean", "lawn", "landscap", "repair", "handy", "electric", "plumb", "automotive", "service"],
    summary: "Trustworthy greens, clear steps and a strong call to action.",
    build: () => make("home",
      { background: "#f5f7f2", surface: "#e3eadb", text: "#17251a", muted: "#5c6b5e", accent: "#2f6b3a", accentText: "#ffffff", headingFont: "Space Grotesk", bodyFont: "Manrope", radius: "soft", headingScale: "md" },
      [sec("header"), sec("hero", { heading: "Reliable service, done right", body: "Lawn care, cleanups and seasonal maintenance.", cta: "Request a quote", image: home }),
       sec("services", { heading: "How we help", items: [{ title: "Lawn care", text: "Weekly or biweekly mowing and edging." }, { title: "Cleanups", text: "Spring and fall yard cleanups." }, { title: "Hedges", text: "Shaping and trimming." }] }),
       sec("products", { heading: "Services & pricing" }, { background: "surface" }),
       sec("faq", { heading: "Common questions", items: [{ title: "Are you insured?", text: "Yes, fully insured." }] }),
       sec("contact", { heading: "Get a free estimate" }, { background: "accent" }), sec("footer", {}, { background: "inverse" })]),
  },
  {
    key: "minimal", name: "Minimal Professional", image: minimal, industries: ["professional", "photograph"],
    summary: "Quiet monochrome, sharp type and lots of white space.",
    build: () => make("minimal",
      { background: "#f7f6f3", surface: "#ebe9e4", text: "#111111", muted: "#6b6a66", accent: "#111111", accentText: "#f7f6f3", headingFont: "Syne", bodyFont: "DM Sans", radius: "none", headingScale: "lg" },
      [sec("header"), sec("hero", { heading: "Simple. Considered. Yours.", body: "A clear home for your business.", cta: "Get started", image: minimal }, { spacing: "airy" }),
       sec("about", { heading: "About", body: "Share what you do in a sentence or two." }), sec("products", { heading: "Offerings" }),
       sec("contact", { heading: "Contact" }, { background: "surface" }), sec("footer", {}, { background: "inverse" })]),
  },
];

export const findTemplate = (key?: string | null) => TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[TEMPLATES.length - 1];

/** Best starting template for a business type slug. */
export const templateForIndustry = (slug?: string | null) => {
  const s = (slug ?? "").toLowerCase();
  return TEMPLATES.find((t) => t.industries.some((k) => s.includes(k))) ?? TEMPLATES[0];
};

export interface LegacyStore {
  name: string;
  description?: string | null;
  hero_image_url?: string | null;
  industry_slug?: string | null;
}

/** Turns an existing store's details into a matching starting design. Nothing is moved or deleted. */
export const legacyToDesign = (store: LegacyStore, templateKey?: string | null): Design => {
  const tpl = templateKey ? findTemplate(templateKey) : templateForIndustry(store.industry_slug);
  const d = tpl.build();
  d.sections = d.sections.map((s) => {
    if (s.type === "hero") {
      return { ...s, props: { ...s.props, heading: store.name, body: store.description || s.props.body, image: store.hero_image_url && isSafeImage(store.hero_image_url) ? store.hero_image_url : s.props.image } };
    }
    if (s.type === "about" && store.description) return { ...s, props: { ...s.props, body: store.description } };
    return s;
  });
  return d;
};
