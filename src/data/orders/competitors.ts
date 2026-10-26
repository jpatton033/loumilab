/** Independent comparisons. Competitor facts come from their public pricing pages on CHECKED_ON. */
export const CHECKED_ON = "October 25, 2026";

export const COMPARE_ROWS = [
  "Monthly price",
  "Setup",
  "Platform fees",
  "Online ordering",
  "Scheduling",
  "Calendar sync",
  "Customer messaging",
  "Payouts",
  "Support",
] as const;

type Row = (typeof COMPARE_ROWS)[number];

export const LOUMILAB: Record<Row, string> = {
  "Monthly price": "Free plan, $0/month forever. Paid plans from $19/month.",
  Setup: "Build and preview your store before signing up. One shareable store link.",
  "Platform fees": "Starts at 5% on merchandise only and steps down automatically as monthly sales grow. Never on tips or tax.",
  "Online ordering": "Pickup and delivery storefront built for food sellers, bakers, makers and service businesses.",
  Scheduling: "Booking and job scheduling included on every plan.",
  "Calendar sync": "Google Calendar and Outlook sync on every plan, plus Apple Calendar downloads.",
  "Customer messaging": "Order-linked messaging with customers on paid plans; email updates on every plan.",
  Payouts: "Direct to your bank through Stripe. Stripe card fees are separate.",
  Support: "Help from inside your dashboard, with time-limited support access you control.",
};

export interface Competitor {
  slug: string;
  name: string;
  summary: string;
  source: string;
  values: Record<Row, string>;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "square",
    name: "Square",
    summary: "Square is a full point-of-sale system. Loumilab Orders is a simpler online storefront made for small sellers who mostly take orders online.",
    source: "https://squareup.com/us/en/pricing",
    values: {
      "Monthly price": "Free plan with limits; Plus and Premium plans priced per location.",
      Setup: "Account first, then set up a POS, online site and item library.",
      "Platform fees": "No separate platform fee; processing fees vary by plan and sale type.",
      "Online ordering": "Online ordering profile or store included; more site customization on paid plans.",
      Scheduling: "Appointments available through Square booking.",
      "Calendar sync": "Varies by product and plan.",
      "Customer messaging": "Email and text marketing on paid plans.",
      Payouts: "Square-processed payouts to a bank or Square account.",
      Support: "Help center; phone support varies by plan.",
    },
  },
  {
    slug: "shopify",
    name: "Shopify",
    summary: "Shopify is built for product brands that ship. Loumilab Orders is built for local pickup, delivery and bookings with a $0 starting plan.",
    source: "https://www.shopify.com/pricing",
    values: {
      "Monthly price": "Basic from $29/month; higher plans from $79 and $299/month.",
      Setup: "Account and free trial first, then theme and store setup.",
      "Platform fees": "Card rates from 2.9% + 30¢ on Basic; extra fees when not using Shopify Payments.",
      "Online ordering": "Full online store; local pickup and delivery settings available.",
      Scheduling: "Through third-party apps.",
      "Calendar sync": "Through third-party apps.",
      "Customer messaging": "Through Shopify Inbox and apps.",
      Payouts: "Through Shopify Payments where available.",
      Support: "24/7 help center and chat.",
    },
  },
  {
    slug: "toast",
    name: "Toast",
    summary: "Toast is a restaurant point-of-sale system with hardware. Loumilab Orders needs no hardware, so home chefs, caterers and pop-ups can start free.",
    source: "https://pos.toasttab.com/pricing",
    values: {
      "Monthly price": "Restaurant software from $0 depending on setup; retail from $90/month.",
      Setup: "Custom quote and hardware for most restaurants.",
      "Platform fees": "Processing rates depend on plan and quote.",
      "Online ordering": "Online ordering for restaurants, often as an add-on.",
      Scheduling: "Staff scheduling tools for restaurants.",
      "Calendar sync": "Not a focus for customer bookings.",
      "Customer messaging": "Marketing and guest tools as add-ons.",
      Payouts: "Through Toast payments.",
      Support: "24/7 restaurant support.",
    },
  },
];

export const findCompetitor = (slug?: string) => COMPETITORS.find((c) => c.slug === slug);
