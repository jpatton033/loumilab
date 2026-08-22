import dishAlfredo from "@/assets/orders/dish-alfredo.jpg";
import dishMac from "@/assets/orders/dish-mac.jpg";
import dishWings from "@/assets/orders/dish-wings.jpg";

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
];

export const getStorefront = (slug?: string) => storefronts.find((s) => s.slug === slug);

export const demoStorefront = storefronts[0];

export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
