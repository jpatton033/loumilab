import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen, metric } from "../util.ts";

const PLAN_LABELS: Record<string, string> = {
  launch: "Launch",
  starter: "Starter",
  business: "Business",
  custom: "Custom",
};

const PAYOUT_LABELS: Record<string, string> = {
  not_started: "Not started",
  onboarding: "Onboarding",
  pending_verification: "Pending verification",
  restricted: "Restricted",
  payout_enabled: "Payout enabled",
  disabled: "Disabled",
};

/** Merchant roster, plan mix and verification state — all live data today. */
export const merchantsCollector: Collector = {
  key: "merchants",
  title: "Merchants",
  module: "orders",
  async collect(ctx) {
    const { db, window, previous, settings } = ctx;

    const [{ data: all }, { data: accounts }] = await Promise.all([
      db.from("merchants").select("id, business_name, plan_slug, accepting_orders, created_at"),
      db
        .from("merchant_stripe_accounts")
        .select("merchant_id, payout_status, requirements_due, requirements_disabled_reason, livemode, updated_at"),
    ]);

    const merchants = all ?? [];
    const stripeAccounts = accounts ?? [];

    const inWindow = merchants.filter(
      (m: { created_at: string }) =>
        new Date(m.created_at) >= window.start && new Date(m.created_at) < window.end,
    );
    const inPrevious = merchants.filter(
      (m: { created_at: string }) =>
        new Date(m.created_at) >= previous.start && new Date(m.created_at) < previous.end,
    );

    const planCounts = new Map<string, number>();
    for (const m of merchants) planCounts.set(m.plan_slug, (planCounts.get(m.plan_slug) ?? 0) + 1);

    const payoutCounts = new Map<string, number>();
    for (const a of stripeAccounts) payoutCounts.set(a.payout_status, (payoutCounts.get(a.payout_status) ?? 0) + 1);

    const nameById = new Map(merchants.map((m: { id: string; business_name: string }) => [m.id, m.business_name]));

    const rows: Row[] = [
      { label: "Total merchants", value: formatInt(merchants.length) },
      { label: "New this period", value: formatInt(inWindow.length) },
      { label: "Accepting orders", value: formatInt(merchants.filter((m: { accepting_orders: boolean }) => m.accepting_orders).length) },
      { label: "Payments set up", value: formatInt(stripeAccounts.length) },
    ];

    for (const [slug, count] of [...planCounts.entries()].sort()) {
      rows.push({ label: `Plan — ${PLAN_LABELS[slug] ?? slug}`, value: formatInt(count) });
    }
    for (const [status, count] of [...payoutCounts.entries()].sort()) {
      rows.push({ label: `Payouts — ${PAYOUT_LABELS[status] ?? status}`, value: formatInt(count) });
    }

    // Merchants that genuinely need Loumilab attention.
    const needsAttention = stripeAccounts.filter(
      (a: { payout_status: string }) =>
        a.payout_status === "restricted" || a.payout_status === "disabled" || a.payout_status === "pending_verification",
    );

    const items: ListItem[] = needsAttention.slice(0, 8).map((a: {
      merchant_id: string;
      payout_status: string;
      requirements_disabled_reason: string | null;
      updated_at: string;
    }) => ({
      title: nameById.get(a.merchant_id) ?? "Merchant",
      meta: PAYOUT_LABELS[a.payout_status] ?? a.payout_status,
      detail: a.requirements_disabled_reason
        ? `Stripe reason: ${a.requirements_disabled_reason}`
        : `Last updated ${formatWhen(a.updated_at, settings.timezone)}`,
      linkPath: "/admin/orders",
      linkLabel: "View merchant",
      severity: a.payout_status === "disabled" ? "important" : "review",
    }));

    for (const a of needsAttention) {
      if (a.payout_status === "disabled" || a.payout_status === "restricted") {
        ctx.actions.push({
          severity: a.payout_status === "disabled" ? "critical" : "important",
          title: `${nameById.get(a.merchant_id) ?? "A merchant"} cannot receive payouts`,
          detail: a.requirements_disabled_reason ?? "Stripe has restricted this connected account.",
          system: "Loumilab Orders — Payouts",
          detectedAt: a.updated_at,
          recommendedAction: "Review the merchant's Stripe requirements and contact them to finish verification.",
          linkPath: "/admin/orders",
        });
      }
    }

    if (inWindow.length > 0) {
      ctx.changes.push({
        direction: "up",
        text: `${inWindow.length} new merchant${inWindow.length === 1 ? "" : "s"} registered`,
      });
    }

    const verifying = payoutCounts.get("pending_verification") ?? 0;
    if (verifying > 0) {
      ctx.watch.push(
        `${verifying} merchant${verifying === 1 ? "" : "s"} still awaiting Stripe verification — they cannot accept orders until payouts are enabled.`,
      );
    }

    return {
      key: "merchants",
      title: "Merchants",
      status: "live",
      metrics: [
        metric("Total merchants", formatInt(merchants.length)),
        metric("New merchants", formatInt(inWindow.length), {
          current: inWindow.length,
          previous: inPrevious.length,
        }),
        metric("Verification issues", formatInt(needsAttention.length), { positiveIsGood: false }),
      ],
      rows,
      items,
      emptyLine:
        merchants.length === 0
          ? "No merchants have registered yet."
          : needsAttention.length === 0
            ? "No merchant verification or payout issues."
            : undefined,
      linkPath: "/admin/orders",
      linkLabel: "View merchants",
      note:
        "Upgrades, downgrades and cancellations appear here once plan subscriptions are live.",
    };
  },
};
