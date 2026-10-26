import { productGroups } from "@/data/products";

export interface NavLinkItem { label: string; to: string; desc?: string; external?: boolean }
export interface NavGroup { label: string; items: NavLinkItem[] }
export interface NavMenu { id: string; label: string; match: string[]; groups: NavGroup[]; footer?: NavLinkItem }

/** Single source for the header dropdowns and the footer columns. */
export const navMenus: NavMenu[] = [
  {
    id: "solutions",
    label: "Solutions",
    match: ["/services", "/how-we-work", "/work"],
    groups: [
      {
        label: "Technology Studio",
        items: [
          { label: "Website Development", to: "/services/website-development", desc: "Fast, clear websites built to convert." },
          { label: "Custom Software", to: "/services/custom-software", desc: "Web apps and platforms around how you work." },
          { label: "AI & Automation", to: "/services/ai-automation", desc: "Remove repetitive work with practical AI." },
          { label: "Cybersecurity", to: "/services/cybersecurity", desc: "Reviews, hardening and secure-by-default builds." },
        ],
      },
      {
        label: "Managed Business Technology",
        items: [
          { label: "Business Email Setup & Management", to: "/services/business-email", desc: "Professional email on your own domain." },
          { label: "Domain Setup & Management", to: "/services/domains", desc: "Domains, DNS and records, set up properly." },
        ],
      },
    ],
    footer: { label: "All solutions", to: "/services" },
  },
  {
    id: "products",
    label: "Products",
    match: ["/products", "/orders"],
    groups: productGroups.map((g) => ({
      label: g.label,
      items: g.items.map((p) => ({ label: p.name, to: p.href, desc: p.tagline, external: p.external })),
    })),
    footer: { label: "View all products", to: "/products" },
  },
  {
    id: "resources",
    label: "Resources",
    match: ["/resources", "/the-dot"],
    groups: [
      {
        label: "Learn",
        items: [
          { label: "Knowledge Center", to: "/resources", desc: "Practical guides on technology and growth." },
          { label: "Free Business Tools", to: "/orders/tools", desc: "Pricing calculators and more. No sign-up." },
          { label: "The Dot.", to: "/the-dot", desc: "Our brief on ideas, technology and what's next." },
        ],
      },
    ],
  },
];

export const navDirectLinks: NavLinkItem[] = [{ label: "About", to: "/about" }];

export const footerCompany: NavLinkItem[] = [
  { label: "About", to: "/about" },
  { label: "Selected Work", to: "/work" },
  { label: "How We Work", to: "/how-we-work" },
  { label: "Contact", to: "/contact" },
];
