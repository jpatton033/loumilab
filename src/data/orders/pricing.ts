/**
 * Static mirror of the Loumilab Orders tiers.
 *
 * The database table `orders_plans` is the source of truth — the public pricing
 * table and every fee calculation read from it. This file only provides copy for
 * static surfaces (onboarding plan picker, admin preview panels) and must be
 * kept aligned with the seeded plan rows.
 */
export interface PricingPlan {
  id: string;
  name: string;
  positioning: string;
  /** Headline price, e.g. "$0" or "$19". */
  price: string;
  /** Billing qualifier, e.g. "per month". Empty string hides it. */
  period: string;
  /** Platform fee line, e.g. "+ 3.9% Loumilab platform fee". */
  transactionFee?: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  featured?: boolean;
  note?: string;
}

export const pricingHeading = {
  eyebrow: "Pricing",
  title: "Start free, grow into it, or build something custom.",
  subtitle:
    "Every plan includes a real storefront, online payments, pickup and delivery. You pay a Loumilab platform fee on the merchandise subtotal — never on tips or sales tax.",
  footnote:
    "Platform fees apply to the discounted merchandise subtotal. Payment processing fees are billed separately. Payments securely powered by Stripe.",
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "launch",
    name: "Launch",
    positioning: "Start Selling",
    price: "$0",
    period: "to start",
    transactionFee: "+ 5% Loumilab platform fee",
    description: "Everything you need to publish a real storefront and start taking paid orders.",
    features: [
      "Unlimited menu & product listings",
      "Loumilab storefront",
      "Online payments",
      "Pickup & delivery ordering",
      "Tips",
      "Order dashboard",
      "Basic analytics",
    ],
    cta: "Start Selling",
  },
  {
    id: "starter",
    name: "Starter",
    positioning: "Run Your Business",
    price: "$19",
    period: "per month",
    transactionFee: "+ 3.9% Loumilab platform fee",
    description: "For sellers taking orders every week who need scheduling, promotions and better reporting.",
    features: [
      "Everything in Launch",
      "Scheduled ordering",
      "Pickup & delivery windows",
      "Promo codes & discounts",
      "Enhanced storefront customization",
      "Customer order history",
      "Improved reporting",
    ],
    cta: "Choose Starter",
  },
  {
    id: "business",
    name: "Business",
    positioning: "Grow Your Business",
    price: "$49",
    period: "per month",
    transactionFee: "+ 2.9% Loumilab platform fee",
    description: "For growing operations that need staff accounts, deep analytics and full storefront control.",
    features: [
      "Everything in Starter",
      "Advanced analytics & customer insights",
      "Sales exports",
      "Remove Loumilab storefront branding",
      "Owner plus up to 5 staff accounts",
      "Advanced order, pickup & delivery controls",
      "Priority support",
    ],
    cta: "Choose Business",
    badge: "Best for Growing Businesses",
    featured: true,
  },
  {
    id: "custom",
    name: "Custom",
    positioning: "Build With Loumilab",
    price: "Custom",
    period: "",
    transactionFee: "Custom agreement",
    description:
      "Need more than a storefront? Let's build it — custom sites, ordering systems, apps and integrations designed by Loumilab.",
    features: [
      "Independent website or custom e-commerce",
      "Custom ordering system or branded app",
      "Customer accounts & loyalty",
      "Advanced delivery, inventory & CRM",
      "API integrations, AI tools & automation",
      "Custom dashboards & workflows",
    ],
    cta: "Build With Loumilab",
  },
];
