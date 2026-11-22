import { z } from "zod";

/**
 * Orders website builder layout model: Store → Page → Sections → props/style.
 * Merchant content is data only. Text renders as plain text, colors must be hex,
 * fonts come from a fixed list and images only from trusted hosts, so a design
 * can never run code or load arbitrary resources. The server re-checks on publish.
 */

export const SCHEMA_VERSION = 1;

export const SECTION_TYPES = [
  "header", "hero", "about", "products", "services", "featured", "gallery",
  "promo", "testimonials", "faq", "contact", "hours", "footer",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  header: "Header", hero: "Hero", about: "About", products: "Products", services: "Services",
  featured: "Featured products", gallery: "Image gallery", promo: "Promotional banner",
  testimonials: "Testimonials", faq: "FAQ", contact: "Contact", hours: "Business hours", footer: "Footer",
};

/** The products section carries the cart; it can be styled and moved, never removed. */
export const LOCKED_SECTIONS: SectionType[] = ["products"];

export const FONTS = [
  "Fraunces", "Playfair Display", "Cormorant Garamond", "DM Serif Display", "Libre Baskerville",
  "Syne", "Space Grotesk", "Manrope", "DM Sans", "Work Sans", "Outfit",
] as const;

export const HERO_LAYOUTS = ["split", "full", "centered"] as const;
export type HeroLayout = (typeof HERO_LAYOUTS)[number];

const HEX = /^#[0-9a-fA-F]{6}$/;
const UNSAFE = /(<\s*script|javascript:|data:text\/html|[\s"'\/<]on[a-z]+\s*=)/i;

let trustedHosts: string[] = [];
try {
  const u = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
  if (u) trustedHosts = [new URL(u).host];
} catch { /* tests */ }
export const setTrustedImageHosts = (hosts: string[]) => { trustedHosts = hosts; };

/** Same-origin bundled assets or merchant uploads in Loumilab storage only. */
export const isSafeImage = (url: string) => {
  if (!url) return true;
  if (/^\/(?!\/)[\w\-./?&=%]+$/.test(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && trustedHosts.includes(u.host);
  } catch { return false; }
};

const text = (max: number) => z.string().max(max).refine((v) => !UNSAFE.test(v), "Text can't contain code.");
const image = z.string().max(2000).refine(isSafeImage, "Images must be uploaded to Loumilab.");
const item = z.object({ title: text(120), text: text(600) });

export const sectionStyleSchema = z.object({
  background: z.enum(["base", "surface", "accent", "inverse"]).default("base"),
  align: z.enum(["left", "center"]).default("left"),
  spacing: z.enum(["compact", "normal", "airy"]).default("normal"),
});

export const sectionSchema = z.object({
  id: z.string().min(1).max(40).regex(/^[\w-]+$/),
  type: z.enum(SECTION_TYPES),
  hidden: z.boolean().optional(),
  props: z.object({
    heading: text(140).optional(),
    body: text(2000).optional(),
    cta: text(40).optional(),
    image: image.optional(),
    images: z.array(image).max(12).optional(),
    items: z.array(item).max(24).optional(),
    email: text(120).optional(),
    phone: text(40).optional(),
    count: z.number().int().min(1).max(12).optional(),
    /** Hero only: split image and text, full-width image, or centered editorial. */
    layout: z.enum(HERO_LAYOUTS).optional(),
  }).strict(),
  style: sectionStyleSchema,
});

export const themeSchema = z.object({
  background: z.string().regex(HEX),
  surface: z.string().regex(HEX),
  text: z.string().regex(HEX),
  muted: z.string().regex(HEX),
  accent: z.string().regex(HEX),
  accentText: z.string().regex(HEX),
  headingFont: z.enum(FONTS),
  bodyFont: z.enum(FONTS),
  radius: z.enum(["none", "soft", "round"]),
  headingScale: z.enum(["sm", "md", "lg"]),
  /** Added later; optional so older saved designs still load (renderer applies defaults). */
  buttonStyle: z.enum(["solid", "outline", "pill"]).optional(),
  contentWidth: z.enum(["narrow", "normal", "wide"]).optional(),
});

export const designSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  template: z.string().max(40),
  theme: themeSchema,
  sections: z.array(sectionSchema).max(40)
    .refine((s) => s.some((x) => x.type === "products" && !x.hidden), "Keep a visible products section so customers can order."),
});

export type SectionStyle = z.infer<typeof sectionStyleSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Design = z.infer<typeof designSchema>;

export const validateDesign = (d: unknown) => designSchema.safeParse(d);

export const newSectionId = (type: SectionType) => `${type}-${Math.random().toString(36).slice(2, 8)}`;
