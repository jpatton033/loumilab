/**
 * Customer-funded purchasing rules for Business Email Setup, in integer cents.
 * Pure: shared by the server, the website and tests.
 */

export type PurchaseMode = "customer_direct" | "loumilab_purchase";

export const MANAGEMENT_PLANS = {
  essential: { label: "Essential Management", cents: 1900, mailboxes: 1 },
  business: { label: "Business Management", cents: 3900, mailboxes: 5 },
} as const;
export type ManagementPlan = keyof typeof MANAGEMENT_PLANS;

export const STAGES = [
  ["submitted", "Order submitted"],
  ["payment_confirmed", "Payment confirmed"],
  ["purchasing", "Purchasing services"],
  ["domain", "Domain configuration"],
  ["email", "Email configuration"],
  ["testing", "Testing and verification"],
  ["handoff", "Billing and ownership handoff"],
  ["completed", "Completed"],
] as const;
export type Stage = (typeof STAGES)[number][0];
export const STAGE_KEYS = STAGES.map(([k]) => k) as Stage[];

/** Every item must be confirmed before a Loumilab-purchased order can be completed. */
export const HANDOFF_ITEMS = [
  ["domain_owner", "Domain registered in the customer's ownership information"],
  ["registrar_access", "Customer has appropriate registrar access"],
  ["email_owner", "Email provider account ownership and administration established"],
  ["credentials", "Customer set up their own credentials and recovery options"],
  ["domain_billing", "Future domain renewal billing assigned to the customer"],
  ["email_billing", "Future email subscription billing assigned to the customer"],
  ["loumilab_card_removed", "Loumilab's payment method removed or no longer responsible"],
  ["renewals_documented", "Renewal dates documented"],
  ["mailbox_tested", "Mailbox configuration tested"],
  ["handoff_email", "Final handoff email delivered"],
] as const;
export type HandoffKey = (typeof HANDOFF_ITEMS)[number][0];
/** For customer-direct orders, Loumilab never held billing, so only these apply. */
const DIRECT_ITEMS: HandoffKey[] = ["domain_owner", "registrar_access", "email_owner", "credentials", "mailbox_tested", "handoff_email"];

export const requiredHandoff = (mode: PurchaseMode): HandoffKey[] =>
  mode === "loumilab_purchase" ? HANDOFF_ITEMS.map(([k]) => k) : DIRECT_ITEMS;

export function handoffMissing(mode: PurchaseMode, handoff: Partial<Record<string, boolean>> | null | undefined, manualReview = false) {
  const h = handoff ?? {};
  const missing = requiredHandoff(mode).filter((k) => h[k] !== true);
  return { missing, canComplete: missing.length === 0 && !manualReview };
}

export const PURCHASE_AUTH_ACKS = [
  "Loumilab is authorized to purchase the selected domain and email services on my behalf.",
  "The domain and email services are provided by independent third-party companies.",
  "I will be the intended owner of my domain and email accounts.",
  "Third-party pricing, renewal terms and cancellation policies apply.",
  "Loumilab's setup fee is separate from third-party costs.",
  "I will be responsible for future provider renewals after billing handoff.",
  "Any purchase beyond the approved amount needs my separate approval.",
] as const;

export interface ThirdPartyLine { label: string; cents: number; billing: string }

/** A quote for a Loumilab-purchased order: service fee plus confirmed provider costs. */
export function quoteTotals(serviceCents: number, lines: ThirdPartyLine[]) {
  if (!Number.isInteger(serviceCents) || serviceCents < 0) throw new Error("Invalid setup fee.");
  for (const l of lines) if (!Number.isInteger(l.cents) || l.cents <= 0) throw new Error("Each provider cost must be a positive amount.");
  const thirdPartyCents = lines.reduce((n, l) => n + l.cents, 0);
  return { serviceCents, thirdPartyCents, totalCents: serviceCents + thirdPartyCents };
}

export interface FundsInput {
  agreedTotalCents: number;   // current agreed order total (service + budget)
  budgetCents: number;        // approved third-party purchasing budget
  netPaidCents: number;       // charges minus refunds
  purchases: { amount_cents: number }[];
}

/**
 * Splits customer money into Loumilab revenue and held purchasing funds.
 * Service revenue is earned first; anything above it is customer purchasing
 * money and is never counted as Loumilab revenue.
 */
export function computeFunds(i: FundsInput) {
  const serviceCents = Math.max(0, i.agreedTotalCents - i.budgetCents);
  const serviceRevenueCents = Math.min(Math.max(0, i.netPaidCents), serviceCents);
  const purchasingFundsCents = Math.max(0, i.netPaidCents - serviceCents);
  const spentCents = i.purchases.reduce((n, p) => n + p.amount_cents, 0);
  const remainingCents = purchasingFundsCents - spentCents; // >0 unspent (owed back), <0 shortfall
  return {
    collectedCents: i.netPaidCents,
    serviceRevenueCents,
    budgetCents: i.budgetCents,
    purchasingFundsCents,
    spentCents,
    remainingCents,
    unspentOwedCents: Math.max(0, remainingCents),
    shortfallCents: Math.max(0, -remainingCents),
  };
}

/** A purchase may only be recorded when held funds cover it; otherwise ask the customer first. */
export const purchaseAllowed = (remainingCents: number, amountCents: number) => amountCents <= remainingCents;
