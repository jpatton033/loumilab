import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen } from "../util.ts";

const SENSITIVE_ACTIONS = [
  "plan.fee_changed",
  "plan.price_changed",
  "plan.updated",
  "plan.created",
  "plan.deactivated",
  "merchant.override",
  "merchant.suspended",
  "payout.policy_changed",
  "refund.decision",
  "role.granted",
  "role.revoked",
  "settings.updated",
];

const isSensitive = (action: string) =>
  SENSITIVE_ACTIONS.includes(action) ||
  /fee|price|payout|refund|role|permission|suspend|override|policy|threshold/i.test(action);

const fmtBps = (bps: number | null | undefined) =>
  bps == null ? "—" : `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`;

/**
 * Pricing & Policy Changes — the financial-configuration safeguard. Every
 * platform-fee or plan-pricing change is reported explicitly with the previous
 * value, the new value, the effective date and who made it.
 */
export const pricingChangesCollector: Collector = {
  key: "pricing",
  title: "Pricing & Policy Changes",
  module: "orders",
  async collect(ctx) {
    const { db, window, settings } = ctx;

    const { data: feeRows } = await db
      .from("orders_plan_fee_changes")
      .select("plan_id, old_fee_bps, new_fee_bps, effective_from, reason, created_at")
      .gte("created_at", window.start.toISOString())
      .lt("created_at", window.end.toISOString())
      .order("created_at", { ascending: false });

    const { data: planRows } = await db.from("orders_plans").select("id, name, slug");
    const planName = new Map((planRows ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));

    const { data: auditRows } = await db
      .from("audit_logs")
      .select("action, actor_email, old_value, new_value, reason, created_at")
      .gte("created_at", window.start.toISOString())
      .lt("created_at", window.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    const audits = (auditRows ?? []).filter((a: { action: string }) => isSensitive(a.action));

    const items: ListItem[] = [];

    for (const f of feeRows ?? []) {
      items.push({
        title: `Platform fee changed — ${planName.get(f.plan_id) ?? "Plan"}`,
        meta: `Previous ${fmtBps(f.old_fee_bps)} → New ${fmtBps(f.new_fee_bps)}`,
        detail: [
          `Effective ${formatWhen(f.effective_from, settings.timezone)}`,
          f.reason ? `Reason: ${f.reason}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        linkPath: "/admin/plans",
        linkLabel: "View plans",
        severity: "important",
      });

      ctx.actions.push({
        severity: "important",
        title: `Platform fee changed on ${planName.get(f.plan_id) ?? "a plan"}`,
        detail: `${fmtBps(f.old_fee_bps)} → ${fmtBps(f.new_fee_bps)}, effective ${formatWhen(f.effective_from, settings.timezone)}.`,
        system: "Loumilab Orders — Pricing",
        detectedAt: f.created_at,
        recommendedAction: "Confirm this change was intended; it directly affects Loumilab revenue and merchant payouts.",
        linkPath: "/admin/plans",
      });
      ctx.changes.push({
        direction: "warn",
        text: `Platform fee changed on ${planName.get(f.plan_id) ?? "a plan"} (${fmtBps(f.old_fee_bps)} → ${fmtBps(f.new_fee_bps)})`,
      });
    }

    for (const a of audits) {
      items.push({
        title: `${a.action}`,
        meta: a.actor_email ?? "Super Admin",
        detail: [a.reason, formatWhen(a.created_at, settings.timezone)].filter(Boolean).join(" · "),
        linkPath: "/admin/audit-log",
        linkLabel: "View audit log",
        severity: "review",
      });
    }

    return {
      key: "pricing",
      title: "Pricing & Policy Changes",
      status: "live",
      items,
      emptyLine: items.length === 0 ? "No pricing, fee or policy changes were made." : undefined,
    };
  },
};

/** Administrative Changes + compact Audit Summary. */
export const auditCollector: Collector = {
  key: "audit",
  title: "Administrative Activity",
  module: "platform",
  async collect(ctx) {
    const { db, window, settings } = ctx;

    const { data: rows } = await db
      .from("audit_logs")
      .select("action, target_type, actor_email, reason, created_at")
      .gte("created_at", window.start.toISOString())
      .lt("created_at", window.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    const audits = rows ?? [];
    const sensitive = audits.filter((a: { action: string }) => isSensitive(a.action));

    const byAction = new Map<string, number>();
    for (const a of audits) byAction.set(a.action, (byAction.get(a.action) ?? 0) + 1);

    const summaryRows: Row[] = [
      { label: "Recorded admin actions", value: formatInt(audits.length) },
      { label: "Sensitive / financial actions", value: formatInt(sensitive.length) },
    ];
    for (const [action, count] of [...byAction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      summaryRows.push({ label: action, value: formatInt(count) });
    }

    const items: ListItem[] = sensitive.slice(0, 8).map((a: {
      action: string;
      actor_email: string | null;
      target_type: string | null;
      created_at: string;
    }) => ({
      title: a.action,
      meta: [a.actor_email ?? "Super Admin", a.target_type].filter(Boolean).join(" · "),
      detail: formatWhen(a.created_at, settings.timezone),
      linkPath: "/admin/audit-log",
      linkLabel: "View audit log",
    }));

    return {
      key: "audit",
      title: "Administrative Activity",
      status: "live",
      rows: summaryRows,
      items,
      emptyLine: audits.length === 0 ? "No administrative changes were recorded." : undefined,
      linkPath: "/admin/audit-log",
      linkLabel: "View full audit log",
    };
  },
};
