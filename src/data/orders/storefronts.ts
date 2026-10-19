import dishAlfredo from "@/assets/orders/dish-alfredo.jpg";
import dishMac from "@/assets/orders/dish-mac.jpg";
import dishWings from "@/assets/orders/dish-wings.jpg";
import bakeCake from "@/assets/orders/bake-cake.jpg";
import bakeCupcakes from "@/assets/orders/bake-cupcakes.jpg";
import bakeCookies from "@/assets/orders/bake-cookies.jpg";
import flowerBouquet from "@/assets/orders/flower-bouquet.jpg";
import flowerArrangement from "@/assets/orders/flower-arrangement.jpg";
import flowerGift from "@/assets/orders/flower-gift.jpg";

/**
 * Storefront data model. Today these records are local mock data; the same shapes
 * are what a merchants/products table will return, so components never change.
 */
export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  /** Price in cents — money is never stored as a float. */
  priceCents: number;
  image?: string;
  availability: "available" | "sold_out" | "unavailable";
}

export interface Storefront {
  id: string;
  slug: string;
  name: string;
  location: string;
  description: string;
  /** Initials used for the logo placeholder until a merchant uploads one. */
  monogram: string;
  acceptingOrders: boolean;
  hours: string;
  pickupInfo: string;
  /** Drives terminology, modules and workflow — see `orders_industries`. */
  industrySlug: string;
  products: StoreProduct[];
}

export const storefronts: Storefront[] = [
  {
    id: "store_sunday_kitchen",
    slug: "sunday-kitchen",
    name: "Sunday Kitchen",
    location: "Baltimore, MD",
    description: "Comfort plates made fresh every weekend. Order ahead, pick up hot.",
    monogram: "SK",
    acceptingOrders: true,
    hours: "Fri – Sun · 12:00 PM – 8:00 PM",
    pickupInfo: "Pickup only · Address shared after checkout",
    industrySlug: "food-catering",
    products: [
      {
        id: "p_alfredo",
        name: "Chicken Alfredo",
        description: "Creamy Alfredo pasta with seasoned chicken",
        priceCents: 1800,
        image: dishAlfredo,
        availability: "available",
      },
      {
        id: "p_mac",
        name: "Seafood Mac & Cheese",
        description: "Creamy baked mac & cheese with seafood",
        priceCents: 1600,
        image: dishMac,
        availability: "available",
      },
      {
        id: "p_wings",
        name: "Honey Old Bay Wings",
        description: "10 wings with signature honey Old Bay glaze",
        priceCents: 1500,
        image: dishWings,
        availability: "available",
      },
    ],
  },
  {
    id: "store_bright_current",
    slug: "bright-current-electric",
    name: "Bright Current Electric",
    location: "Atlanta, GA",
    description: "Licensed residential electricians. Request service, get an estimate, book a visit.",
    monogram: "BC",
    acceptingOrders: true,
    hours: "Mon – Sat · 7:00 AM – 6:00 PM",
    pickupInfo: "On-site service across metro Atlanta",
    industrySlug: "electrician",
    products: [
      {
        id: "s_diagnostic",
        name: "Diagnostic Visit",
        description: "On-site troubleshooting and written findings",
        priceCents: 9900,
        availability: "available",
      },
      {
        id: "s_panel",
        name: "Panel Upgrade",
        description: "200-amp panel replacement, permit included",
        priceCents: 185000,
        availability: "available",
      },
      {
        id: "s_fixture",
        name: "Fixture & Outlet Installation",
        description: "Lighting, ceiling fans, outlets and switches",
        priceCents: 14500,
        availability: "available",
      },
    ],
  },
];


/* Homepage-only demo stores. Never written to the database. */
const svc = (id: string, name: string, description: string, priceCents: number): StoreProduct => ({
  id, name, description, priceCents, availability: "available",
});

