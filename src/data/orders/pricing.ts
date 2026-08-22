/**
 * Single source of truth for Orders pricing. The business model is intentionally
 * not hard-coded anywhere else — change these values and every surface follows.
 */
export interface PricingPlan {
  id: string;
  name: string;
  /** Headline price, e.g. "$0" or "$19". Kept as a string so it stays editable. */
  price: string;
  /** Billing qualifier, e.g. "per month". Empty string hides it. */
  period: string;
  /** Optional transaction fee line, e.g. "+ 2% per order". */
  transactionFee?: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  note?: string;
}

export const pricingHeading = {
  eyebrow: "Pricing",
  title: "Simple pricing, built for small businesses.",
  subtitle:
    "Final pricing is being set as Orders moves toward launch. Plans are structured so you only pay as you grow.",
  footnote: "Pricing shown is indicative while Orders is in development.",
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    period: "to start",
    transactionFee: "+ transaction fee per order",
    description: "Everything you need to publish a storefront and take your first orders.",
    features: ["Custom Orders storefront", "Up to 10 products", "Order dashboard", "Pickup orders"],
    cta: "Start Selling",
  },
  {
    id: "monthly",
    name: "Business",
    price: "$19",
    period: "per month",
    transactionFee: "+ lower transaction fee",
    description: "For sellers taking orders every week and managing a real menu.",
    features: [
      "Unlimited products",
      "Order status workflow",
      "Sales analytics",
      "Availability & sold-out controls",
      "Mobile order management",
    ],
    cta: "Start Selling",
    featured: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "Custom",
    period: "",
    description: "For growing operations that need more control and support.",
    features: [
      "Multiple team members",
      "Priority support",
      "Advanced analytics",
      "Custom pickup windows",
    ],
    cta: "Talk to Loumilab",
  },
];
