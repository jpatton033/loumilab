/** Pure support rules, mirrored by the database's support_apply_change. */
export type SupportScope = "store_details" | "fulfilment" | "catalog" | "local_listing";

export const SCOPE_FIELDS: Record<SupportScope, string[]> = {
  store_details: ["name", "location", "description", "hours"],
  fulfilment: ["pickup_enabled", "pickup_info", "delivery_enabled", "delivery_fee_cents", "delivery_minimum_cents"],
  catalog: ["name", "description", "price_cents", "availability", "is_active"],
  local_listing: ["display_name", "tagline", "hours_text"],
};

export const SCOPE_LABELS: Record<SupportScope, string> = {
  store_details: "Store details",
  fulfilment: "Pickup & delivery",
  catalog: "Menu / catalog items",
  local_listing: "Local listing text",
};

export const ALL_SCOPES = Object.keys(SCOPE_FIELDS) as SupportScope[];

export const GRANT_DURATIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
];

export const fieldAllowed = (scope: SupportScope, field: string) => SCOPE_FIELDS[scope]?.includes(field) ?? false;

export interface GrantLike {
  status: string;
  expires_at: string | null;
  scopes: string[];
}

export const grantIsActive = (g: GrantLike, now = new Date()) =>
  g.status === "active" && !!g.expires_at && new Date(g.expires_at) > now;

export const canChange = (level: number, grants: GrantLike[], scope: SupportScope, now = new Date()) =>
  level >= 2 && grants.some((g) => grantIsActive(g, now) && g.scopes.includes(scope));

export const LEVEL_LABELS: Record<number, string> = {
  0: "No access",
  1: "Support Viewer",
  2: "Support Specialist",
  3: "Support Administrator",
};
