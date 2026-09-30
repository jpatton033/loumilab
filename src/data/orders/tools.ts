export interface BusinessTool {
  slug: string;
  name: string;
  description: string;
  status: "live" | "soon";
}

export const businessTools: BusinessTool[] = [
  {
    slug: "food-pricing-calculator",
    name: "Food Pricing Calculator",
    description:
      "Work out what each plate, tray, or baked good really costs to make, then find a price that leaves you a real profit.",
    status: "live",
  },
  { slug: "profit-margin-calculator", name: "Profit & Margin Calculator", description: "See how much you keep from every sale.", status: "soon" },
  { slug: "catering-quote-calculator", name: "Catering Quote Calculator", description: "Build accurate quotes for events and large orders.", status: "soon" },
  { slug: "delivery-fee-calculator", name: "Delivery Fee Calculator", description: "Set delivery fees that cover your time and travel.", status: "soon" },
];