export const demoShowcaseStores: Storefront[] = [
  {
    id: "store_sweet_crumb", slug: "sweet-crumb-bakery", name: "Sweet Crumb Bakery", location: "Columbus, OH",
    description: "Made-to-order cakes and weekend bakes. Order ahead for pickup.", monogram: "SC",
    acceptingOrders: true, hours: "Wed – Sat · 9:00 AM – 5:00 PM", pickupInfo: "Pickup or local delivery",
    industrySlug: "bakery",
    products: [
      { id: "b_cake", name: "Celebration Cake", description: '8" vanilla bean, buttercream florals', priceCents: 6500, image: bakeCake, availability: "available" },
      { id: "b_cupcakes", name: "Cupcake Box (6)", description: "Assorted pastel buttercream cupcakes", priceCents: 2200, image: bakeCupcakes, availability: "available" },
      { id: "b_cookies", name: "Chocolate Chip Dozen", description: "Brown-butter cookies, baked same day", priceCents: 1800, image: bakeCookies, availability: "available" },
    ],
  },
  {
    id: "store_petal_stem", slug: "petal-and-stem", name: "Petal & Stem Florist", location: "Richmond, VA",
    description: "Seasonal bouquets and gifts, hand-tied every morning.", monogram: "PS",
    acceptingOrders: true, hours: "Mon – Sat · 8:00 AM – 6:00 PM", pickupInfo: "Same-day delivery before 2 PM",
    industrySlug: "retail",
    products: [
      { id: "f_bouquet", name: "Peony & Rose Bouquet", description: "Hand-tied, wrapped in kraft paper", priceCents: 7500, image: flowerBouquet, availability: "available" },
      { id: "f_arrangement", name: "Garden Centerpiece", description: "Seasonal blooms in a ceramic vase", priceCents: 9000, image: flowerArrangement, availability: "available" },
      { id: "f_gift", name: "Little Something Gift Box", description: "Posy, soy candle and artisan chocolates", priceCents: 6000, image: flowerGift, availability: "available" },
    ],
  },
  storefronts[1],
  {
    id: "store_fixit", slug: "fix-it-handyman", name: "Fix-It Handyman Co.", location: "Charlotte, NC",
    description: "Small jobs done right. Request a visit and get a firm quote.", monogram: "FH",
    acceptingOrders: true, hours: "Mon – Fri · 8:00 AM – 5:00 PM", pickupInfo: "On-site service across Charlotte",
    industrySlug: "handyman",
    products: [
      svc("h_hour", "Handyman Hour", "General repairs, patching and odd jobs", 8500),
      svc("h_tv", "TV Mounting", "Up to 75\", wall mount and cable tidy", 12900),
      svc("h_furniture", "Furniture Assembly", "Beds, desks, shelving and more", 9500),
    ],
  },
  {
    id: "store_luxe", slug: "studio-luxe-hair", name: "Studio Luxe Hair Salon", location: "Houston, TX",
    description: "Healthy hair, beautifully done. Book your chair online.", monogram: "SL",
    acceptingOrders: true, hours: "Tue – Sat · 10:00 AM – 7:00 PM", pickupInfo: "Appointments at the studio",
    industrySlug: "beauty",
    products: [
      svc("s_silk", "Silk Press", "Wash, treatment and silk press", 9500),
      svc("s_braids", "Knotless Braids", "Medium, mid-back length", 22000),
      svc("s_cut", "Cut & Style", "Consultation, cut and blowout", 6500),
    ],
  },
  {
    id: "store_fresh_nest", slug: "fresh-nest-cleaning", name: "Fresh Nest Cleaning", location: "Philadelphia, PA",
    description: "Insured, eco-friendly home cleaning. Book a visit in minutes.", monogram: "FN",
    acceptingOrders: true, hours: "Mon – Sat · 8:00 AM – 6:00 PM", pickupInfo: "In-home service across Philadelphia",
    industrySlug: "cleaning",
    products: [
      svc("c_standard", "Standard Clean", "Up to 2 bedrooms, kitchen and baths", 13000),
      svc("c_deep", "Deep Clean", "Baseboards, appliances and detail work", 24000),
      svc("c_move", "Move-Out Clean", "Empty home, inside cabinets included", 29000),
    ],
  },
];

export const getStorefront = (slug?: string) => storefronts.find((s) => s.slug === slug);

export const demoStorefront = storefronts[0];

export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

