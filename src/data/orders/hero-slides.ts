import { BadgeDollarSign, Gift, Link, Target, Share2, type LucideIcon } from "lucide-react";

export interface OrdersHeroSlide {
  id: string;
  nav_label: string;
  eyebrow: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  accent_hsl: string;
  cta_primary?: { label: string; href: string };
  cta_secondary?: { label: string; href: string };
}

export const ordersHeroSlides: OrdersHeroSlide[] = [
  {
    id: "no-upfront-fees",
    nav_label: "No upfront fees",
    eyebrow: "Simple pricing",
    headline: "No upfront fees ever.",
    description:
      "Get started, get organized, and start selling without paying a setup cost or buying hardware.",
    icon: BadgeDollarSign,
    accent_hsl: "150 60% 42%",
    cta_primary: { label: "See pricing", href: "#pricing" },
  },
  {
    id: "free-forever",
    nav_label: "Free forever",
    eyebrow: "No subscription",
    headline: "Free forever.",
    description:
      "No monthly charges, no hidden costs. Just a simple way to take orders and get paid.",
    icon: Gift,
    accent_hsl: "217 91% 50%",
    cta_primary: { label: "Create your store", href: "/orders/get-started" },
  },
  {
    id: "no-dead-links",
    nav_label: "Always live",
    eyebrow: "Reliable link",
    headline: "Never get another 404 unknown page again.",
    description:
      "Your store lives on a real, shareable link that always works — even when you update your menu or products.",
    icon: Link,
    accent_hsl: "25 95% 53%",
    cta_primary: { label: "Try a demo store", href: "/orders/store/sunday-kitchen" },
  },
  {
    id: "focus",
    nav_label: "Focus",
    eyebrow: "Clutter-free",
    headline: "Focus attention on what really matters.",
    description:
      "Your products, your customers, and your business — not wrestling with a complicated website builder.",
    icon: Target,
    accent_hsl: "270 60% 55%",
    cta_primary: { label: "See how it works", href: "#how-it-works" },
  },
  {
    id: "every-channel",
    nav_label: "One link",
    eyebrow: "Every channel",
    headline: "One link. Every channel.",
    description:
      "Instagram, TikTok, Facebook, text, email, or your website — all your traffic lands in one place.",
    icon: Share2,
    accent_hsl: "15 90% 58%",
    cta_primary: { label: "Create your store", href: "/orders/get-started" },
  },
];
