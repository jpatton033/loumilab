/** Product portals that share one Loumilab account. */
export type Portal = "spaces" | "orders";

export const PORTALS: Record<Portal, { name: string; landing: string; publicPage: string; blurb: string }> = {
  spaces: { name: "Loumilab Spaces", landing: "/spaces/app", publicPage: "/spaces", blurb: "Your Library, apps and workspaces." },
  orders: { name: "Loumilab Orders", landing: "/orders/dashboard", publicPage: "/orders", blurb: "Your storefront, orders and payouts." },
};

export const parsePortal = (v: string | null | undefined): Portal | null =>
  v === "spaces" || v === "orders" ? v : null;

/** Same-site path only — blocks open redirects like //evil.com or /\evil.com. */
export const safeNext = (v: string | null | undefined): string | null =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : null;

/** Guess the portal from a destination path. */
export const portalForPath = (path: string | null | undefined): Portal | null =>
  !path ? null : path.startsWith("/spaces") ? "spaces" : path.startsWith("/orders") ? "orders" : null;

export const portalSignInPath = (portal: Portal, next?: string | null, extra?: Record<string, string>) => {
  const q = new URLSearchParams(extra);
  const n = safeNext(next);
  if (n) q.set("next", n);
  const s = q.toString();
  return `/${portal}/sign-in${s ? `?${s}` : ""}`;
};

export interface DestinationInput {
  portal: Portal | null;
  next: string | null;
  hasMerchant: boolean;
  isAdmin: boolean;
}

/**
 * Where to send someone after they sign in. Access itself is still enforced
 * server-side; this only picks the page. Orders without a business goes to
 * setup (saved answers resume there); Spaces without a workspace lands in the
 * Library, which shows workspace creation.
 */
export const resolvePostAuthDestination = ({ portal, next, hasMerchant, isAdmin }: DestinationInput): string => {
  const n = safeNext(next);
  if (n) return n;
  if (portal === "spaces") return PORTALS.spaces.landing;
  if (portal === "orders") return hasMerchant ? PORTALS.orders.landing : "/orders/get-started";
  if (isAdmin) return "/admin/overview";
  return hasMerchant ? PORTALS.orders.landing : "/orders/get-started";
};
