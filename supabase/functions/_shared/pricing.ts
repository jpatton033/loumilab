import { admin } from "./auth.ts";
import { platformFeeCents } from "./fees.ts";

/**
 * Money authority for storefront orders.
 *
 * Delivery charges, the merchant's surcharge and the customer's share of the
 * Loumilab + Stripe fees are all derived here from database values. Nothing the
 * browser sends about money is trusted.
 */

export interface DeliveryTier {
  max_miles: number;
  fee_cents: number;
}

export interface StoreFeeSettings {
  delivery_fee_cents: number;
  delivery_tiers: unknown;
  service_fee_cents: number;
  service_fee_label: string;
  customer_fee_share_bps: number;
  location?: string | null;
}

/** Stripe's standard US online card rate, used to size the customer's share. */
const STRIPE_PCT_BPS = 290;
const STRIPE_FIXED_CENTS = 30;

export const parseTiers = (value: unknown): DeliveryTier[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((t) => {
      const obj = (t ?? {}) as Record<string, unknown>;
      const miles = Number(obj.max_miles);
      const fee = Number(obj.fee_cents);
      if (!Number.isFinite(miles) || !Number.isFinite(fee)) return null;
      return { max_miles: Math.max(0, miles), fee_cents: Math.max(0, Math.round(fee)) };
    })
    .filter((t): t is DeliveryTier => t !== null)
    .sort((a, b) => a.max_miles - b.max_miles)
    .slice(0, 8);
};

const EARTH_MILES = 3958.8;

const haversineMiles = (
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Best-effort geocode. Returns null when the address can't be resolved. */
async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query.trim()) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url, {
      headers: { "User-Agent": "LoumilabOrders/1.0 (hello@loumilab.com)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat?: string; lon?: string }[];
    const first = rows?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch (err) {
    console.error("geocode failed", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Delivery distance between the store and the customer, in miles, or null when
 * either address can't be resolved (the flat delivery fee is used instead).
 */
export async function deliveryDistanceMiles(
  storeLocation: string | null | undefined,
  address: string,
): Promise<number | null> {
  if (!storeLocation) return null;
  const [from, to] = await Promise.all([geocode(storeLocation), geocode(address)]);
  if (!from || !to) return null;
  return haversineMiles(from, to);
}

/** Fee for a distance under the merchant's tiers, or null when out of range. */
export const tierFeeCents = (tiers: DeliveryTier[], miles: number): number | null => {
  const match = tiers.find((t) => miles <= t.max_miles);
  return match ? match.fee_cents : (tiers.at(-1)?.fee_cents ?? null);
};

export interface OrderPricing {
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  customerFeeCents: number;
  merchantFeeCents: number;
  platformFeeCents: number;
  estimatedStripeFeeCents: number;
  totalCents: number;
  distanceMiles: number | null;
  serviceFeeLabel: string;
}

/**
 * Full money breakdown for an order.
 *
 * - Loumilab's platform fee is charged on merchandise only — never on tax,
 *   tips, delivery or the surcharge.
 * - The customer's share of the Loumilab + Stripe cost is added as a visible
 *   line, never hidden in item prices.
 */
export async function priceOrder(opts: {
  store: StoreFeeSettings;
  subtotalCents: number;
  fulfilment: "pickup" | "delivery";
  deliveryAddress?: string;
  feeBps: number;
  customerShareBps: number;
}): Promise<OrderPricing> {
  const { store, subtotalCents, fulfilment, feeBps } = opts;
  const tiers = parseTiers(store.delivery_tiers);

  let deliveryFeeCents = 0;
  let distanceMiles: number | null = null;

  if (fulfilment === "delivery") {
    deliveryFeeCents = store.delivery_fee_cents;
    if (tiers.length && opts.deliveryAddress) {
      distanceMiles = await deliveryDistanceMiles(store.location, opts.deliveryAddress);
      if (distanceMiles !== null) {
        const tiered = tierFeeCents(tiers, distanceMiles);
        if (tiered !== null) deliveryFeeCents = tiered;
      } else {
        console.log("delivery tiers skipped: address could not be geocoded");
      }
    }
  }

  const serviceFeeCents = fulfilment === "delivery" ? Math.max(0, store.service_fee_cents) : 0;
  const platform = platformFeeCents(subtotalCents, feeBps);

  const preTotal = subtotalCents + deliveryFeeCents + serviceFeeCents;
  const estimatedStripeFeeCents = Math.round((preTotal * STRIPE_PCT_BPS) / 10000) + STRIPE_FIXED_CENTS;

  const shareBps = Math.min(Math.max(opts.customerShareBps, 0), 10000);
  const totalCost = platform + estimatedStripeFeeCents;
  const customerFeeCents = Math.max(0, Math.round((totalCost * shareBps) / 10000));
  const merchantFeeCents = Math.max(0, totalCost - customerFeeCents);

  return {
    subtotalCents,
    deliveryFeeCents,
    serviceFeeCents,
    customerFeeCents,
    merchantFeeCents,
    platformFeeCents: platform,
    estimatedStripeFeeCents,
    totalCents: preTotal + customerFeeCents,
    distanceMiles,
    serviceFeeLabel: store.service_fee_label || "Service fee",
  };
}

/**
 * The share of fees the customer pays: a Super Admin override on the business
 * wins over the merchant's own storefront setting.
 */
export async function resolveCustomerShareBps(
  merchantId: string,
  storefrontShareBps: number,
): Promise<number> {
  const { data: merchant } = await admin
    .from("merchants")
    .select("fee_share_override_bps")
    .eq("id", merchantId)
    .maybeSingle();

  const override = merchant?.fee_share_override_bps;
  const bps = typeof override === "number" ? override : storefrontShareBps;
  return Math.min(Math.max(bps ?? 0, 0), 10000);
}
