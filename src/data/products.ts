export interface ProductEntry {
  /** Stable key */
  id: string;
  name: string;
  /** Short category label, e.g. "Compliance Technology" */
  category: string;
  /** One-line positioning statement */
  tagline: string;
  /** Longer description used on cards and the ecosystem page */
  description: string;
  /** Internal route or absolute external URL */
  href: string;
  external?: boolean;
  /** Small pill, e.g. "A Loumilab Company" */
  badge?: string;
  /** Call-to-action label */
  cta: string;
  status?: "Live" | "Beta" | "Coming Soon";
}

export interface ProductGroup {
  id: string;
  label: string;
  blurb: string;
  items: ProductEntry[];
}

export const productGroups: ProductGroup[] = [
  {
    id: "built-by-loumilab",
    label: "Built by Loumilab",
    blurb: "Products we design, build, and operate ourselves.",
    items: [
      {
        id: "orders",
        name: "Loumilab Orders",
        category: "Commerce Platform",
        tagline: "Sell anywhere. Take orders in one place.",
        description:
          "A modern ordering platform for businesses that sell across multiple channels — one clean place to receive, manage, and fulfill every order.",
        href: "/orders",
        badge: "Built by Loumilab",
        cta: "Explore Orders",
        status: "Coming Soon",
      },
    ],
  },
  {
    id: "loumilab-companies",
    label: "Loumilab Companies",
    blurb: "Independent technology companies inside the Loumilab group.",
    items: [
      {
        id: "vurtti",
        name: "Vurtti",
        category: "Compliance Technology",
        tagline: "Compliance, documented and under control.",
        description:
          "A compliance technology platform helping teams document, organize, and maintain the evidence their standards require.",
        href: "https://www.vurttidocs.com",
        external: true,
        badge: "A Loumilab Company",
        cta: "Visit Vurtti",
        status: "Live",
      },
    ],
  },
];

export const allProducts: ProductEntry[] = productGroups.flatMap((g) => g.items);
