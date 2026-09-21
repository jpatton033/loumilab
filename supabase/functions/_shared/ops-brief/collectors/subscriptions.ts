import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatMoney, formatWhen, metric } from "../util.ts";

interface SubscriptionRow {
  merchant_id: string;
  plan_slug: string;
  interval: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  livemode: boolean;
  created_at: string;
  updated_at: string;
}

/** Plan subscriptions on Stripe Billing — real rows, with no estimates. */
export const subscriptionsCollector: Collector = {
  key: "subscriptions",
  title: "Subscriptions",
  module: "orders",
  async collect(ctx) {
    const { window, previous, settings } = ctx;

    const [{ data: subs }, { data: merchants }, { data: plans }] = await Promise.all([
      ctx.db
        .from("merchant_subscriptions")
        .select(
          "merchant_id, plan_slug, interval, status, cancel_at_period_end, current_period_end, livemode, created_at, updated_at",
        ),
      ctx.db.from("merchants").select("id, business_name"),
      ctx.db.from("orders_plans").select("slug, monthly_price_cents, annual_price_cents"),
    ]);

    const rows2 = (subs ?? []) as SubscriptionRow[];
    const nameById = new Map(
      ((merchants ?? []) as { id: string; business_name: string }[]).map((m) => [m.id, m.business_name]),
    );
    const priceBySlug = new Map(
      ((plans ?? []) as { slug: string; monthly_price_cents: number | null; annual_price_cents: number | null }[]).map(
        (p) => [p.slug, p],
      ),
    );

    const active = rows2.filter((s) => s.status === "active" || s.status === "trialing");
    const newInWindow = rows2.filter(
      (s) => new Date(s.created_at) >= window.start && new Date(s.created_at) < window.end,
    );
    const newInPrevious = rows2.filter(
      (s) => new Date(s.created_at) >= previous.start && new Date(s.created_at) < previous.end,
    );
    const cancelling = rows2.filter((s) => s.cancel_at_period_end);
    const pastDue = rows2.filter((s) => s.status === "past_due" || s.status === "unpaid");

    const mrr = active.reduce((total, s) => {
      const price = priceBySlug.get(s.plan_slug);
      if (!price) return total;
      if (s.interval === "annual" || s.interval === "year") {
        return total + Math.round((price.annual_price_cents ?? 0) / 12);
      }
      return total + (price.monthly_price_cents ?? 0);
    }, 0);

    const rows: Row[] = [
      { label: "Active subscriptions", value: formatInt(active.length) },
      { label: "Started this period", value: formatInt(newInWindow.length) },
      { label: "Cancelling at period end", value: formatInt(cancelling.length) },
      { label: "Payment problems", value: formatInt(pastDue.length) },
      { label: "Recurring revenue (monthly equivalent)", value: formatMoney(mrr) },
    ];

    const items: ListItem[] = rows2.slice(0, 6).map((s) => ({
      title: nameById.get(s.merchant_id) ?? "Merchant",
      meta: `${s.plan_slug} · ${s.status}`,
      detail: s.current_period_end
        ? `Renews ${formatWhen(s.current_period_end, settings.timezone)}${s.livemode ? "" : " · test mode"}`
        : s.livemode
          ? undefined
          : "Test mode",
      severity: s.status === "past_due" || s.status === "unpaid" ? "important" : undefined,
    }));

    for (const s of pastDue) {
      ctx.actions.push({
        severity: "important",
        title: `${nameById.get(s.merchant_id) ?? "A merchant"}'s plan payment failed`,
        detail: `Subscription status is ${s.status} on the ${s.plan_slug} plan.`,
        system: "Loumilab Orders — Subscriptions",
        detectedAt: s.updated_at,
        recommendedAction: "Contact the merchant to update their card before the plan lapses.",
        linkPath: "/admin/plans",
      });
    }

    if (newInWindow.length > 0) {
      ctx.changes.push({
        direction: "up",
        text: `${newInWindow.length} new plan subscription${newInWindow.length === 1 ? "" : "s"}`,
      });
    }

    return {
      key: "subscriptions",
      title: "Subscriptions",
      status: "live",
      metrics: [
        metric("Active subscriptions", formatInt(active.length), {
          current: newInWindow.length,
          previous: newInPrevious.length,
        }),
        metric("Monthly recurring", formatMoney(mrr)),
        metric("Cancelling", formatInt(cancelling.length), { positiveIsGood: false }),
      ],
      rows,
      items,
      emptyLine:
        rows2.length === 0
          ? "No merchant is on a billing plan yet, so there is no subscription activity to report."
          : undefined,
      linkPath: "/admin/plans",
      linkLabel: "Manage plans",
    };
  },
};
