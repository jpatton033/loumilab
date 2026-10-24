import { SCOPE_LABELS, type SupportScope } from "./rules";

/** Merchant-facing support history entry. Never carries staff identity. */
export interface ActivityRow {
  created_at: string;
  action: string;
  by_merchant: boolean | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
}

export interface FormattedActivity {
  when: string;
  title: string;
  by: string;
  changes: string[];
  note: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  location: "Location",
  description: "Description",
  hours: "Hours",
  pickup_enabled: "Pickup",
  pickup_info: "Pickup info",
  delivery_enabled: "Delivery",
  delivery_fee_cents: "Delivery fee",
  delivery_minimum_cents: "Delivery minimum",
  price_cents: "Price",
  availability: "Availability",
  is_active: "Item shown",
  display_name: "Listing name",
  tagline: "Tagline",
  hours_text: "Listing hours",
};

const DURATION: Record<number, string> = { 1: "1 hour", 24: "24 hours", 168: "7 days" };

export const formatValue = (field: string, v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (field.endsWith("_cents")) return `$${(Number(v) / 100).toFixed(2)}`;
  if (typeof v === "boolean") return v ? "On" : "Off";
  return String(v);
};

const scopesText = (v: unknown) =>
  Array.isArray(v) ? v.map((s) => SCOPE_LABELS[s as SupportScope] ?? String(s)).join(", ") : "";

export const formatActivity = (a: ActivityRow): FormattedActivity => {
  const nv = (a.new_value ?? {}) as Record<string, unknown>;
  const ov = (a.old_value ?? {}) as Record<string, unknown>;
  let title = "Support activity";
  let changes: string[] = [];

  if (a.action === "support.view_merchant") title = "Support viewed your account";
  else if (a.action === "support.view_as_merchant") title = "Support viewed your dashboard (read-only)";
  else if (a.action === "support.grant_created") {
    const h = Number(nv.hours);
    title = `You allowed support access${DURATION[h] ? ` for ${DURATION[h]}` : ""}`;
  } else if (a.action === "support.grant_declined") title = "You declined a support access request";
  else if (a.action === "support.grant_revoked") title = "Support access was revoked";
  else if (a.action === "support.access_requested") {
    const s = scopesText(a.new_value);
    title = `Support asked for access${s ? ` to ${s}` : ""}`;
  } else if (a.action === "support.ticket_status") title = `Your request was marked ${String(nv.status ?? "updated")}`;
  else if (a.action.startsWith("support.change.")) {
    const scope = a.action.slice("support.change.".length) as SupportScope;
    title = `Support updated ${(SCOPE_LABELS[scope] ?? "a setting").toLowerCase()}`;
    changes = Object.keys(nv).map(
      (k) => `${FIELD_LABELS[k] ?? k}: ${formatValue(k, ov[k])} → ${formatValue(k, nv[k])}`,
    );
  }

  return {
    when: new Date(a.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
    title,
    by: a.by_merchant ? "You" : "Loumilab support",
    changes,
    note: a.action.startsWith("support.change.") ? a.reason : null,
  };
};
