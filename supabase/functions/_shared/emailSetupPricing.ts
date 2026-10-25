/**
 * Business Email & Domain Setup pricing and checkout eligibility.
 * Pure and shared by the website summary and the server, so the price a
 * customer sees is the exact price Stripe charges.
 */

export type EmailPackage = "email" | "email_domain";
export type EmailProvider = "google" | "microsoft" | "zoho" | "help";

export const PACKAGE_PRICES: Record<EmailPackage, number> = { email: 9900, email_domain: 14900 };
export const PACKAGE_LABELS: Record<EmailPackage, string> = {
  email: "Business Email Setup",
  email_domain: "Business Email + Domain Setup",
};
export const PROVIDER_LABELS: Record<EmailProvider, string> = {
  google: "Google Workspace",
  microsoft: "Microsoft 365",
  zoho: "Zoho Mail",
  help: "Help me choose",
};
export const MAILBOX_CENTS = 2500;
export const DEVICE_CENTS = 2500;
export const STANDALONE_DOMAIN_CENTS = 4900;
export const MAX_STANDARD_MAILBOXES = 5;
export const MAX_STANDARD_DEVICES = 3;

export interface EmailSetupInput {
  package: EmailPackage;
  provider: EmailProvider;
  mailboxes: number;
  extraDevices: number;
  standaloneDomain: boolean;
  migration: boolean;
  ownsDomain: boolean;
  /** "yes" | "no" | "unsure" — only meaningful when the domain is owned. */
  registrarAccess: "yes" | "no" | "unsure";
  complexNeeds: boolean;
}

export interface PriceLine { label: string; cents: number }

export interface EmailSetupPrice {
  lines: PriceLine[];
  totalCents: number;
  needsReview: boolean;
  reasons: string[];
}

export function priceEmailSetup(i: EmailSetupInput): EmailSetupPrice {
  const reasons: string[] = [];
  if (i.migration) reasons.push("Existing email needs to be moved");
  if (i.mailboxes > MAX_STANDARD_MAILBOXES) reasons.push(`More than ${MAX_STANDARD_MAILBOXES} mailboxes`);
  if (i.extraDevices > MAX_STANDARD_DEVICES) reasons.push(`More than ${MAX_STANDARD_DEVICES} extra devices`);
  if (i.ownsDomain && i.registrarAccess !== "yes") reasons.push("Domain access needs to be confirmed");
  if (i.package === "email" && !i.ownsDomain) reasons.push("No domain yet for the email-only package");
  if (i.complexNeeds) reasons.push("Special requirements need a review");

  const mailboxes = Math.max(1, Math.floor(i.mailboxes));
  const devices = Math.max(0, Math.floor(i.extraDevices));
  const lines: PriceLine[] = [{ label: PACKAGE_LABELS[i.package], cents: PACKAGE_PRICES[i.package] }];
  if (mailboxes > 1) lines.push({ label: `Additional mailboxes × ${mailboxes - 1}`, cents: (mailboxes - 1) * MAILBOX_CENTS });
  if (devices > 0) lines.push({ label: `Additional devices × ${devices}`, cents: devices * DEVICE_CENTS });
  if (i.standaloneDomain) lines.push({ label: "Standalone domain setup", cents: STANDALONE_DOMAIN_CENTS });

  return {
    lines,
    totalCents: lines.reduce((n, l) => n + l.cents, 0),
    needsReview: reasons.length > 0,
    reasons,
  };
}
