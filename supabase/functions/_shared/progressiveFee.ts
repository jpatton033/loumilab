/**
 * Pure progressive (marginal) platform fee rule — no Deno/Node imports so the
 * site calculator and unit tests use the exact same maths as checkout.
 *
 * Tier i covers monthly volume above thresholds[i-1] up to and including
 * thresholds[i]. Each cent is charged the rate of the tier it falls in; the
 * order's fee is rounded half-up once, in whole cents.
 */
export interface FeeTiers {
  /** Ascending upper bounds in cents, e.g. [250000, 500000, 1000000]. */
  thresholds: number[];
  /** Per-plan rates in basis points, one more than thresholds. */
  rates: Record<string, number[]>;
}

export interface FeeSlice {
  tier: number;
  bps: number;
  cents: number;
}

export interface ProgressiveFee {
  feeCents: number;
  slices: FeeSlice[];
}

const clamp = (bps: number) => Math.min(Math.max(Math.round(bps), 0), 1000);

export const planRates = (tiers: FeeTiers | null | undefined, plan: string): number[] | null => {
  const r = tiers?.rates?.[plan];
  if (!tiers || !Array.isArray(r) || r.length !== tiers.thresholds.length + 1) return null;
  return r.map(clamp);
};

/** Fee for `amountCents` of new sales when the month already has `volumeStartCents`. */
export function progressiveFee(
  tiers: FeeTiers,
  plan: string,
  volumeStartCents: number,
  amountCents: number,
): ProgressiveFee | null {
  const rates = planRates(tiers, plan);
  if (!rates) return null;
  const bounds = [...tiers.thresholds, Infinity];
  let cursor = Math.max(0, Math.round(volumeStartCents));
  let remaining = Math.max(0, Math.round(amountCents));
  const slices: FeeSlice[] = [];
  let weighted = 0; // cents × bps
  for (let i = 0; i < bounds.length && remaining > 0; i++) {
    const room = bounds[i] - cursor;
    if (room <= 0) continue;
    const take = Math.min(room, remaining);
    slices.push({ tier: i, bps: rates[i], cents: take });
    weighted += take * rates[i];
    cursor += take;
    remaining -= take;
  }
  return { feeCents: Math.floor(weighted / 10000 + 0.5), slices };
}

/** Rate that applies to the next cent of sales at a given volume. */
export function marginalBps(tiers: FeeTiers, plan: string, volumeCents: number): number | null {
  const rates = planRates(tiers, plan);
  if (!rates) return null;
  const i = tiers.thresholds.findIndex((t) => volumeCents < t);
  return rates[i === -1 ? rates.length - 1 : i];
}

/** Next threshold above the volume, or null at the top tier. */
export function nextThreshold(tiers: FeeTiers, volumeCents: number): number | null {
  return tiers.thresholds.find((t) => volumeCents < t) ?? null;
}
